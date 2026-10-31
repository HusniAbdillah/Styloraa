begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into public.workspaces(id,name) values('50000000-0000-4000-8000-000000000001','Synthetic selection test');
insert into public.looks(id,workspace_id,title) values('51000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Synthetic selection');
insert into public.outfit_options(id,workspace_id,look_id,option_type,title,rationale,source_type,source_revision)
values('52000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','closest','Synthetic option','Test only','sample',1);
insert into public.outfit_option_items(id,workspace_id,look_id,option_id,slot_id,item_kind,missing_brief) values
('53000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000001','bottom','missing','Black trousers'),
('53000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000001','shoes','missing','White sneakers');
insert into public.products(id,workspace_id,provider,provider_product_id,title,category,source_label,product_url,source_type,retrieved_at) values
('54000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','sample','pants-a','Synthetic trousers A','bottom','Synthetic catalog','https://example.com/pants-a','sample',now()),
('54000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','sample','pants-b','Synthetic trousers B','bottom','Synthetic catalog','https://example.com/pants-b','sample',now()),
('54000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001','sample','shoes','Synthetic shoes','shoes','Synthetic catalog','https://example.com/shoes','sample',now());
insert into public.shopping_searches(id,workspace_id,option_item_id,query,provider,status) values
('55000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','53000000-0000-4000-8000-000000000001','Black trousers','sample','succeeded'),
('55000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','53000000-0000-4000-8000-000000000002','White sneakers','sample','succeeded');
insert into public.shopping_results(workspace_id,search_id,product_id,position) values
('50000000-0000-4000-8000-000000000001','55000000-0000-4000-8000-000000000001','54000000-0000-4000-8000-000000000001',0),
('50000000-0000-4000-8000-000000000001','55000000-0000-4000-8000-000000000001','54000000-0000-4000-8000-000000000002',1),
('50000000-0000-4000-8000-000000000001','55000000-0000-4000-8000-000000000002','54000000-0000-4000-8000-000000000003',0);

select is((select requested_category from public.outfit_option_items where id='53000000-0000-4000-8000-000000000001'),'bottom','canonical request category is retained');
select lives_ok($$select public.select_outfit_products('50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000001',1,'[{"option_item_id":"53000000-0000-4000-8000-000000000001","product_id":"54000000-0000-4000-8000-000000000001"}]')$$,'one missing slot can be selected');
select is((select item_kind from public.outfit_option_items where id='53000000-0000-4000-8000-000000000002'),'missing','selecting trousers does not change shoes');
select lives_ok($$select public.select_outfit_products('50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000001',1,'[{"option_item_id":"53000000-0000-4000-8000-000000000002","product_id":"54000000-0000-4000-8000-000000000003"}]')$$,'the second missing slot can be selected independently');
select is((select product_id::text from public.outfit_option_items where id='53000000-0000-4000-8000-000000000001'),'54000000-0000-4000-8000-000000000001','selecting shoes preserves trousers');
select throws_ok($$select public.select_outfit_products('50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000001',1,'[{"option_item_id":"53000000-0000-4000-8000-000000000001","product_id":"54000000-0000-4000-8000-000000000002"},{"option_item_id":"53000000-0000-4000-8000-000000000002","product_id":"54000000-0000-4000-8000-000000000002"}]')$$,'22023',null,'wrong-slot candidates reject the complete mutation');
select is((select product_id::text from public.outfit_option_items where id='53000000-0000-4000-8000-000000000001'),'54000000-0000-4000-8000-000000000001','failed batch leaves no partial selection');
select throws_ok($$select public.select_outfit_products('50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000001',2,'[{"option_item_id":"53000000-0000-4000-8000-000000000001","product_id":"54000000-0000-4000-8000-000000000002"}]')$$,'PT409',null,'stale source revision is rejected');
select is((select requested_brief from public.outfit_option_items where id='53000000-0000-4000-8000-000000000001'),'Black trousers','original search intent survives selection');
select is((select count(*)::integer from public.wardrobe_items where workspace_id='50000000-0000-4000-8000-000000000001'),0,'product selection creates no wardrobe ownership');
select ok(not has_function_privilege('anon','public.select_outfit_products(uuid,uuid,uuid,integer,jsonb)','EXECUTE'),'selection RPC is server-only');
select throws_ok($$select public.select_outfit_products('00000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000001',1,'[{"option_item_id":"53000000-0000-4000-8000-000000000001","product_id":"54000000-0000-4000-8000-000000000002"}]')$$,'22023',null,'foreign workspace cannot mutate the selection');
select throws_ok($$select public.select_outfit_products('50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000001',1,'[{"option_item_id":"53000000-0000-4000-8000-000000000001","product_id":"54000000-0000-4000-8000-000000000003"}]')$$,'22023',null,'retrieved shoes cannot be attached to trousers');
select throws_ok($$update public.outfit_option_items set requested_brief='Different source' where id='53000000-0000-4000-8000-000000000001'$$,'23514',null,'original search intent is immutable');
select throws_ok($$select public.select_outfit_products('50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000001',1,'[{"option_item_id":"53000000-0000-4000-8000-000000000001","product_id":"54000000-0000-4000-8000-000000000002","workspace_id":"other"}]')$$,'22023',null,'selection does not accept workspace fields');

insert into public.shopping_searches(workspace_id,option_item_id,query,provider,status)
  select '50000000-0000-4000-8000-000000000001','53000000-0000-4000-8000-000000000001','Synthetic budget search','sample','failed' from generate_series(1,3);
select throws_ok($$insert into public.shopping_searches(workspace_id,option_item_id,query,provider,status)
values('50000000-0000-4000-8000-000000000001','53000000-0000-4000-8000-000000000001','Synthetic sixth attempt','sample','running')$$,'P0429',null,'shared paid-search attempts have an atomic budget');

select * from finish();
rollback;
