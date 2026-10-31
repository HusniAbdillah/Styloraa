-- Additive contract for PRD 34c3ca8. Existing manual wardrobe/look clients remain valid.
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bucket text not null check (bucket in ('wardrobe','inspiration','previews')),
  storage_path text not null check (storage_path like workspace_id::text || '/%'),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  byte_size integer not null check (byte_size between 1 and 10485760),
  source_type text not null check (source_type in ('manual','live','sample')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (workspace_id, id), unique (bucket, storage_path)
);

alter table public.wardrobe_items
  add column subcategory text check (char_length(subcategory) <= 120),
  add column notes text not null default '' check (char_length(notes) <= 4000),
  add column attributes jsonb not null default '{}' check (jsonb_typeof(attributes)='object'),
  add column inferred_attributes jsonb not null default '{}' check (jsonb_typeof(inferred_attributes)='object'),
  add column attribute_provenance jsonb not null default '{}' check (jsonb_typeof(attribute_provenance)='object'),
  add column asset_id uuid,
  add column updated_at timestamptz not null default now(),
  add column archived_at timestamptz,
  add foreign key (workspace_id, asset_id) references public.assets(workspace_id, id);
create index wardrobe_items_asset_idx on public.wardrobe_items(workspace_id, asset_id);

alter table public.user_preferences
  add column style_dna jsonb not null default '{}' check (jsonb_typeof(style_dna)='object'),
  add column fit_preferences jsonb not null default '{}' check (jsonb_typeof(fit_preferences)='object'),
  add column body_profile jsonb not null default '{}' check (jsonb_typeof(body_profile)='object');

alter table public.looks
  add column inspiration_asset_id uuid,
  add column status text not null default 'draft' check (status in ('draft','analyzed','reviewed','matched','options_ready')),
  add column revision integer not null default 1 check (revision > 0),
  add column source_type text not null default 'manual' check (source_type in ('manual','live','sample')),
  add column provider_metadata jsonb not null default '{}' check (jsonb_typeof(provider_metadata)='object'),
  add column updated_at timestamptz not null default now(),
  add foreign key (workspace_id, inspiration_asset_id) references public.assets(workspace_id, id);
create index looks_inspiration_asset_idx on public.looks(workspace_id, inspiration_asset_id);

-- Referenced garments must remain visible as unavailable, not vanish from saved content.
alter table public.look_items drop constraint look_items_workspace_id_wardrobe_item_id_fkey;
alter table public.look_items add foreign key (workspace_id, wardrobe_item_id)
  references public.wardrobe_items(workspace_id, id) on delete restrict;
alter table public.capsule_items drop constraint capsule_items_workspace_id_wardrobe_item_id_fkey;
alter table public.capsule_items add foreign key (workspace_id, wardrobe_item_id)
  references public.wardrobe_items(workspace_id, id) on delete restrict;
alter table public.capsule_items add unique (workspace_id, capsule_id, wardrobe_item_id);
create index look_items_workspace_look_idx on public.look_items(workspace_id, look_id);
create index capsule_items_workspace_capsule_idx on public.capsule_items(workspace_id, capsule_id);

create table public.inspiration_pieces (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  look_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  category text not null check (char_length(category) between 1 and 80),
  attributes jsonb not null default '{}' check (jsonb_typeof(attributes)='object'),
  provenance jsonb not null default '{}' check (jsonb_typeof(provenance)='object'),
  corrections jsonb not null default '{}' check (jsonb_typeof(corrections)='object'),
  confidence numeric check (confidence between 0 and 1),
  source_type text not null check (source_type in ('manual','live','sample')),
  position integer not null default 0 check (position >= 0),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, id), unique (workspace_id, look_id, id),
  foreign key (workspace_id, look_id) references public.looks(workspace_id,id) on delete cascade
);
create index inspiration_pieces_look_idx on public.inspiration_pieces(workspace_id,look_id,position);

