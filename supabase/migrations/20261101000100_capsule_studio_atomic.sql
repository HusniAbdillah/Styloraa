-- Save the brief, metadata and exact selected inventory in one transaction.
create function public.save_capsule_studio(
  p_workspace_id uuid, p_title text, p_description text,
  p_brief jsonb, p_item_ids uuid[], p_timeframe text default null, p_season text default null,
  p_occasion text default null, p_capsule_id uuid default null, p_expected_revision integer default null
) returns uuid language plpgsql security invoker set search_path='' as $$
declare saved_id uuid; current_revision integer; valid_count integer;
begin
  if p_workspace_id is null or p_title is null or char_length(btrim(p_title)) not between 1 and 120
    or p_description is null or char_length(p_description)>4000
    or p_brief is null or jsonb_typeof(p_brief)<>'object' or octet_length(p_brief::text)>16000
    or coalesce(char_length(p_timeframe),0)>120 or coalesce(char_length(p_season),0)>120
    or coalesce(char_length(p_occasion),0)>120
    or p_item_ids is null or cardinality(p_item_ids) not between 1 and 100
    or array_ndims(p_item_ids) is distinct from 1 or array_position(p_item_ids,null) is not null then
    raise exception using errcode='22023', message='Invalid capsule input.';
  end if;
  select count(distinct id) into valid_count from unnest(p_item_ids) as ids(id);
  if valid_count<>cardinality(p_item_ids) then
    raise exception using errcode='22023', message='Choose each wardrobe item once.';
  end if;
  if p_capsule_id is not null then
    select revision into current_revision from public.capsules
      where workspace_id=p_workspace_id and id=p_capsule_id for update;
    if not found then raise exception using errcode='P0002', message='Capsule is unavailable.'; end if;
    if p_expected_revision is null or current_revision<>p_expected_revision then
      raise exception using errcode='40001', message='The capsule changed. Reload before saving.';
    end if;
  end if;
  perform 1 from public.wardrobe_items where workspace_id=p_workspace_id and id=any(p_item_ids) for share;
  select count(*) into valid_count from public.wardrobe_items
    where workspace_id=p_workspace_id and id=any(p_item_ids) and archived_at is null;
  if valid_count<>cardinality(p_item_ids) then
    raise exception using errcode='22023', message='Some owned pieces are unavailable.';
  end if;
  if p_capsule_id is null then
    saved_id=public.create_capsule(p_workspace_id,p_title,p_description,p_brief,p_item_ids);
    update public.capsules set timeframe=p_timeframe,season=p_season,occasion=p_occasion
      where workspace_id=p_workspace_id and id=saved_id;
  else
    saved_id=p_capsule_id;
    delete from public.capsule_items where workspace_id=p_workspace_id and capsule_items.capsule_id=p_capsule_id
      and not (wardrobe_item_id=any(p_item_ids));
    insert into public.capsule_items(workspace_id,capsule_id,wardrobe_item_id)
      select p_workspace_id,p_capsule_id,id from unnest(p_item_ids) as ids(id)
      on conflict (workspace_id,capsule_id,wardrobe_item_id) do nothing;
    update public.capsules set title=btrim(p_title),description=p_description,brief=p_brief,
      timeframe=p_timeframe,season=p_season,occasion=p_occasion,revision=current_revision+1
      where workspace_id=p_workspace_id and id=p_capsule_id;
  end if;
  return saved_id;
end;
$$;
revoke all on function public.save_capsule_studio(uuid,text,text,jsonb,uuid[],text,text,text,uuid,integer) from public,anon,authenticated;
grant execute on function public.save_capsule_studio(uuid,text,text,jsonb,uuid[],text,text,text,uuid,integer) to service_role;
