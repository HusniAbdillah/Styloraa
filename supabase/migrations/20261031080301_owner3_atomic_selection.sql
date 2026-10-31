alter table public.outfit_option_items
  add column requested_brief text check (char_length(requested_brief) between 1 and 1000),
  add column requested_category text check (char_length(requested_category) between 1 and 80);

create or replace function public.guard_shopping_search() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='UPDATE' then
    if (to_jsonb(new)-array['status','error_code']) is distinct from
      (to_jsonb(old)-array['status','error_code']) then
      raise exception using errcode='23514', message='Search context cannot change after reservation.';
    end if;
    return new;
  end if;
  if not exists (select 1 from public.outfit_option_items where workspace_id=new.workspace_id
    and id=new.option_item_id and item_kind in ('missing','product')) then
    raise exception using errcode='23514', message='Shopping search requires a missing outfit piece.';
  end if;
  return new;
end;
$$;

update public.outfit_option_items i set
  requested_brief=coalesce(i.missing_brief,
    (select p.name from public.inspiration_pieces p where p.workspace_id=i.workspace_id and p.id=i.piece_id),
    (select p.title from public.products p where p.workspace_id=i.workspace_id and p.id=i.product_id)),
  requested_category=coalesce(
    (select p.category from public.inspiration_pieces p where p.workspace_id=i.workspace_id and p.id=i.piece_id),
    (select p.category from public.products p where p.workspace_id=i.workspace_id and p.id=i.product_id),
    case when i.slot_id in ('top','bottom','dress','outerwear','shoes','accessory','bag') then i.slot_id end)
where i.item_kind in ('missing','product');

create function public.retain_outfit_request() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='UPDATE' and (
    (old.requested_brief is not null and new.requested_brief is distinct from old.requested_brief)
    or (old.requested_category is not null and new.requested_category is distinct from old.requested_category)
  ) then
    raise exception using errcode='23514', message='The original outfit request cannot change during product selection.';
  end if;
  if new.item_kind in ('missing','product') then
    new.requested_brief=coalesce(new.requested_brief,new.missing_brief,
      (select p.name from public.inspiration_pieces p where p.workspace_id=new.workspace_id and p.id=new.piece_id),
      (select p.title from public.products p where p.workspace_id=new.workspace_id and p.id=new.product_id));
    new.requested_category=coalesce(new.requested_category,
      (select p.category from public.inspiration_pieces p where p.workspace_id=new.workspace_id and p.id=new.piece_id),
      (select p.category from public.products p where p.workspace_id=new.workspace_id and p.id=new.product_id),
      case when new.slot_id in ('top','bottom','dress','outerwear','shoes','accessory','bag') then new.slot_id end);
  end if;
  return new;
end;
$$;
create trigger retain_outfit_request before insert or update on public.outfit_option_items
  for each row execute function public.retain_outfit_request();

create function public.select_outfit_products(
  p_workspace_id uuid,p_look_id uuid,p_option_id uuid,p_expected_revision integer,p_choices jsonb
)
returns uuid language plpgsql security invoker set search_path='' as $$
declare
  parent public.looks;
  selected public.outfit_options;
  current_item public.outfit_option_items;
  choice jsonb;
  choice_count integer;
  candidate_id uuid;
begin
  if p_choices is null or jsonb_typeof(p_choices)<>'array' then
    raise exception using errcode='22023', message='Choose between one and twenty outfit products.';
  end if;
  if jsonb_array_length(p_choices) not between 1 and 20 then
    raise exception using errcode='22023', message='Choose between one and twenty outfit products.';
  end if;
  if exists (select 1 from jsonb_array_elements(p_choices) as choices(value)
    where jsonb_typeof(value)<>'object' or not (value ?& array['option_item_id','product_id'])
    or value-array['option_item_id','product_id']<>'{}'::jsonb
    or jsonb_typeof(value->'option_item_id') is distinct from 'string'
    or jsonb_typeof(value->'product_id') is distinct from 'string') then
    raise exception using errcode='22023', message='Choose valid outfit item and product IDs.';
  end if;
  select count(distinct value->>'option_item_id') into choice_count from jsonb_array_elements(p_choices) as choices(value);
  if choice_count<>jsonb_array_length(p_choices) then
    raise exception using errcode='22023', message='Choose each outfit slot once.';
  end if;

  select * into selected from public.outfit_options where workspace_id=p_workspace_id
    and id=p_option_id and look_id=p_look_id for update;
  if not found then raise exception using errcode='22023', message='Outfit option is unavailable.'; end if;
  select * into parent from public.looks where workspace_id=p_workspace_id and id=p_look_id for update;
  if p_expected_revision is null or parent.revision<>p_expected_revision or selected.source_revision<>parent.revision then
    raise exception using errcode='40001', message='The inspiration changed. Refresh outfit options.';
  end if;
  if selected.option_type='from_wardrobe' then
    raise exception using errcode='22023', message='From your wardrobe does not accept shopping products.';
  end if;

  for choice in select value from jsonb_array_elements(p_choices) as choices(value) loop
    select * into current_item from public.outfit_option_items where workspace_id=p_workspace_id
      and look_id=p_look_id and option_id=p_option_id and id=(choice->>'option_item_id')::uuid;
    if not found or current_item.item_kind not in ('missing','product') then
      raise exception using errcode='22023', message='Choose a missing outfit slot.';
    end if;
    candidate_id=(choice->>'product_id')::uuid;
    if not exists (select 1 from public.products p join public.shopping_results r
      on r.workspace_id=p.workspace_id and r.product_id=p.id
      join public.shopping_searches s on s.workspace_id=r.workspace_id and s.id=r.search_id
      where p.workspace_id=p_workspace_id and p.id=candidate_id
        and p.category=current_item.requested_category
        and s.option_item_id=current_item.id and s.status='succeeded') then
      raise exception using errcode='22023', message='Choose a retrieved product for this outfit slot.';
    end if;
    update public.outfit_option_items set item_kind='product',product_id=candidate_id,
      wardrobe_item_id=null,missing_brief=null where workspace_id=p_workspace_id and id=current_item.id;
  end loop;
  update public.looks set selected_option_id=p_option_id,is_saved=false
    where workspace_id=p_workspace_id and id=p_look_id;
  return p_option_id;
end;
$$;

revoke all on function public.retain_outfit_request() from public,anon,authenticated;
grant execute on function public.retain_outfit_request() to service_role;
revoke all on function public.select_outfit_products(uuid,uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.select_outfit_products(uuid,uuid,uuid,integer,jsonb) to service_role;

create function public.reserve_shopping_budget() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.workspace_id::text,0));
  new.created_at=now();
  if (select count(*) from public.shopping_searches where workspace_id=new.workspace_id
    and created_at>now()-interval '1 minute')>=5
    or (select count(*) from public.shopping_searches where workspace_id=new.workspace_id
    and created_at>now()-interval '1 day')>=100 then
    raise exception using errcode='P0429', message='The shared shopping search limit was reached.';
  end if;
  return new;
end;
$$;
create trigger reserve_shopping_budget before insert on public.shopping_searches
  for each row execute function public.reserve_shopping_budget();
revoke all on function public.reserve_shopping_budget() from public,anon,authenticated;
grant execute on function public.reserve_shopping_budget() to service_role;
