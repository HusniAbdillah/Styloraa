begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into public.workspaces(id, name)
values ('00000000-0000-4000-8000-000000000003', 'Isolated RPC test workspace');
insert into public.wardrobe_items(id, workspace_id, name, category) values
  ('11000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Synthetic shirt', 'top'),
  ('11000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'Synthetic trousers', 'bottom'),
  ('11000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', 'Foreign synthetic shirt', 'top');

select ok(not has_function_privilege('anon', 'public.save_look(uuid,text,text,uuid[])', 'EXECUTE'),
  'anon cannot call the saved look RPC');
select ok(not has_function_privilege('authenticated', 'public.save_look(uuid,text,text,uuid[])', 'EXECUTE'),
  'authenticated cannot call the saved look RPC');
select ok(has_function_privilege('service_role', 'public.save_look(uuid,text,text,uuid[])', 'EXECUTE'),
  'the server role can call the saved look RPC');

set local role service_role;
select lives_ok($$select public.save_look(
  '00000000-0000-4000-8000-000000000001', ' RPC synthetic look ', 'Test only',
  array['11000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000001']::uuid[]
)$$, 'server role saves a complete look');
reset role;

select is((select count(*)::integer from public.looks where title='RPC synthetic look' and is_saved),
  1, 'saved state and trimmed title persist');
select is((select array_agg(li.wardrobe_item_id order by li.position) from public.look_items li
  join public.looks l on l.id=li.look_id where l.title='RPC synthetic look'),
  array['11000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000001']::uuid[],
  'item order survives persistence');

select throws_ok($$select public.save_look(
  '00000000-0000-4000-8000-000000000001', 'Rejected foreign look', '',
  array['11000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000003']::uuid[]
)$$, '22023', 'Some wardrobe items are unavailable.', 'cross-workspace selection is rejected');
select is((select count(*)::integer from public.looks where title='Rejected foreign look'),
  0, 'rejected selection leaves no partial look');
select throws_ok($$select public.save_look(
  '00000000-0000-4000-8000-000000000001', 'Empty look', '', array[]::uuid[]
)$$, '22023', 'Invalid saved look input.', 'empty outfits are rejected');
select throws_ok($$select public.save_look(
  '00000000-0000-4000-8000-000000000001', 'Duplicate look', '',
  array['11000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001']::uuid[]
)$$, '22023', 'Choose each wardrobe item once.', 'duplicate pieces are rejected');
select throws_ok($$select public.save_look(
  '00000000-0000-4000-8000-000000000001', 'Missing item', '',
  array['11000000-0000-4000-8000-000000000099']::uuid[]
)$$, '22023', 'Some wardrobe items are unavailable.', 'unknown IDs are rejected');
select throws_ok($$select public.save_look(
  '00000000-0000-4000-8000-000000000001', '   ', '',
  array['11000000-0000-4000-8000-000000000001']::uuid[]
)$$, '22023', 'Invalid saved look input.', 'blank titles are rejected');

select * from finish();
rollback;
