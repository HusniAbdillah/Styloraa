-- The caller is the Next.js server. p_workspace_id must come from its environment,
-- never a browser payload; this shared demo has no per-user identity.
create function public.save_look(
  p_workspace_id uuid,
  p_title text,
  p_notes text,
  p_item_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_look_id uuid;
  item_count integer;
begin
  if p_workspace_id is null
    or p_title is null
    or char_length(btrim(p_title)) not between 1 and 120
    or p_notes is null
    or char_length(p_notes) > 4000
    or p_item_ids is null
    or cardinality(p_item_ids) not between 1 and 20
    or array_ndims(p_item_ids) is distinct from 1 then
    raise exception using errcode = '22023', message = 'Invalid saved look input.';
  end if;

  if array_position(p_item_ids, null) is not null then
    raise exception using errcode = '22023', message = 'Invalid saved look input.';
  end if;

  select count(distinct item_id) into item_count
  from unnest(p_item_ids) as items(item_id);
  if item_count <> cardinality(p_item_ids) then
    raise exception using errcode = '22023', message = 'Choose each wardrobe item once.';
  end if;

  select count(*) into item_count
  from public.wardrobe_items
  where workspace_id = p_workspace_id and id = any(p_item_ids);
  if item_count <> cardinality(p_item_ids) then
    raise exception using errcode = '22023', message = 'Some wardrobe items are unavailable.';
  end if;

  insert into public.looks(workspace_id, title, notes, is_saved)
  values (p_workspace_id, btrim(p_title), p_notes, true)
  returning id into new_look_id;

  insert into public.look_items(workspace_id, look_id, wardrobe_item_id, position)
  select p_workspace_id, new_look_id, item_id, (ordinality - 1)::integer
  from unnest(p_item_ids) with ordinality as items(item_id, ordinality);

  return new_look_id;
end;
$$;

revoke all on function public.save_look(uuid, text, text, uuid[])
  from public, anon, authenticated;
grant execute on function public.save_look(uuid, text, text, uuid[]) to service_role;