create table public.wardrobe_matches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  piece_id uuid not null,
  wardrobe_item_id uuid,
  match_type text not null check (match_type in ('owned_match','wardrobe_alternative','missing')),
  rationale text not null check (char_length(btrim(rationale)) between 1 and 4000),
  shared_attributes jsonb not null default '{}' check (jsonb_typeof(shared_attributes)='object'),
  differences jsonb not null default '{}' check (jsonb_typeof(differences)='object'),
  confidence numeric check (confidence between 0 and 1),
  source_revision integer not null check (source_revision > 0),
  is_manual_override boolean not null default false,
  source_type text not null check (source_type in ('manual','live','sample')),
  check ((match_type='missing' and wardrobe_item_id is null)
    or (match_type<>'missing' and wardrobe_item_id is not null)),
  foreign key (workspace_id,piece_id) references public.inspiration_pieces(workspace_id,id) on delete cascade,
  foreign key (workspace_id,wardrobe_item_id) references public.wardrobe_items(workspace_id,id) on delete restrict
);
create index wardrobe_matches_piece_idx on public.wardrobe_matches(workspace_id,piece_id);
create index wardrobe_matches_item_idx on public.wardrobe_matches(workspace_id,wardrobe_item_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (char_length(provider) between 1 and 80),
  provider_product_id text not null check (char_length(provider_product_id) between 1 and 512),
  title text not null check (char_length(btrim(title)) between 1 and 500),
  category text not null check (char_length(category) between 1 and 80),
  source_label text not null check (char_length(source_label) between 1 and 240),
  product_url text not null check (product_url ~ '^https?://[^[:space:]]+$'),
  image_url text check (image_url ~ '^https?://[^[:space:]]+$'),
  price_minor bigint check (price_minor between 0 and 9007199254740991),
  shipping_minor bigint check (shipping_minor between 0 and 9007199254740991),
  currency text check (currency ~ '^[A-Z]{3}$'),
  rating numeric check (rating between 0 and 5),
  review_count integer check (review_count >= 0),
  source_type text not null check (source_type in ('live','sample')),
  commercial_disclosure text check (char_length(commercial_disclosure) <= 1000),
  retrieved_at timestamptz not null,
  check ((price_minor is null and shipping_minor is null) or currency is not null),
  unique (workspace_id,id), unique (workspace_id,provider,provider_product_id)
);

create table public.outfit_options (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  look_id uuid not null,
  option_type text not null check (option_type in ('closest','from_wardrobe','fresh_alternative')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  rationale text not null check (char_length(btrim(rationale)) between 1 and 4000),
  inputs_used jsonb not null default '{}' check (jsonb_typeof(inputs_used)='object'),
  uncertainty text not null default '' check (char_length(uncertainty) <= 4000),
  provider_metadata jsonb not null default '{}' check (jsonb_typeof(provider_metadata)='object'),
  source_type text not null check (source_type in ('manual','live','sample')),
  source_revision integer not null check (source_revision > 0),
  created_at timestamptz not null default now(),
  unique (workspace_id,id), unique (workspace_id,look_id,id),
  unique (workspace_id,look_id,source_revision,option_type),
  foreign key (workspace_id,look_id) references public.looks(workspace_id,id) on delete cascade
);

create table public.outfit_option_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  look_id uuid not null,
  option_id uuid not null,
  slot_id text not null check (char_length(slot_id) between 1 and 80),
  piece_id uuid,
  item_kind text not null check (item_kind in ('owned','missing','product')),
  wardrobe_item_id uuid,
  product_id uuid,
  missing_brief text,
  rationale text not null default '' check (char_length(rationale) <= 4000),
  position integer not null default 0 check (position >= 0),
  check ((item_kind='owned' and wardrobe_item_id is not null and product_id is null and missing_brief is null)
    or (item_kind='product' and wardrobe_item_id is null and product_id is not null and missing_brief is null)
    or (item_kind='missing' and wardrobe_item_id is null and product_id is null and missing_brief is not null and char_length(btrim(missing_brief)) between 1 and 1000)),
  unique (workspace_id,id), unique (workspace_id,option_id,slot_id),
  foreign key (workspace_id,look_id,option_id) references public.outfit_options(workspace_id,look_id,id) on delete cascade,
  foreign key (workspace_id,look_id,piece_id) references public.inspiration_pieces(workspace_id,look_id,id),
  foreign key (workspace_id,wardrobe_item_id) references public.wardrobe_items(workspace_id,id) on delete restrict,
  foreign key (workspace_id,product_id) references public.products(workspace_id,id) on delete restrict
);
create index outfit_option_items_option_idx on public.outfit_option_items(workspace_id,look_id,option_id);
create index outfit_option_items_piece_idx on public.outfit_option_items(workspace_id,look_id,piece_id);
create index outfit_option_items_wardrobe_idx on public.outfit_option_items(workspace_id,wardrobe_item_id);
create index outfit_option_items_product_idx on public.outfit_option_items(workspace_id,product_id);

