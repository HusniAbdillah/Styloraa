begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(10);

select ok(not has_table_privilege('anon', 'public.wardrobe_items', 'SELECT'), 'anon cannot read wardrobe');
select ok(not has_table_privilege('authenticated', 'public.wardrobe_items', 'INSERT'), 'authenticated cannot write wardrobe');
select ok(not has_table_privilege('anon', 'public.ai_jobs', 'INSERT'), 'anon cannot create paid AI jobs');
select ok(not has_table_privilege('authenticated', 'public.ai_jobs', 'UPDATE'), 'authenticated cannot forge AI results');
select is((select count(*)::integer from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in ('workspaces','wardrobe_items','user_preferences','looks','look_items','capsules','capsule_items','ai_jobs') and c.relrowsecurity), 8, 'RLS enabled on every application table');
select is((select public from storage.buckets where id='wardrobe'), false, 'wardrobe bucket is private');

insert into public.workspaces(id,name) values ('00000000-0000-4000-8000-000000000002','second test workspace');
insert into public.wardrobe_items(id,workspace_id,name,category)
values ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','Other workspace top','top');
insert into public.looks(id,workspace_id,title)
values ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Test look');
insert into public.capsules(id,workspace_id,title)
values ('30000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Test capsule');

select throws_ok($$insert into public.look_items(look_id,wardrobe_item_id,workspace_id)
  values ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001')$$,
  '23503', null, 'look cannot reference item in another workspace');
select throws_ok($$insert into public.capsule_items(capsule_id,wardrobe_item_id,workspace_id)
  values ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001')$$,
  '23503', null, 'capsule cannot reference item in another workspace');
select throws_ok($$insert into public.wardrobe_items(workspace_id,name,category,image_path)
  values ('00000000-0000-4000-8000-000000000001','Bad path','top','00000000-0000-4000-8000-000000000002/image.webp')$$,
  '23514', null, 'storage path must belong to row workspace');
set local role anon;
select throws_ok('select * from public.looks', '42501', null, 'anonymous Data API reads are denied');
reset role;

select * from finish();
rollback;
