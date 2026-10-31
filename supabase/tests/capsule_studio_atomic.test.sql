begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
insert into public.workspaces(id,name) values ('20000000-0000-4000-8000-000000000001','Studio verification');
insert into public.wardrobe_items(id,workspace_id,name,category,color) values
('20000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','Owned shirt','top','Ivory'),
('20000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','Owned trousers','bottom','Black'),
('20000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000001','Owned jacket','outerwear','Brown');

select lives_ok($$select public.save_capsule_studio(
  p_workspace_id=>'20000000-0000-4000-8000-000000000001',p_title=>'A considered week',p_description=>'Personal collection',
  p_brief=>'{"purpose":"Workdays","notes":"Bring fewer pieces","style_preferences":"Relaxed"}',
  p_item_ids=>array['20000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003']::uuid[],
  p_timeframe=>'Five days',p_season=>'Cool weather',p_occasion=>'Work')$$,'create persists a complete capsule');

select is((select brief->>'style_preferences' from public.capsules where workspace_id='20000000-0000-4000-8000-000000000001'),'Relaxed','personal brief persists');
select ok((select timeframe='Five days' and season='Cool weather' and occasion='Work' from public.capsules where workspace_id='20000000-0000-4000-8000-000000000001'),'all metadata persists');
select is((select count(*)::integer from public.capsule_items where workspace_id='20000000-0000-4000-8000-000000000001'),2,'exact selected inventory persists');

select throws_ok($$select public.save_capsule_studio(
 p_workspace_id=>'20000000-0000-4000-8000-000000000001',p_capsule_id=>(select id from public.capsules where workspace_id='20000000-0000-4000-8000-000000000001'),
 p_title=>'Invalid edit',p_description=>'',p_brief=>'{"purpose":"Workdays"}',p_expected_revision=>1,
 p_item_ids=>array['99999999-0000-4000-8000-000000000999']::uuid[])$$,'22023','Some owned pieces are unavailable.','rejects unowned inventory');

select is((select title from public.capsules where workspace_id='20000000-0000-4000-8000-000000000001'),'A considered week','rejected edit does not alter the capsule');
select throws_ok($$select public.save_capsule_studio(
 p_workspace_id=>'20000000-0000-4000-8000-000000000001',p_capsule_id=>(select id from public.capsules where workspace_id='20000000-0000-4000-8000-000000000001'),
 p_title=>'Stale edit',p_description=>'',p_brief=>'{"purpose":"Workdays"}',p_expected_revision=>99,
 p_item_ids=>array['20000000-0000-4000-8000-000000000002']::uuid[])$$,'40001','The capsule changed. Reload before saving.','rejects stale edits');

select public.create_capsule_outfit('20000000-0000-4000-8000-000000000001',
 (select id from public.capsules where workspace_id='20000000-0000-4000-8000-000000000001'),'Saved outfit','An owned shirt.',
 array['20000000-0000-4000-8000-000000000002']::uuid[],'manual','{}');
select throws_ok($$select public.save_capsule_studio(
 p_workspace_id=>'20000000-0000-4000-8000-000000000001',p_capsule_id=>(select id from public.capsules where workspace_id='20000000-0000-4000-8000-000000000001'),
 p_title=>'Conflicting edit',p_description=>'',p_brief=>'{"purpose":"Workdays"}',p_expected_revision=>1,
 p_item_ids=>array['20000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004']::uuid[])$$,'23503',null,'saved outfit prevents partial member replacement');
select is((select count(*)::integer from public.capsule_items where workspace_id='20000000-0000-4000-8000-000000000001' and wardrobe_item_id='20000000-0000-4000-8000-000000000004'),0,'failed edit does not add new members');
select ok(not has_function_privilege('anon','public.save_capsule_studio(uuid,text,text,jsonb,uuid[],text,text,text,uuid,integer)','execute') and not has_function_privilege('authenticated','public.save_capsule_studio(uuid,text,text,jsonb,uuid[],text,text,text,uuid,integer)','execute'),'direct roles cannot execute capsule mutation');
select * from finish();
rollback;