alter table public.looks add column selected_option_id uuid;
alter table public.looks add foreign key (workspace_id,id,selected_option_id)
  references public.outfit_options(workspace_id,look_id,id) on delete restrict;

create table public.shopping_searches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  option_item_id uuid not null,
  query text not null check (char_length(btrim(query)) between 2 and 240),
  provider text not null check (char_length(provider) between 1 and 80),
  country text not null default 'id' check (country ~ '^[a-z]{2}$'),
  status text not null check (status in ('running','succeeded','empty','failed','unavailable')),
  score_weights jsonb not null default '{"price":0.3,"rating":0.2,"relevance":0.5}' check (jsonb_typeof(score_weights)='object'),
  score_version text not null default 'v1',
  error_code text,
  created_at timestamptz not null default now(),
  unique (workspace_id,id),
  check (score_weights ?& array['price','rating','relevance']
    and score_weights - array['price','rating','relevance'] = '{}'::jsonb
    and jsonb_typeof(score_weights->'price')='number'
    and jsonb_typeof(score_weights->'rating')='number'
    and jsonb_typeof(score_weights->'relevance')='number'
    and (score_weights->>'price')::numeric between 0 and 1
    and (score_weights->>'rating')::numeric between 0 and 1
    and (score_weights->>'relevance')::numeric between 0 and 1
    and (score_weights->>'price')::numeric+(score_weights->>'rating')::numeric+(score_weights->>'relevance')::numeric=1),
  foreign key (workspace_id,option_item_id) references public.outfit_option_items(workspace_id,id) on delete cascade
);
create index shopping_searches_item_idx on public.shopping_searches(workspace_id,option_item_id);

create table public.shopping_results (
  workspace_id uuid not null,
  search_id uuid not null,
  product_id uuid not null,
  position integer not null check (position >= 0),
  factors jsonb not null default '{}' check (jsonb_typeof(factors)='object'),
  value_score numeric check (value_score between 0 and 1),
  explanation text not null default '' check (char_length(explanation) <= 4000),
  primary key (search_id,product_id),
  foreign key (workspace_id,search_id) references public.shopping_searches(workspace_id,id) on delete cascade,
  foreign key (workspace_id,product_id) references public.products(workspace_id,id) on delete restrict
);
create index shopping_results_search_idx on public.shopping_results(workspace_id,search_id);
create index shopping_results_product_idx on public.shopping_results(workspace_id,product_id);

create table public.saved_look_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  look_id uuid not null,
  option_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  source_revision integer not null check (source_revision > 0),
  items jsonb not null check (jsonb_typeof(items)='array' and jsonb_array_length(items) between 1 and 20),
  rationale text not null default '',
  inputs_used jsonb not null default '{}' check (jsonb_typeof(inputs_used)='object'),
  uncertainty text not null default '',
  provider_metadata jsonb not null default '{}' check (jsonb_typeof(provider_metadata)='object'),
  source_type text not null check (source_type in ('manual','live','sample')),
  created_at timestamptz not null default now(),
  unique (workspace_id,id),
  foreign key (workspace_id,look_id) references public.looks(workspace_id,id) on delete restrict,
  foreign key (workspace_id,look_id,option_id) references public.outfit_options(workspace_id,look_id,id) on delete restrict
);
create index saved_look_snapshots_look_idx on public.saved_look_snapshots(workspace_id,look_id,option_id);
create index saved_look_snapshots_created_idx on public.saved_look_snapshots(workspace_id,created_at desc);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  saved_look_id uuid not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  catchphrase text not null default '' check (char_length(catchphrase) <= 240),
  public_snapshot jsonb not null check (jsonb_typeof(public_snapshot)='object'),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  foreign key (workspace_id,saved_look_id) references public.saved_look_snapshots(workspace_id,id) on delete cascade
);
create index share_links_saved_idx on public.share_links(workspace_id,saved_look_id);

