begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(16);
insert into public.workspaces(id,name) values ('81000000-0000-4000-8000-000000000001','Muse reservation verification');
create temporary table generation_context(id uuid);
insert into generation_context select public.reserve_owner4_generation(
 '81000000-0000-4000-8000-000000000001','capsule',jsonb_build_object('owner','owner4','request_id','82000000-0000-4000-8000-000000000001','fingerprint',repeat('a',64)));
select is((select status from public.ai_jobs j join generation_context c on c.id=j.id),'running','reservation records an awaited generation');
select is(public.reserve_owner4_generation('81000000-0000-4000-8000-000000000001','capsule',jsonb_build_object('owner','owner4','request_id','82000000-0000-4000-8000-000000000001','fingerprint',repeat('a',64))),(select id from generation_context),'same identity returns the existing job');
select is((select count(*)::integer from public.ai_jobs where workspace_id='81000000-0000-4000-8000-000000000001'),1,'duplicate requests consume no additional generation');
select throws_ok($$select public.reserve_owner4_generation('81000000-0000-4000-8000-000000000001','capsule',jsonb_build_object('owner','owner4','request_id','82000000-0000-4000-8000-000000000001','fingerprint',repeat('b',64)))$$,'PT409',null,'changed request cannot reuse an identity');
select throws_ok($$select public.reserve_owner4_generation('81000000-0000-4000-8000-000000000001','capsule',jsonb_build_object('owner','owner4','request_id','82000000-0000-4000-8000-000000000002','fingerprint',repeat('a',64)))$$,'P0429',null,'concurrent generation is rejected');
update public.ai_jobs set created_at=now()-interval '5 minutes' where workspace_id='81000000-0000-4000-8000-000000000001';
select lives_ok($$select public.reserve_owner4_generation('81000000-0000-4000-8000-000000000001','capsule',jsonb_build_object('owner','owner4','request_id','82000000-0000-4000-8000-000000000002','fingerprint',repeat('a',64)))$$,'expired work can be retried with a new identity');
select is((select status from public.ai_jobs j join generation_context c on c.id=j.id),'failed','an expired request is terminal');
update public.ai_jobs set status='failed',completed_at=now() where workspace_id='81000000-0000-4000-8000-000000000001';
insert into public.ai_jobs(workspace_id,kind,status,input)
 select '81000000-0000-4000-8000-000000000001','capsule','failed',jsonb_build_object('owner','owner4','request_id',gen_random_uuid()::text,'fingerprint',repeat('a',64)) from generate_series(1,8);
select throws_ok($$select public.reserve_owner4_generation('81000000-0000-4000-8000-000000000001','capsule',jsonb_build_object('owner','owner4','request_id','82000000-0000-4000-8000-000000000003','fingerprint',repeat('a',64)))$$,'P0429',null,'failed attempts remain in the hourly ledger');
select ok(not has_function_privilege('anon','public.reserve_owner4_generation(uuid,text,jsonb,uuid,uuid,uuid,text)','EXECUTE') and not has_function_privilege('authenticated','public.reserve_owner4_generation(uuid,text,jsonb,uuid,uuid,uuid,text)','EXECUTE'),'browser roles cannot reserve paid work');
select throws_ok($$select public.reserve_owner4_generation('81000000-0000-4000-8000-000000000001','capsule','{}')$$,'22023',null,'invalid reservation input is rejected');

select throws_ok($$select public.reserve_owner4_generation('81000000-0000-4000-8000-000000000001','preview',jsonb_build_object('owner','owner4','request_id','82000000-0000-4000-8000-000000000004','fingerprint',repeat('a',64)))$$,'23514',null,'a preview reservation requires a valid owned context');
insert into public.ai_jobs(workspace_id,kind,status,input,preview_mode,model_source,consent_acknowledged_at,limitations_acknowledged_at)
 values('81000000-0000-4000-8000-000000000001','preview','failed','{"owner":"owner4"}','single','mannequin',now(),now());
select is((select count(*)::integer from public.ai_jobs where workspace_id='81000000-0000-4000-8000-000000000001' and kind='preview'),1,'deleted results can retain a detached usage ledger');
insert into public.capsules(id,workspace_id,title,revision) values('83000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001','Revision verification',3);
insert into public.capsule_outfits(id,workspace_id,capsule_id,title,rationale,source_type,source_revision)
 values('84000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001','83000000-0000-4000-8000-000000000001','Manual arrangement','A user arrangement','manual',1);
select is((select source_revision from public.capsule_outfits where id='84000000-0000-4000-8000-000000000001'),3,'outfit provenance uses the actual capsule revision');
select throws_ok($$insert into public.capsule_outfits(workspace_id,capsule_id,title,rationale,source_type,source_revision) values('81000000-0000-4000-8000-000000000001','83000000-0000-4000-8000-000000000001','Stale draft','An expired context','live',1)$$,'PT409',null,'stale AI context is rejected atomically');
select lives_ok($$insert into public.capsule_outfits(workspace_id,capsule_id,title,rationale,source_type,source_revision,inputs_used) values('81000000-0000-4000-8000-000000000001','83000000-0000-4000-8000-000000000001','Verified draft','A current context','live',1,'{"capsule_revision":3}')$$,'current AI context can be persisted');
update public.capsules set missing_additions='[{"name":"Optional"}]' where id='83000000-0000-4000-8000-000000000001';
update public.capsules set brief='{"purpose":"A changed purpose"}' where id='83000000-0000-4000-8000-000000000001';
select is((select jsonb_array_length(missing_additions) from public.capsules where id='83000000-0000-4000-8000-000000000001'),0,'editing the capsule clears stale missing-item advice');
select * from finish();
rollback;
