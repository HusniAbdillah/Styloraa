-- Atomic persistence for Owner 2's inspiration analysis, wardrobe matches,
-- and the three recommendation options. Existing migrations stay immutable.

create function public.persist_inspiration_revision(
  p_workspace_id uuid,
  p_look_id uuid,
  p_expected_revision integer,
  p_asset_id uuid,
  p_title text,
  p_notes text,
  p_provider_metadata jsonb,
  p_pieces jsonb,
  p_source_type text
)
returns table(look_id uuid, revision integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_look_id uuid;
  v_revision integer;
  v_existing public.looks;
  v_piece jsonb;
  v_piece_id uuid;
  v_position integer := 0;
  v_affected integer;
begin
  if p_workspace_id is null
    or p_title is null
    or char_length(btrim(p_title)) not between 1 and 120
    or p_notes is null
    or char_length(p_notes) > 4000
    or p_provider_metadata is null
    or jsonb_typeof(p_provider_metadata) <> 'object'
    or p_pieces is null
    or jsonb_typeof(p_pieces) <> 'array'
    or jsonb_array_length(p_pieces) > 20
    or p_source_type not in ('live', 'manual', 'sample') then
    raise exception using errcode = '22023', message = 'Invalid inspiration revision.';
  end if;

  if p_look_id is null then
    if p_expected_revision is not null or p_asset_id is null or jsonb_array_length(p_pieces) = 0 then
      raise exception using errcode = '22023', message = 'Invalid initial inspiration analysis.';
    end if;
    if not exists (
      select 1 from public.assets a
      where a.workspace_id = p_workspace_id
        and a.id = p_asset_id
        and a.bucket = 'inspiration'
        and a.deleted_at is null
    ) then
      raise exception using errcode = '23503', message = 'Inspiration asset is unavailable.';
    end if;
    insert into public.looks as created_look(
      workspace_id, title, notes, inspiration_asset_id, status, revision, source_type, provider_metadata
    ) values (
      p_workspace_id, btrim(p_title), p_notes, p_asset_id, 'analyzed', 1, p_source_type, p_provider_metadata
    ) returning created_look.id, created_look.revision into v_look_id, v_revision;
  else
    select * into v_existing from public.looks l
    where l.workspace_id = p_workspace_id and l.id = p_look_id
    for update;
    if not found then
      raise exception using errcode = 'P0002', message = 'Look not found.';
    end if;
    if p_expected_revision is null or p_expected_revision <> v_existing.revision then
      raise exception using errcode = '40001', message = 'Look revision conflict.';
    end if;
    if p_asset_id is not null and p_asset_id <> v_existing.inspiration_asset_id then
      raise exception using errcode = '22023', message = 'The inspiration asset cannot be replaced in a piece revision.';
    end if;
    v_look_id := v_existing.id;
    v_revision := v_existing.revision + 1;
    update public.looks set
      title = btrim(p_title), notes = p_notes, status = 'reviewed', revision = v_revision,
      updated_at = now(), selected_option_id = null
    where workspace_id = p_workspace_id and id = v_look_id;
    update public.inspiration_pieces set removed_at = now()
    where workspace_id = p_workspace_id and look_id = v_look_id and removed_at is null;
    delete from public.wardrobe_matches m
    using public.inspiration_pieces p
    where m.workspace_id = p_workspace_id and m.piece_id = p.id and p.look_id = v_look_id;
  end if;

  for v_piece in select value from jsonb_array_elements(p_pieces)
  loop
    if jsonb_typeof(v_piece) <> 'object'
      or nullif(btrim(v_piece->>'name'), '') is null
      or jsonb_typeof(v_piece->'attributes') <> 'object'
      or jsonb_typeof(v_piece->'provenance') <> 'object'
      or jsonb_typeof(v_piece->'corrections') <> 'object'
      or (v_piece->>'source_type') not in ('live', 'manual', 'sample') then
      raise exception using errcode = '22023', message = 'Invalid detected garment.';
    end if;
    v_piece_id := coalesce(nullif(v_piece->>'id', '')::uuid, gen_random_uuid());
    insert into public.inspiration_pieces(
      id, workspace_id, look_id, name, category, attributes, provenance, corrections,
      confidence, source_type, position, removed_at
    ) values (
      v_piece_id, p_workspace_id, v_look_id, btrim(v_piece->>'name'), v_piece->>'category',
      v_piece->'attributes', v_piece->'provenance', v_piece->'corrections',
      nullif(v_piece->>'confidence', '')::numeric, v_piece->>'source_type', v_position, null
    ) on conflict (id) do update set
      name = excluded.name,
      category = excluded.category,
      attributes = excluded.attributes,
      provenance = excluded.provenance,
      corrections = excluded.corrections,
      confidence = excluded.confidence,
      source_type = excluded.source_type,
      position = excluded.position,
      removed_at = null
    where public.inspiration_pieces.workspace_id = p_workspace_id
      and public.inspiration_pieces.look_id = v_look_id;
    get diagnostics v_affected = row_count;
    if v_affected <> 1 then
      raise exception using errcode = '22023', message = 'Piece does not belong to this look.';
    end if;
    v_position := v_position + 1;
  end loop;

  return query select v_look_id, v_revision;
end;
$$;

create function public.persist_look_results(
  p_workspace_id uuid,
  p_look_id uuid,
  p_expected_revision integer,
  p_replace_matches boolean,
  p_matches jsonb,
  p_options jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_look public.looks;
  v_match jsonb;
  v_option record;
  v_item record;
  v_option_id uuid;
  v_active_pieces integer;
  v_match_pieces integer;
  v_options_count integer;
  v_option_types integer;
begin
  if p_workspace_id is null or p_look_id is null or p_expected_revision is null
    or p_matches is null or jsonb_typeof(p_matches) <> 'array'
    or p_options is null or jsonb_typeof(p_options) <> 'array'
    or (p_replace_matches is false and jsonb_array_length(p_matches) <> 0) then
    raise exception using errcode = '22023', message = 'Invalid look result payload.';
  end if;
  select * into v_look from public.looks l
  where l.workspace_id = p_workspace_id and l.id = p_look_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Look not found.';
  end if;
  if v_look.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Look revision conflict.';
  end if;

  v_options_count := jsonb_array_length(p_options);
  if v_options_count not in (0, 3) then
    raise exception using errcode = '22023', message = 'Exactly three outfit options are required.';
  end if;
  if v_options_count = 3 then
    select count(distinct item->>'option_type') into v_option_types
    from jsonb_array_elements(p_options) as options(item);
    if v_option_types <> 3 or exists (
      select 1 from jsonb_array_elements(p_options) as options(item)
      where item->>'option_type' not in ('closest', 'from_wardrobe', 'fresh_alternative')
    ) then
      raise exception using errcode = '22023', message = 'Outfit option types must be distinct and complete.';
    end if;
    if exists (
      select 1 from public.outfit_options o
      where o.workspace_id = p_workspace_id and o.look_id = p_look_id
        and o.source_revision = p_expected_revision
    ) then
      raise exception using errcode = '23505', message = 'Options already exist for this revision.';
    end if;
  end if;

  if p_replace_matches then
    select count(*) into v_active_pieces from public.inspiration_pieces p
    where p.workspace_id = p_workspace_id and p.look_id = p_look_id and p.removed_at is null;
    select count(*) into v_match_pieces
    from jsonb_array_elements(p_matches) as matches(item);
    if v_active_pieces <> v_match_pieces
      or exists (
        select 1 from public.inspiration_pieces p
        where p.workspace_id=p_workspace_id and p.look_id=p_look_id and p.removed_at is null
          and not exists (select 1 from jsonb_array_elements(p_matches) as matches(item)
            where (item->>'piece_id')::uuid=p.id)
      )
      or exists (
        select 1 from jsonb_array_elements(p_matches) as matches(item)
        where not exists (select 1 from public.inspiration_pieces p
          where p.workspace_id=p_workspace_id and p.look_id=p_look_id and p.removed_at is null
            and p.id=(item->>'piece_id')::uuid)
      ) then
      raise exception using errcode = '22023', message = 'Each active garment must have exactly one match.';
    end if;
    delete from public.wardrobe_matches m
    using public.inspiration_pieces p
    where m.workspace_id = p_workspace_id and m.piece_id = p.id
      and p.look_id = p_look_id and p.removed_at is null;
    for v_match in select value from jsonb_array_elements(p_matches)
    loop
      insert into public.wardrobe_matches(
        workspace_id, piece_id, wardrobe_item_id, match_type, rationale,
        shared_attributes, differences, confidence, source_revision,
        is_manual_override, source_type
      ) values (
        p_workspace_id, (v_match->>'piece_id')::uuid,
        nullif(v_match->>'wardrobe_item_id', '')::uuid,
        v_match->>'match_type', btrim(v_match->>'rationale'),
        coalesce(v_match->'shared_attributes', '{}'::jsonb),
        coalesce(v_match->'differences', '{}'::jsonb),
        nullif(v_match->>'confidence', '')::numeric, v_look.revision,
        coalesce((v_match->>'is_manual_override')::boolean, false), v_match->>'source_type'
      );
    end loop;
    update public.looks set status = 'matched', updated_at = now()
    where workspace_id = p_workspace_id and id = p_look_id;
  end if;

  if v_options_count = 3 then
    for v_option in
      select * from jsonb_to_recordset(p_options) as x(
        option_type text, title text, rationale text, inputs_used jsonb,
        uncertainty text, provider_metadata jsonb, source_type text, items jsonb
      )
    loop
      insert into public.outfit_options(
        workspace_id, look_id, option_type, title, rationale, inputs_used,
        uncertainty, provider_metadata, source_type, source_revision
      ) values (
        p_workspace_id, p_look_id, v_option.option_type, btrim(v_option.title),
        btrim(v_option.rationale), coalesce(v_option.inputs_used, '{}'::jsonb),
        coalesce(v_option.uncertainty, ''), coalesce(v_option.provider_metadata, '{}'::jsonb),
        v_option.source_type, v_look.revision
      ) returning id into v_option_id;
      for v_item in
        select * from jsonb_to_recordset(coalesce(v_option.items, '[]'::jsonb)) as x(
          slot_id text, piece_id uuid, item_kind text, wardrobe_item_id uuid,
          product_id uuid, missing_brief text, rationale text, position integer
        )
      loop
        insert into public.outfit_option_items(
          workspace_id, look_id, option_id, slot_id, piece_id, item_kind,
          wardrobe_item_id, product_id, missing_brief, rationale, position
        ) values (
          p_workspace_id, p_look_id, v_option_id, v_item.slot_id, v_item.piece_id,
          v_item.item_kind, v_item.wardrobe_item_id, v_item.product_id,
          v_item.missing_brief, coalesce(v_item.rationale, ''), coalesce(v_item.position, 0)
        );
      end loop;
    end loop;
    update public.looks set status = 'options_ready', updated_at = now()
    where workspace_id = p_workspace_id and id = p_look_id;
  end if;

  return jsonb_build_object('lookId', p_look_id, 'revision', v_look.revision,
    'matchesPersisted', p_replace_matches, 'optionsPersisted', v_options_count = 3);
end;
$$;

revoke all on function public.persist_inspiration_revision(uuid, uuid, integer, uuid, text, text, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.persist_inspiration_revision(uuid, uuid, integer, uuid, text, text, jsonb, jsonb, text)
  to service_role;
revoke all on function public.persist_look_results(uuid, uuid, integer, boolean, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.persist_look_results(uuid, uuid, integer, boolean, jsonb, jsonb)
  to service_role;