alter table public.capsules
  add column timeframe text check (char_length(timeframe) <= 120),
  add column season text check (char_length(season) <= 120),
  add column occasion text check (char_length(occasion) <= 120),
  add column brief jsonb not null default '{}' check (jsonb_typeof(brief)='object'),
  add column missing_additions jsonb not null default '[]' check (jsonb_typeof(missing_additions)='array'),
  add column revision integer not null default 1 check (revision > 0),
  add column updated_at timestamptz not null default now();

create table public.capsule_outfits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  capsule_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  rationale text not null check (char_length(btrim(rationale)) between 1 and 4000),
  inputs_used jsonb not null default '{}' check (jsonb_typeof(inputs_used)='object'),
  uncertainty text not null default '',
  source_type text not null check (source_type in ('manual','live','sample')),
  source_revision integer not null check (source_revision > 0),
  created_at timestamptz not null default now(),
  unique (workspace_id,id), unique (workspace_id,capsule_id,id),
  foreign key (workspace_id,capsule_id) references public.capsules(workspace_id,id) on delete cascade
);
create index capsule_outfits_capsule_idx on public.capsule_outfits(workspace_id,capsule_id);

create table public.capsule_outfit_items (
  workspace_id uuid not null,
  capsule_id uuid not null,
  outfit_id uuid not null,
  wardrobe_item_id uuid not null,
  position integer not null default 0 check (position >= 0),
  primary key (outfit_id,wardrobe_item_id),
  foreign key (workspace_id,capsule_id,outfit_id) references public.capsule_outfits(workspace_id,capsule_id,id) on delete cascade,
  foreign key (workspace_id,capsule_id,wardrobe_item_id) references public.capsule_items(workspace_id,capsule_id,wardrobe_item_id) on delete restrict
);
create index capsule_outfit_items_outfit_idx on public.capsule_outfit_items(workspace_id,capsule_id,outfit_id);
create index capsule_outfit_items_member_idx on public.capsule_outfit_items(workspace_id,capsule_id,wardrobe_item_id);

alter table public.ai_jobs drop constraint ai_jobs_kind_check;
alter table public.ai_jobs
  add constraint ai_jobs_kind_check check (kind in ('analysis','matching','outfit_generation','preview','capsule')),
  add column look_id uuid,
  add column wardrobe_item_id uuid,
  add column product_id uuid,
  add column option_id uuid,
  add column capsule_outfit_id uuid,
  add column input_asset_id uuid,
  add column output_asset_id uuid,
  add column source_type text not null default 'manual' check (source_type in ('manual','live','sample')),
  add column provider text,
  add column model text,
  add column source_revision integer check (source_revision > 0),
  add column preview_mode text check (preview_mode in ('single','combo')),
  add column model_source text check (model_source in ('mannequin','provider_model')),
  add column consent_acknowledged_at timestamptz,
  add column limitations_acknowledged_at timestamptz,
  add column completed_at timestamptz,
  add foreign key (workspace_id,look_id) references public.looks(workspace_id,id) on delete restrict,
  add foreign key (workspace_id,wardrobe_item_id) references public.wardrobe_items(workspace_id,id) on delete restrict,
  add foreign key (workspace_id,product_id) references public.products(workspace_id,id) on delete restrict,
  add foreign key (workspace_id,option_id) references public.outfit_options(workspace_id,id) on delete restrict,
  add foreign key (workspace_id,look_id,option_id) references public.outfit_options(workspace_id,look_id,id) on delete restrict,
  add foreign key (workspace_id,capsule_outfit_id) references public.capsule_outfits(workspace_id,id) on delete restrict,
  add foreign key (workspace_id,input_asset_id) references public.assets(workspace_id,id) on delete restrict,
  add foreign key (workspace_id,output_asset_id) references public.assets(workspace_id,id) on delete restrict,
  add constraint job_option_has_look check (option_id is null or look_id is not null),
  add constraint preview_completed_has_result check (kind<>'preview' or status<>'succeeded'
    or (output_asset_id is not null and completed_at is not null)),
  add constraint preview_non_identifying_model check (kind <> 'preview' or (
    preview_mode is not null and model_source is not null
    and consent_acknowledged_at is not null and limitations_acknowledged_at is not null
    and ((preview_mode='single' and num_nonnulls(wardrobe_item_id,product_id)=1 and option_id is null and capsule_outfit_id is null)
      or (preview_mode='combo' and num_nonnulls(option_id,capsule_outfit_id)=1 and wardrobe_item_id is null and product_id is null))
  ));
