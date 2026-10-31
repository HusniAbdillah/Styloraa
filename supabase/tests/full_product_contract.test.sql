begin;
create extension if not exists pgtap with schema extensions;
select plan(30);

insert into public.workspaces(id,name) values
  ('40000000-0000-4000-8000-000000000001','Synthetic contract workspace'),
  ('40000000-0000-4000-8000-000000000002','Foreign synthetic contract workspace');
insert into public.assets(id,workspace_id,bucket,storage_path,mime_type,byte_size,source_type)
values ('42000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002',
  'wardrobe','40000000-0000-4000-8000-000000000002/synthetic.png','image/png',100,'sample');
insert into public.wardrobe_items(id,workspace_id,name,category,color,attributes,archived_at) values
  ('41000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',
   'Synthetic shirt','top','White','{"storage_path":"private-test-path","profile":{"test":"not public"}}',null),
  ('41000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001',
   'Archived synthetic shirt','top','Blue','{}',now()),
  ('41000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000002',
   'Foreign synthetic shirt','top','Black','{}',null);
insert into public.looks(id,workspace_id,title) values
  ('43000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Synthetic contract look'),
  ('43000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','Foreign synthetic look');
insert into public.outfit_options(id,workspace_id,look_id,option_type,title,rationale,source_type,source_revision) values
  ('44000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',
   '43000000-0000-4000-8000-000000000001','closest','Synthetic closest','Synthetic test rationale','sample',1),
  ('44000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001',
   '43000000-0000-4000-8000-000000000001','from_wardrobe','Synthetic owned','Synthetic test rationale','sample',1),
  ('44000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000002',
   '43000000-0000-4000-8000-000000000002','closest','Foreign synthetic closest','Synthetic test rationale','sample',1);
insert into public.products(id,workspace_id,provider,provider_product_id,title,category,
  source_label,product_url,source_type,retrieved_at)
values ('45000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',
  'sample','contract-product','Synthetic sample trousers','bottom','Synthetic test catalog',
  'https://example.com/synthetic-trousers','sample',now());
create temp table contract_context(snapshot_id uuid,share_id uuid,share_token text);
insert into contract_context default values;

