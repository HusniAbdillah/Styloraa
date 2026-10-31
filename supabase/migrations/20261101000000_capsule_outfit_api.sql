-- Atomic capsule-outfit creation for the capsule studio API.
-- Outfit items must already belong to the capsule (enforced here and by the
-- capsule_outfit_items foreign key); archived wardrobe items are rejected.
create or replace function public.create_capsule_outfit(
  p_workspace_id uuid,
  p_capsule_id uuid,
  p_title text,
  p_rationale text,
  p_item_ids uuid[],
  p_source_type text default 'manual',
  p_inputs_used jsonb default '{}'
)
returns uuid language plpgsql security invoker set search_path='' as $$
declare new_id uuid; item_count integer;
begin
  if p_workspace_id is null or p_capsule_id is null
    or p_title is null or char_length(btrim(p_title)) not between 1 and 160
    or p_rationale is null or char_length(btrim(p_rationale)) not between 1 and 4000
    or p_source_type is null or p_source_type not in ('manual','live','sample')
    or p_inputs_used is null or jsonb_typeof(p_inputs_used) <> 'object'
    or p_item_ids is null or cardinality(p_item_ids) not between 1 and 20
    or array_ndims(p_item_ids) is distinct from 1 then
    raise exception using errcode='22023', message='Invalid capsule outfit input.';
  end if;
  if array_position(p_item_ids, null) is not null then
    raise exception using errcode='22023', message='Invalid capsule outfit input.';
  end if;
  select count(distinct id) into item_count from unnest(p_item_ids) as ids(id);
  if item_count <> cardinality(p_item_ids) then
    raise exception using errcode='22023', message='Choose each wardrobe item once.';
  end if;
  perform 1 from public.capsules
    where workspace_id = p_workspace_id and id = p_capsule_id for share;
  if not found then
    raise exception using errcode='22023', message='Capsule is unavailable.';
  end if;
  perform 1 from public.capsule_items
    where workspace_id = p_workspace_id and capsule_id = p_capsule_id for share;
  select count(*) into item_count from public.capsule_items ci
    join public.wardrobe_items w
      on w.workspace_id = ci.workspace_id and w.id = ci.wardrobe_item_id
    where ci.workspace_id = p_workspace_id and ci.capsule_id = p_capsule_id
      and ci.wardrobe_item_id = any(p_item_ids) and w.archived_at is null;
  if item_count <> cardinality(p_item_ids) then
    raise exception using errcode='22023',
      message='Outfit items must belong to the capsule and be available.';
  end if;
  insert into public.capsule_outfits(
    workspace_id, capsule_id, title, rationale, source_type, source_revision, inputs_used
  ) values (
    p_workspace_id, p_capsule_id, btrim(p_title), p_rationale,
    p_source_type, 1, p_inputs_used
  ) returning id into new_id;
  insert into public.capsule_outfit_items(
    workspace_id, capsule_id, outfit_id, wardrobe_item_id, position
  ) select p_workspace_id, p_capsule_id, new_id, id, (ordinal - 1)::integer
    from unnest(p_item_ids) with ordinality as ids(id, ordinal);
  return new_id;
end;
$$;

do $$
declare routine regprocedure;
begin
  for routine in select p.oid::regprocedure from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'create_capsule_outfit' loop
    execute format('revoke all on function %s from public, anon, authenticated', routine);
    execute format('grant execute on function %s to service_role', routine);
  end loop;
end;
$$;