create index ai_jobs_look_idx on public.ai_jobs(workspace_id,look_id);
create index ai_jobs_item_idx on public.ai_jobs(workspace_id,wardrobe_item_id);
create index ai_jobs_product_idx on public.ai_jobs(workspace_id,product_id);
create index ai_jobs_option_idx on public.ai_jobs(workspace_id,option_id);
create index ai_jobs_look_option_idx on public.ai_jobs(workspace_id,look_id,option_id);
create index ai_jobs_capsule_outfit_idx on public.ai_jobs(workspace_id,capsule_outfit_id);
create index ai_jobs_input_asset_idx on public.ai_jobs(workspace_id,input_asset_id);
create index ai_jobs_output_asset_idx on public.ai_jobs(workspace_id,output_asset_id);

create function public.guard_outfit_option() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if (new.id,new.workspace_id,new.look_id,new.source_revision,new.option_type)
    is distinct from (old.id,old.workspace_id,old.look_id,old.source_revision,old.option_type) then
    raise exception using errcode='23514', message='Generate a new option when its source or type changes.';
  end if;
  return new;
end;
$$;
create trigger guard_outfit_option before update on public.outfit_options
  for each row execute function public.guard_outfit_option();

create function public.guard_outfit_item() returns trigger language plpgsql security invoker set search_path='' as $$
declare parent_kind text;
begin
  if tg_op='DELETE' then
    perform 1 from public.outfit_options where workspace_id=old.workspace_id and id=old.option_id for update;
    return old;
  end if;
  if tg_op='UPDATE' and (new.workspace_id,new.option_id,new.look_id) is distinct from (old.workspace_id,old.option_id,old.look_id) then
    raise exception using errcode='23514', message='Outfit items cannot move between options.';
  end if;
  select option_type into parent_kind from public.outfit_options
    where workspace_id=new.workspace_id and id=new.option_id for update;
  if new.item_kind <> 'owned' and parent_kind='from_wardrobe' then
    raise exception using errcode='23514', message='From your wardrobe only accepts wardrobe items.';
  end if;
  return new;
end;
$$;
create trigger guard_outfit_item before insert or update or delete on public.outfit_option_items
  for each row execute function public.guard_outfit_item();

create function public.guard_shopping_search() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if not exists (select 1 from public.outfit_option_items where workspace_id=new.workspace_id
    and id=new.option_item_id and item_kind in ('missing','product')) then
    raise exception using errcode='23514', message='Shopping search requires a missing outfit piece.';
  end if;
  return new;
end;
$$;
create trigger guard_shopping_search before insert or update on public.shopping_searches
  for each row execute function public.guard_shopping_search();

create function public.guard_saved_snapshot() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  raise exception using errcode='23514', message='Saved look snapshots are immutable.';
end;
$$;
create trigger guard_saved_snapshot before update on public.saved_look_snapshots
  for each row execute function public.guard_saved_snapshot();