select ok((select count(*)=20 and bool_and(c.relrowsecurity
    and not has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE'))
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in ('workspaces','wardrobe_items','user_preferences',
    'looks','look_items','capsules','capsule_items','ai_jobs','assets','inspiration_pieces',
    'wardrobe_matches','products','outfit_options','outfit_option_items','shopping_searches',
    'shopping_results','saved_look_snapshots','share_links','capsule_outfits','capsule_outfit_items')),
  'all twenty application tables enable RLS and deny direct client access');
select ok((select count(*)=3 and bool_and(
    not has_function_privilege('anon',p.oid,'EXECUTE')
    and not has_function_privilege('authenticated',p.oid,'EXECUTE')
    and has_function_privilege('service_role',p.oid,'EXECUTE'))
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
    and p.proname in ('save_look','save_outfit_option','create_share_link')),
  'sensitive save and share RPCs are restricted to the server role');

select throws_ok($$update public.wardrobe_items set asset_id='42000000-0000-4000-8000-000000000001'
  where id='41000000-0000-4000-8000-000000000001'$$,
  '23503',null,'wardrobe cannot reference another workspace asset');
select throws_ok($$insert into public.outfit_option_items(workspace_id,look_id,option_id,slot_id,item_kind,missing_brief)
  values('40000000-0000-4000-8000-000000000001','43000000-0000-4000-8000-000000000001',
    '44000000-0000-4000-8000-000000000003','foreign','missing','Synthetic missing item')$$,
  '23503',null,'outfit item cannot reference another workspace option');
select lives_ok($$insert into public.outfit_option_items(id,workspace_id,look_id,option_id,slot_id,item_kind,
    wardrobe_item_id,product_id,missing_brief,position) values
  ('46000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001','44000000-0000-4000-8000-000000000001','top','owned',
    '41000000-0000-4000-8000-000000000001',null,null,0),
  ('46000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001','44000000-0000-4000-8000-000000000001','shoes','missing',
    null,null,'Synthetic missing shoes',1),
  ('46000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001','44000000-0000-4000-8000-000000000001','bottom','product',
    null,'45000000-0000-4000-8000-000000000001',null,2)$$,
  'closest option supports independent owned, missing and suggested product slots');
select throws_ok($$insert into public.outfit_option_items(workspace_id,look_id,option_id,slot_id,item_kind,missing_brief)
  values('40000000-0000-4000-8000-000000000001','43000000-0000-4000-8000-000000000001',
    '44000000-0000-4000-8000-000000000002','shoes','missing','Synthetic missing shoes')$$,
  '23514',null,'from-wardrobe option rejects missing pieces');
select throws_ok($$insert into public.outfit_option_items(workspace_id,look_id,option_id,slot_id,item_kind,product_id)
  values('40000000-0000-4000-8000-000000000001','43000000-0000-4000-8000-000000000001',
    '44000000-0000-4000-8000-000000000002','bottom','product','45000000-0000-4000-8000-000000000001')$$,
  '23514',null,'from-wardrobe option rejects suggested products');
select throws_ok($$insert into public.outfit_option_items(workspace_id,look_id,option_id,slot_id,item_kind,wardrobe_item_id,product_id)
  values('40000000-0000-4000-8000-000000000001','43000000-0000-4000-8000-000000000001',
    '44000000-0000-4000-8000-000000000001','invalid','owned',
    '41000000-0000-4000-8000-000000000001','45000000-0000-4000-8000-000000000001')$$,
  '23514',null,'one slot cannot claim both wardrobe ownership and a product');
select throws_ok($$insert into public.outfit_option_items(workspace_id,look_id,option_id,slot_id,item_kind)
  values('40000000-0000-4000-8000-000000000001','43000000-0000-4000-8000-000000000001',
    '44000000-0000-4000-8000-000000000001','invalid-missing','missing')$$,
  '23514',null,'missing pieces require an explicit non-null brief');

select ok((select price_minor is null and currency is null and rating is null and review_count is null
  from public.products where id='45000000-0000-4000-8000-000000000001'),
  'unavailable provider price and rating fields stay unknown');
select throws_ok($$update public.products set price_minor=10000,currency=null
  where id='45000000-0000-4000-8000-000000000001'$$,
  '23514',null,'a known price requires currency');
select throws_ok($$select public.save_look('40000000-0000-4000-8000-000000000001','Archived test','',
  array['41000000-0000-4000-8000-000000000002']::uuid[])$$,
  '22023','Some wardrobe items are unavailable.','archived pieces cannot be saved as available wardrobe');
select throws_ok($$delete from public.wardrobe_items where id='41000000-0000-4000-8000-000000000001'$$,
  '23503',null,'physical deletion cannot silently remove a referenced garment');
select throws_ok($$select public.save_outfit_option('40000000-0000-4000-8000-000000000001',
  '44000000-0000-4000-8000-000000000001',2)$$,
  'PT409',null,'stale inspiration revisions cannot be saved');
select lives_ok($$update pg_temp.contract_context set snapshot_id=public.save_outfit_option(
  '40000000-0000-4000-8000-000000000001','44000000-0000-4000-8000-000000000001',1)$$,
  'current option saves its actual selected composition');
select ok((select exists(select 1 from jsonb_array_elements(s.items) item
    where item->>'kind'='product' and item->>'product_id'='45000000-0000-4000-8000-000000000001')
    and (select count(*)=2 from public.wardrobe_items where workspace_id=s.workspace_id)
    and (select count(*)=1 from public.look_items where workspace_id=s.workspace_id and look_id=s.look_id)
  from public.saved_look_snapshots s join pg_temp.contract_context c on s.id=c.snapshot_id),
  'saved suggested product does not become an owned wardrobe item');
select throws_ok($$update public.saved_look_snapshots set title='Changed after save'
  where id=(select snapshot_id from pg_temp.contract_context)$$,
  '23514',null,'saved snapshots cannot be changed after creation');

select lives_ok($$update pg_temp.contract_context c set (share_id,share_token)=(
  select share_id,share_token from public.create_share_link('40000000-0000-4000-8000-000000000001',
    c.snapshot_id,'Synthetic public catchphrase',now()+interval '1 day'))$$,
  'sharing resolves the saved snapshot and returns a token');
select ok((select (s.public_snapshot-array['title','items','source_type'])='{}'::jsonb
    and not exists(select 1 from jsonb_array_elements(s.public_snapshot->'items') item
      where item-array['name','category','color','kind']<>'{}'::jsonb)
    and s.public_snapshot::text not like '%private-test-path%'
    and s.public_snapshot::text not like '%40000000-0000-4000-8000-000000000001%'
  from public.share_links s join pg_temp.contract_context c on s.id=c.share_id),
  'public snapshot contains allowlisted fields without IDs, profile or storage data');
select ok((select s.token_hash=encode(sha256(convert_to(c.share_token,'UTF8')),'hex')
    and s.token_hash<>c.share_token and char_length(c.share_token)=64
  from public.share_links s join pg_temp.contract_context c on s.id=c.share_id),
  'share database stores the token hash rather than the raw token');
select lives_ok($$update public.share_links set revoked_at=now()
  where id=(select share_id from pg_temp.contract_context)$$,'published share can be revoked');
select throws_ok($$update public.share_links set revoked_at=null
  where id=(select share_id from pg_temp.contract_context)$$,
  '23514',null,'a revoked share cannot be silently re-enabled');

select throws_ok($$insert into public.ai_jobs(workspace_id,kind,preview_mode,wardrobe_item_id,model_source)
  values('40000000-0000-4000-8000-000000000001','preview','single',
    '41000000-0000-4000-8000-000000000001','mannequin')$$,
  '23514',null,'try-on requires consent and limitations acknowledgment');
select lives_ok($$insert into public.ai_jobs(workspace_id,kind,preview_mode,wardrobe_item_id,model_source,
    consent_acknowledged_at,limitations_acknowledged_at,source_type)
  values('40000000-0000-4000-8000-000000000001','preview','single',
    '41000000-0000-4000-8000-000000000001','mannequin',now(),now(),'sample')$$,
  'acknowledged mannequin preview context can be recorded without claiming execution');

select throws_ok($$update public.outfit_options set option_type='fresh_alternative'
  where id='44000000-0000-4000-8000-000000000001'$$,
  '23514',null,'changing an existing option type requires a new option');
select throws_ok($$insert into public.ai_jobs(workspace_id,kind,status,preview_mode,wardrobe_item_id,
    model_source,consent_acknowledged_at,limitations_acknowledged_at,source_type)
  values('40000000-0000-4000-8000-000000000001','preview','succeeded','single',
    '41000000-0000-4000-8000-000000000001','mannequin',now(),now(),'sample')$$,
  '23514',null,'successful preview status requires an actual result and completion time');
select lives_ok($$select public.create_capsule('40000000-0000-4000-8000-000000000001',
  'Synthetic valid capsule','Test only','{"occasion":"Synthetic test"}',
  array['41000000-0000-4000-8000-000000000001']::uuid[])$$,
  'capsule transaction accepts current same-workspace wardrobe IDs');
select lives_ok($$do $verify$
  begin
    begin
      perform public.create_capsule('40000000-0000-4000-8000-000000000001',
        'Rejected foreign capsule','Test only','{}',
        array['41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000003']::uuid[]);
      raise exception 'Cross-workspace capsule unexpectedly succeeded';
    exception when sqlstate '22023' then
      null;
    end;
    if exists(select 1 from public.capsules where workspace_id='40000000-0000-4000-8000-000000000001'
      and title='Rejected foreign capsule') then
      raise exception 'Cross-workspace rejection left a partial capsule';
    end if;
  end;
  $verify$;$$,'cross-workspace capsule is rejected without a partial record');
select throws_ok($$select public.create_capsule_from_saved_look('40000000-0000-4000-8000-000000000001',
  (select snapshot_id from pg_temp.contract_context),'Rejected suggested capsule','Test only','{}')$$,
  '22023','Only owned outfits can become a capsule.','suggested-product snapshots cannot establish capsule ownership');
select lives_ok($$do $verify$
  declare weights jsonb;
  begin
    for weights in select value from jsonb_array_elements(
      '[{"price":1},{"price":0.3,"rating":0.2,"relevance":0.2}]'::jsonb) loop
      begin
        insert into public.shopping_searches(workspace_id,option_item_id,query,provider,status,score_weights)
        values('40000000-0000-4000-8000-000000000001','46000000-0000-4000-8000-000000000002',
          'Synthetic missing shoes','sample','unavailable',weights);
        raise exception 'Invalid shopping weights unexpectedly succeeded';
      exception when sqlstate '23514' then
        null;
      end;
    end loop;
  end;
  $verify$;$$,'shopping weights require all factors and a normalized sum');

select * from finish();
rollback;
