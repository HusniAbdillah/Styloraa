-- No authentication: one explicitly shared demo workspace, accessed only by the
-- Next.js server. RLS is deny-by-default for every public Data API client.
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (category in ('top','bottom','dress','outerwear','shoes','accessory')),
  color text not null default '' check (char_length(color) <= 80),
  image_path text check (image_path is null or image_path like workspace_id::text || '/%'),
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);
create index wardrobe_items_workspace_created_idx on public.wardrobe_items (workspace_id, created_at desc);

create table public.user_preferences (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  style_notes text not null default '' check (char_length(style_notes) <= 4000),
  updated_at timestamptz not null default now()
);

create table public.looks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  notes text not null default '' check (char_length(notes) <= 4000),
  is_saved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);
create index looks_workspace_created_idx on public.looks (workspace_id, created_at desc);

create table public.look_items (
  look_id uuid not null,
  wardrobe_item_id uuid not null,
  workspace_id uuid not null,
  position integer not null default 0 check (position >= 0),
  primary key (look_id, wardrobe_item_id),
  foreign key (workspace_id, look_id) references public.looks(workspace_id, id) on delete cascade,
  foreign key (workspace_id, wardrobe_item_id) references public.wardrobe_items(workspace_id, id) on delete cascade
);
create index look_items_wardrobe_idx on public.look_items (workspace_id, wardrobe_item_id);

create table public.capsules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 4000),
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);
create index capsules_workspace_created_idx on public.capsules (workspace_id, created_at desc);

create table public.capsule_items (
  capsule_id uuid not null,
  wardrobe_item_id uuid not null,
  workspace_id uuid not null,
  primary key (capsule_id, wardrobe_item_id),
  foreign key (workspace_id, capsule_id) references public.capsules(workspace_id, id) on delete cascade,
  foreign key (workspace_id, wardrobe_item_id) references public.wardrobe_items(workspace_id, id) on delete cascade
);
create index capsule_items_wardrobe_idx on public.capsule_items (workspace_id, wardrobe_item_id);

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null check (kind in ('matching','preview','capsule')),
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  provider_job_id text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_jobs_workspace_created_idx on public.ai_jobs (workspace_id, created_at desc);

-- Explicit grants prevent Data API exposure even when default privileges change.
do $$
declare relation text;
begin
  foreach relation in array array['workspaces','wardrobe_items','user_preferences','looks','look_items','capsules','capsule_items','ai_jobs'] loop
    execute format('alter table public.%I enable row level security', relation);
    execute format('revoke all on public.%I from public, anon, authenticated', relation);
    execute format('grant select, insert, update, delete on public.%I to service_role', relation);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wardrobe', 'wardrobe', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
-- No storage.objects client policies. Server provides short-lived signed upload
-- and download URLs only for paths under the fixed server workspace prefix.

-- Required deployment data belongs in the migration (hosted db push skips seed).
insert into public.workspaces (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Stylora demo');
insert into public.user_preferences (workspace_id)
values ('00000000-0000-4000-8000-000000000001');