create function public.guard_share_snapshot() returns trigger language plpgsql security invoker set search_path='' as $$
declare saved public.saved_look_snapshots; safe_items jsonb;
begin
  if tg_op='UPDATE' then
    if (to_jsonb(new)-'revoked_at') is distinct from (to_jsonb(old)-'revoked_at')
      or (old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at) then
      raise exception using errcode='23514', message='Published shares only support revocation.';
    end if;
    return new;
  end if;
  select * into saved from public.saved_look_snapshots where workspace_id=new.workspace_id and id=new.saved_look_id;
  if not found then raise exception using errcode='23503', message='Saved look is unavailable.'; end if;
  select jsonb_agg(jsonb_build_object('name',item->>'name','category',item->>'category',
    'color',item->>'color','kind',item->>'kind') order by ordinal)
    into safe_items from jsonb_array_elements(saved.items) with ordinality as items(item,ordinal);
  new.public_snapshot=jsonb_build_object('title',saved.title,'items',safe_items,'source_type',saved.source_type);
  return new;
end;
$$;
create trigger guard_share_snapshot before insert or update on public.share_links
  for each row execute function public.guard_share_snapshot();

create or replace function public.save_look(p_workspace_id uuid,p_title text,p_notes text,p_item_ids uuid[])
returns uuid language plpgsql security invoker set search_path='' as $$
declare new_id uuid; item_count integer; snapshot_items jsonb;
begin
  if p_workspace_id is null or p_title is null or char_length(btrim(p_title)) not between 1 and 120
    or p_notes is null or char_length(p_notes)>4000 or p_item_ids is null
    or cardinality(p_item_ids) not between 1 and 20 or array_ndims(p_item_ids) is distinct from 1 then
    raise exception using errcode='22023', message='Invalid saved look input.';
  end if;
  if array_position(p_item_ids,null) is not null then
    raise exception using errcode='22023', message='Invalid saved look input.';
  end if;
  select count(distinct id) into item_count from unnest(p_item_ids) as ids(id);
  if item_count<>cardinality(p_item_ids) then
    raise exception using errcode='22023', message='Choose each wardrobe item once.';
  end if;
  select count(*) into item_count from public.wardrobe_items where workspace_id=p_workspace_id
    and id=any(p_item_ids) and archived_at is null;
  if item_count<>cardinality(p_item_ids) then
    raise exception using errcode='22023', message='Some wardrobe items are unavailable.';
  end if;
  insert into public.looks(workspace_id,title,notes,is_saved) values(p_workspace_id,btrim(p_title),p_notes,true)
    returning id into new_id;
  insert into public.look_items(workspace_id,look_id,wardrobe_item_id,position)
    select p_workspace_id,new_id,id,(ordinal-1)::integer from unnest(p_item_ids) with ordinality as ids(id,ordinal);
  select jsonb_agg(jsonb_build_object('wardrobe_item_id',w.id,'name',w.name,'category',w.category,
    'color',w.color,'kind','owned','attributes',w.attributes) order by li.position) into snapshot_items
    from public.look_items li join public.wardrobe_items w on w.workspace_id=li.workspace_id and w.id=li.wardrobe_item_id
    where li.workspace_id=p_workspace_id and li.look_id=new_id;
  insert into public.saved_look_snapshots(workspace_id,look_id,title,source_revision,items,source_type)
    values(p_workspace_id,new_id,btrim(p_title),1,snapshot_items,'manual');
  return new_id;
end;
$$;

