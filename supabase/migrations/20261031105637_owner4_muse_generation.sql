-- Preview combinations may originate from an owned legacy look or saved snapshot.
alter table public.ai_jobs drop constraint preview_non_identifying_model;
alter table public.ai_jobs add constraint preview_non_identifying_model check (kind <> 'preview' or (
 preview_mode is not null and model_source = 'mannequin'
 and consent_acknowledged_at is not null and limitations_acknowledged_at is not null
 and (status='failed' or (preview_mode='single' and wardrobe_item_id is not null and product_id is null and option_id is null and capsule_outfit_id is null)
 or (preview_mode='combo' and wardrobe_item_id is null and product_id is null and (capsule_outfit_id is not null or look_id is not null)))
));
create unique index ai_jobs_owner4_request_key on public.ai_jobs(workspace_id,(input->>'request_id'))
 where input->>'owner'='owner4';
create index ai_jobs_owner4_usage_idx on public.ai_jobs(workspace_id,kind,created_at)
 where input->>'owner'='owner4';

create function public.reserve_owner4_generation(
 p_workspace_id uuid,p_kind text,p_input jsonb,p_wardrobe_item_id uuid default null,
 p_look_id uuid default null,p_capsule_outfit_id uuid default null,p_preview_mode text default null
) returns uuid language plpgsql security invoker set search_path='' as $$
declare previous public.ai_jobs; reserved uuid; hourly integer; daily integer;
begin
 if p_workspace_id is null or p_kind is null or p_kind not in ('capsule','preview') or p_input is null
 or p_input->>'owner' is distinct from 'owner4' or octet_length(p_input::text)>32000
 or not coalesce(p_input->>'request_id' ~ '^[a-f0-9-]{36}$',false)
 or not coalesce(p_input->>'fingerprint' ~ '^[a-f0-9]{64}$',false) then
  raise exception using errcode='22023',message='Invalid generation request.';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text || ':owner4',0));
 select * into previous from public.ai_jobs where workspace_id=p_workspace_id
  and input->>'owner'='owner4' and input->>'request_id'=p_input->>'request_id';
 if found then
  if previous.kind<>p_kind or previous.input->>'fingerprint' is distinct from p_input->>'fingerprint' then
   raise exception using errcode='PT409',message='Request identity changed.';
  end if;
  return previous.id;
 end if;
 update public.ai_jobs set status='failed',error_code='AI_TIMEOUT',completed_at=now()
  where workspace_id=p_workspace_id and input->>'owner'='owner4' and status='running'
   and created_at<now()-interval '4 minutes';
 if exists(select 1 from public.ai_jobs where workspace_id=p_workspace_id and input->>'owner'='owner4'
  and kind=p_kind and status='running') then
  raise exception using errcode='P0429',message='A generation is already running.';
 end if;
 select count(*) filter(where created_at>now()-interval '1 hour'),count(*) into hourly,daily
  from public.ai_jobs where workspace_id=p_workspace_id and input->>'owner'='owner4'
   and kind=p_kind and created_at>now()-interval '24 hours';
 if hourly >= (case when p_kind='preview' then 6 else 10 end)
 or daily >= (case when p_kind='preview' then 12 else 30 end) then
  raise exception using errcode='P0429',message='The shared generation limit was reached.';
 end if;
 insert into public.ai_jobs(workspace_id,kind,status,input,source_type,provider,model,
 wardrobe_item_id,look_id,capsule_outfit_id,preview_mode,model_source,consent_acknowledged_at,limitations_acknowledged_at)
 values(p_workspace_id,p_kind,'running',p_input,'live','meta',
 case when p_kind='preview' then 'muse-image-1.0' else 'muse-spark-1.3' end,
 p_wardrobe_item_id,p_look_id,p_capsule_outfit_id,p_preview_mode,
 case when p_kind='preview' then 'mannequin' end,
 case when p_kind='preview' then now() end,case when p_kind='preview' then now() end)
 returning id into reserved;
 return reserved;
end;
$$;
revoke all on function public.reserve_owner4_generation(uuid,text,jsonb,uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_owner4_generation(uuid,text,jsonb,uuid,uuid,uuid,text) to service_role;

create function public.clear_stale_capsule_additions() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if (new.brief,new.timeframe,new.season,new.occasion,new.revision) is distinct from
 (old.brief,old.timeframe,old.season,old.occasion,old.revision) then new.missing_additions='[]'::jsonb; end if;
 return new;
end;
$$;
revoke all on function public.clear_stale_capsule_additions() from public,anon,authenticated;
create trigger clear_stale_capsule_additions before update on public.capsules
 for each row execute function public.clear_stale_capsule_additions();

create function public.stamp_capsule_outfit_revision() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 select revision into new.source_revision from public.capsules
 where workspace_id=new.workspace_id and id=new.capsule_id for share;
 if new.source_type='live' and new.inputs_used->>'capsule_revision' is distinct from new.source_revision::text then raise exception using errcode='PT409',message='The capsule changed before saving the AI suggestion.'; end if;
 return new;
end;
$$;
revoke all on function public.stamp_capsule_outfit_revision() from public,anon,authenticated;
create trigger stamp_capsule_outfit_revision before insert on public.capsule_outfits
 for each row execute function public.stamp_capsule_outfit_revision();
