-- Use concrete required UUID/revision inputs so generated PostgREST types match
-- the route contract. Revision 0 creates the supplied look ID; later revisions
-- update that same look and require the original inspiration asset ID.
create or replace function public.persist_inspiration_revision(
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
  v_look_id uuid := p_look_id;
  v_revision integer;
  v_existing public.looks;
  v_piece jsonb;
  v_piece_id uuid;
  v_position integer := 0;
  v_affected integer;
begin
  if p_workspace_id is null or p_look_id is null or p_expected_revision is null or p_asset_id is null
    or p_title is null or char_length(btrim(p_title)) not between 1 and 120
    or p_notes is null or char_length(p_notes) > 4000
    or p_provider_metadata is null or jsonb_typeof(p_provider_metadata) <> 'object'
    or p_pieces is null or jsonb_typeof(p_pieces) <> 'array'
    or jsonb_array_length(p_pieces) > 20
    or p_source_type not in ('live', 'manual', 'sample') then
    raise exception using errcode = '22023', message = 'Invalid inspiration revision.';
  end if;

  if p_expected_revision = 0 then
    if jsonb_array_length(p_pieces) = 0 then
      raise exception using errcode = '22023', message = 'Initial analysis requires detected garments.';
    end if;
    if exists (select 1 from public.looks l where l.workspace_id=p_workspace_id and l.id=p_look_id) then
      raise exception using errcode = '23505', message = 'Look already exists.';
    end if;
    if not exists (
      select 1 from public.assets a
      where a.workspace_id=p_workspace_id and a.id=p_asset_id
        and a.bucket='inspiration' and a.deleted_at is null
    ) then
      raise exception using errcode = '23503', message = 'Inspiration asset is unavailable.';
    end if;
    insert into public.looks(
      id, workspace_id, title, notes, inspiration_asset_id, status, revision, source_type, provider_metadata
    ) values (
      p_look_id, p_workspace_id, btrim(p_title), p_notes, p_asset_id, 'analyzed', 1, p_source_type, p_provider_metadata
    );
    v_revision := 1;
  else
    select * into v_existing from public.looks l
    where l.workspace_id=p_workspace_id and l.id=p_look_id
    for update;
    if not found then
      raise exception using errcode = 'P0002', message = 'Look not found.';
    end if;
    if p_expected_revision <> v_existing.revision then
      raise exception using errcode = '40001', message = 'Look revision conflict.';
    end if;
    if p_asset_id <> v_existing.inspiration_asset_id then
      raise exception using errcode = '22023', message = 'The inspiration asset cannot change in a piece revision.';
    end if;
    v_revision := v_existing.revision + 1;
    update public.looks set
      title=btrim(p_title), notes=p_notes, status='reviewed', revision=v_revision,
      updated_at=now(), selected_option_id=null
    where workspace_id=p_workspace_id and id=p_look_id;
    update public.inspiration_pieces as piece set removed_at=now()
    where piece.workspace_id=p_workspace_id and piece.look_id=p_look_id and piece.removed_at is null;
    delete from public.wardrobe_matches m
    using public.inspiration_pieces p
    where m.workspace_id=p_workspace_id and m.piece_id=p.id and p.look_id=p_look_id;
  end if;

  for v_piece in select value from jsonb_array_elements(p_pieces)
  loop
    if jsonb_typeof(v_piece) <> 'object'
      or nullif(btrim(v_piece->>'name'),'') is null
      or jsonb_typeof(v_piece->'attributes') <> 'object'
      or jsonb_typeof(v_piece->'provenance') <> 'object'
      or jsonb_typeof(v_piece->'corrections') <> 'object'
      or (v_piece->>'source_type') not in ('live','manual','sample') then
      raise exception using errcode='22023', message='Invalid detected garment.';
    end if;
    v_piece_id := coalesce(nullif(v_piece->>'id','')::uuid, gen_random_uuid());
    insert into public.inspiration_pieces(
      id,workspace_id,look_id,name,category,attributes,provenance,corrections,
      confidence,source_type,position,removed_at
    ) values (
      v_piece_id,p_workspace_id,p_look_id,btrim(v_piece->>'name'),v_piece->>'category',
      v_piece->'attributes',v_piece->'provenance',v_piece->'corrections',
      nullif(v_piece->>'confidence','')::numeric,v_piece->>'source_type',v_position,null
    ) on conflict (id) do update set
      name=excluded.name,category=excluded.category,attributes=excluded.attributes,
      provenance=excluded.provenance,corrections=excluded.corrections,
      confidence=excluded.confidence,source_type=excluded.source_type,
      position=excluded.position,removed_at=null
    where public.inspiration_pieces.workspace_id=p_workspace_id
      and public.inspiration_pieces.look_id=p_look_id;
    get diagnostics v_affected=row_count;
    if v_affected <> 1 then
      raise exception using errcode='22023', message='Piece does not belong to this look.';
    end if;
    v_position := v_position+1;
  end loop;

  return query select v_look_id,v_revision;
end;
$$;