create function public.save_outfit_option(p_workspace_id uuid,p_option_id uuid,p_expected_revision integer)
returns uuid language plpgsql security invoker set search_path='' as $$
declare selected public.outfit_options; parent public.looks; snapshot_items jsonb; snapshot_id uuid;
begin
  select * into selected from public.outfit_options where workspace_id=p_workspace_id and id=p_option_id for update;
  if not found then raise exception using errcode='22023', message='Outfit option is unavailable.'; end if;
  select * into parent from public.looks where workspace_id=p_workspace_id and id=selected.look_id for update;
  if p_expected_revision is null or parent.revision<>p_expected_revision or selected.source_revision<>parent.revision then
    raise exception using errcode='40001', message='The inspiration changed. Refresh outfit options.';
  end if;
  perform 1 from public.wardrobe_items w join public.outfit_option_items i
    on w.workspace_id=i.workspace_id and w.id=i.wardrobe_item_id
    where i.workspace_id=p_workspace_id and i.option_id=p_option_id for share of w;
  if exists (select 1 from public.outfit_option_items i join public.wardrobe_items w
    on w.workspace_id=i.workspace_id and w.id=i.wardrobe_item_id
    where i.workspace_id=p_workspace_id and i.option_id=p_option_id and w.archived_at is not null) then
    raise exception using errcode='22023', message='Some wardrobe items are unavailable.';
  end if;
  select jsonb_agg(jsonb_build_object('slot_id',i.slot_id,'kind',i.item_kind,
    'wardrobe_item_id',i.wardrobe_item_id,'product_id',i.product_id,
    'name',coalesce(w.name,p.title,i.missing_brief),'category',coalesce(w.category,p.category,'unspecified'),
    'color',w.color,'price_minor',p.price_minor,'currency',p.currency) order by i.position,i.slot_id)
    into snapshot_items from public.outfit_option_items i
    left join public.wardrobe_items w on w.workspace_id=i.workspace_id and w.id=i.wardrobe_item_id
    left join public.products p on p.workspace_id=i.workspace_id and p.id=i.product_id
    where i.workspace_id=p_workspace_id and i.option_id=p_option_id;
  if snapshot_items is null or jsonb_array_length(snapshot_items) not between 1 and 20 then
    raise exception using errcode='22023', message='Choose between one and twenty outfit pieces.';
  end if;
  update public.looks set selected_option_id=p_option_id,is_saved=true,updated_at=now()
    where workspace_id=p_workspace_id and id=selected.look_id;
  delete from public.look_items where workspace_id=p_workspace_id and look_id=selected.look_id;
  insert into public.look_items(workspace_id,look_id,wardrobe_item_id,position)
    select p_workspace_id,selected.look_id,wardrobe_item_id,min(position) from public.outfit_option_items
    where workspace_id=p_workspace_id and option_id=p_option_id and item_kind='owned' group by wardrobe_item_id;
  insert into public.saved_look_snapshots(workspace_id,look_id,option_id,title,source_revision,items,rationale,inputs_used,uncertainty,provider_metadata,source_type)
    values(p_workspace_id,selected.look_id,p_option_id,selected.title,parent.revision,snapshot_items,selected.rationale,selected.inputs_used,selected.uncertainty,selected.provider_metadata,selected.source_type)
    returning id into snapshot_id;
  return snapshot_id;
end;
$$;

create function public.create_share_link(p_workspace_id uuid,p_saved_look_id uuid,p_catchphrase text,p_expires_at timestamptz)
returns table(share_id uuid,share_token text) language plpgsql security invoker set search_path='' as $$
declare token text; new_id uuid;
begin
  if p_expires_at is null or p_expires_at<=now() or p_expires_at>now()+interval '30 days'
    or p_catchphrase is null or char_length(p_catchphrase)>240 then
    raise exception using errcode='22023', message='Invalid share settings.';
  end if;
  token=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  insert into public.share_links(workspace_id,saved_look_id,token_hash,catchphrase,public_snapshot,expires_at)
    values(p_workspace_id,p_saved_look_id,encode(sha256(convert_to(token,'UTF8')),'hex'),p_catchphrase,'{}',p_expires_at)
    returning id into new_id;
  return query select new_id,token;
end;
$$;

