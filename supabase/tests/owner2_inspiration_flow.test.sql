begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into public.workspaces(id,name)
values ('50000000-0000-4000-8000-000000000001','Owner 2 synthetic workspace');
insert into public.assets(id,workspace_id,bucket,storage_path,mime_type,byte_size,source_type)
values ('51000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001',
  'inspiration','50000000-0000-4000-8000-000000000001/reference.png','image/png',100,'sample');

select ok(not has_function_privilege('anon',
  'public.persist_inspiration_revision(uuid,uuid,integer,uuid,text,text,jsonb,jsonb,text)','EXECUTE'),
  'anonymous clients cannot run inspiration persistence');
select ok(not has_function_privilege('authenticated',
  'public.persist_inspiration_revision(uuid,uuid,integer,uuid,text,text,jsonb,jsonb,text)','EXECUTE'),
  'authenticated clients cannot run inspiration persistence');
select ok(has_function_privilege('service_role',
  'public.persist_inspiration_revision(uuid,uuid,integer,uuid,text,text,jsonb,jsonb,text)','EXECUTE'),
  'only the server role can run inspiration persistence');
select ok(not has_function_privilege('anon',
  'public.persist_look_results(uuid,uuid,integer,boolean,jsonb,jsonb)','EXECUTE'),
  'anonymous clients cannot run look result persistence');
select ok(not has_function_privilege('authenticated',
  'public.persist_look_results(uuid,uuid,integer,boolean,jsonb,jsonb)','EXECUTE'),
  'authenticated clients cannot run look result persistence');
select ok(has_function_privilege('service_role',
  'public.persist_look_results(uuid,uuid,integer,boolean,jsonb,jsonb)','EXECUTE'),
  'only the server role can run look result persistence');
select ok((select count(*)=2 and bool_and(not p.prosecdef)
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('persist_inspiration_revision','persist_look_results')),
  'both functions are invoker-security functions');

create temporary table owner2_context as
select * from public.persist_inspiration_revision(
  '50000000-0000-4000-8000-000000000001', '53000000-0000-4000-8000-000000000001', 0,
  '51000000-0000-4000-8000-000000000001', 'Reference look', 'Everyday',
  '{"provider":"meta","model":"test-fixture"}'::jsonb,
  '[{"id":"52000000-0000-4000-8000-000000000001","name":"Ivory shirt","category":"top","attributes":{"colors":["ivory"]},"provenance":{"colors":{"source":"test"}},"corrections":{},"confidence":0.9,"source_type":"sample"}]'::jsonb,
  'sample'
);
select is((select revision from owner2_context),1,'analysis starts at revision one');
select is((select count(*)::integer from public.inspiration_pieces p
  join owner2_context c on p.workspace_id='50000000-0000-4000-8000-000000000001' and p.look_id=c.look_id
  where p.removed_at is null),1,'analysis persists the garment piece atomically');

select public.persist_look_results(
  '50000000-0000-4000-8000-000000000001',(select look_id from owner2_context),1,true,
  '[{"piece_id":"52000000-0000-4000-8000-000000000001","wardrobe_item_id":null,"match_type":"missing","rationale":"No sample item selected.","shared_attributes":{},"differences":{},"confidence":1,"is_manual_override":false,"source_type":"sample"}]'::jsonb,
  '[]'::jsonb
);
select is((select count(*)::integer from public.wardrobe_matches m
  join owner2_context c on m.workspace_id='50000000-0000-4000-8000-000000000001'
  join public.inspiration_pieces p on p.workspace_id=m.workspace_id and p.id=m.piece_id
  where p.look_id=c.look_id),1,'matching persists one truthful missing result');

select public.persist_look_results(
  '50000000-0000-4000-8000-000000000001',(select look_id from owner2_context),1,false,'[]'::jsonb,
  '[
    {"option_type":"closest","title":"Closest","rationale":"Reference-led.","inputs_used":{},"uncertainty":"","provider_metadata":{},"source_type":"sample","items":[]},
    {"option_type":"from_wardrobe","title":"From wardrobe","rationale":"No owned items yet.","inputs_used":{},"uncertainty":"Wardrobe is empty.","provider_metadata":{},"source_type":"sample","items":[]},
    {"option_type":"fresh_alternative","title":"Fresh","rationale":"A new direction.","inputs_used":{},"uncertainty":"","provider_metadata":{},"source_type":"sample","items":[]}
  ]'::jsonb
);
select is((select count(*)::integer from public.outfit_options o
  join owner2_context c on o.workspace_id='50000000-0000-4000-8000-000000000001' and o.look_id=c.look_id),3,
  'all three distinct options persist when inventory is empty');
select is((select status from public.looks l join owner2_context c on l.id=c.look_id),
  'options_ready','look status advances after recommendation persistence');
select throws_ok(
  format('select public.persist_look_results(%L,%L,99,false,%L,%L)',
    '50000000-0000-4000-8000-000000000001',(select look_id from owner2_context),'[]','[]'),
  'PT409',null,'stale revisions are rejected');

select * from finish();
rollback;