create function public.create_capsule(p_workspace_id uuid,p_title text,p_description text,p_brief jsonb,p_item_ids uuid[])
returns uuid language plpgsql security invoker set search_path='' as $$
declare new_id uuid; item_count integer;
begin
  if p_workspace_id is null or p_title is null or char_length(btrim(p_title)) not between 1 and 120
    or p_description is null or char_length(p_description)>4000
    or p_brief is null or jsonb_typeof(p_brief)<>'object' or octet_length(p_brief::text)>16000
    or p_item_ids is null or cardinality(p_item_ids) not between 1 and 100
    or array_ndims(p_item_ids) is distinct from 1 then
    raise exception using errcode='22023', message='Invalid capsule input.';
  end if;
  if array_position(p_item_ids,null) is not null then
    raise exception using errcode='22023', message='Invalid capsule input.';
  end if;
  select count(distinct id) into item_count from unnest(p_item_ids) as ids(id);
  if item_count<>cardinality(p_item_ids) then
    raise exception using errcode='22023', message='Choose each wardrobe item once.';
  end if;
  perform 1 from public.wardrobe_items where workspace_id=p_workspace_id and id=any(p_item_ids) for share;
  select count(*) into item_count from public.wardrobe_items
    where workspace_id=p_workspace_id and id=any(p_item_ids) and archived_at is null;
  if item_count<>cardinality(p_item_ids) then
    raise exception using errcode='22023', message='Some wardrobe items are unavailable.';
  end if;
  insert into public.capsules(workspace_id,title,description,brief)
    values(p_workspace_id,btrim(p_title),p_description,p_brief) returning id into new_id;
  insert into public.capsule_items(workspace_id,capsule_id,wardrobe_item_id)
    select p_workspace_id,new_id,id from unnest(p_item_ids) as ids(id);
  return new_id;
end;
$$;

create function public.create_capsule_from_saved_look(p_workspace_id uuid,p_saved_look_id uuid,p_title text,p_description text,p_brief jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare saved public.saved_look_snapshots; item_ids uuid[];
begin
  select * into saved from public.saved_look_snapshots where workspace_id=p_workspace_id and id=p_saved_look_id;
  if not found then raise exception using errcode='22023', message='Saved look is unavailable.'; end if;
  if exists (select 1 from jsonb_array_elements(saved.items) as items(item)
    where item->>'kind' is distinct from 'owned' or item->>'wardrobe_item_id' is null) then
    raise exception using errcode='22023', message='Only owned outfits can become a capsule.';
  end if;
  select array_agg((item->>'wardrobe_item_id')::uuid) into item_ids
    from jsonb_array_elements(saved.items) as items(item);
  return public.create_capsule(p_workspace_id,p_title,p_description,p_brief,item_ids);
end;
$$;

create function public.touch_updated_at() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  new.updated_at=now();
  return new;
end;
$$;

-- Preserve existing manual saves when the UI starts reading immutable snapshots.
insert into public.saved_look_snapshots(workspace_id,look_id,title,source_revision,items,source_type)
select l.workspace_id,l.id,l.title,l.revision,
  jsonb_agg(jsonb_build_object('wardrobe_item_id',w.id,'name',w.name,'category',w.category,
    'color',w.color,'kind','owned','attributes',w.attributes) order by li.position),'manual'
from public.looks l join public.look_items li on li.workspace_id=l.workspace_id and li.look_id=l.id
join public.wardrobe_items w on w.workspace_id=li.workspace_id and w.id=li.wardrobe_item_id
where l.is_saved group by l.workspace_id,l.id having count(*) between 1 and 20;

do $$
declare relation text; routine regprocedure;
begin
  foreach relation in array array['assets','inspiration_pieces','wardrobe_matches','products',
    'outfit_options','outfit_option_items','shopping_searches','shopping_results','saved_look_snapshots',
    'share_links','capsule_outfits','capsule_outfit_items'] loop
    execute format('alter table public.%I enable row level security',relation);
    execute format('revoke all on public.%I from public, anon, authenticated',relation);
    execute format('grant select,insert,update,delete on public.%I to service_role',relation);
  end loop;
  foreach relation in array array['wardrobe_items','user_preferences','looks','capsules','ai_jobs'] loop
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()',relation);
  end loop;
  for routine in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('guard_outfit_option','guard_outfit_item','guard_shopping_search',
      'guard_saved_snapshot','guard_share_snapshot','save_look','save_outfit_option','create_share_link',
      'create_capsule','create_capsule_from_saved_look','touch_updated_at') loop
    execute format('revoke all on function %s from public,anon,authenticated',routine);
    execute format('grant execute on function %s to service_role',routine);
  end loop;
end;
$$;
