begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into public.workspaces(id, name)
values ('00000000-0000-4000-8000-000000000003', 'capsule outfit test workspace');
insert into public.capsules(id, workspace_id, title)
values ('00000000-0000-4000-8000-000000000a01', '00000000-0000-4000-8000-000000000003', 'Test capsule A');
insert into public.capsules(id, workspace_id, title)
values ('00000000-0000-4000-8000-000000000b02', '00000000-0000-4000-8000-000000000003', 'Test capsule B');
insert into public.wardrobe_items(id, workspace_id, name, category, color)
values
  ('10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000003', 'Test shirt', 'top', 'ivory'),
  ('10000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000003', 'Test trousers', 'bottom', 'charcoal'),
  ('10000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000003', 'Other capsule jacket', 'outerwear', 'camel');
insert into public.capsule_items(workspace_id, capsule_id, wardrobe_item_id)
values
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000a01', '10000000-0000-4000-8000-000000000101'),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000a01', '10000000-0000-4000-8000-000000000102'),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000b02', '10000000-0000-4000-8000-000000000103');

select lives_ok($$select public.create_capsule_outfit(
  '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000a01',
  'Workday uniform', 'Relaxed shirt with dark trousers',
  array['10000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000102']::uuid[],
  'manual', '{}')$$,
  'outfit created from capsule members');

select throws_ok($$select public.create_capsule_outfit(
  '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000a01',
  'Smuggled jacket', 'Item belongs to another capsule',
  array['10000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000103']::uuid[],
  'manual', '{}')$$,
  '22023', 'Outfit items must belong to the capsule and be available.',
  'outfit cannot use another capsule member item');

select throws_ok($$select public.create_capsule_outfit(
  '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000a01',
  'Ghost item', 'Unknown wardrobe id',
  array['10000000-0000-4000-8000-000000000101', '99999999-0000-4000-8000-000000000999']::uuid[],
  'manual', '{}')$$,
  '22023', 'Outfit items must belong to the capsule and be available.',
  'outfit cannot use unknown wardrobe item');

select throws_ok($$select public.create_capsule_outfit(
  '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000a01',
  'Doubled shirt', 'Duplicate item',
  array['10000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000101']::uuid[],
  'manual', '{}')$$,
  '22023', 'Choose each wardrobe item once.',
  'outfit rejects duplicate items');

select throws_ok($$select public.create_capsule_outfit(
  '00000000-0000-4000-8000-000000000003', '99999999-0000-4000-8000-000000000999',
  'Lost capsule', 'Unknown capsule',
  array['10000000-0000-4000-8000-000000000101']::uuid[],
  'manual', '{}')$$,
  '22023', 'Capsule is unavailable.',
  'outfit requires a workspace capsule');

select throws_ok($$select public.create_capsule_outfit(
  '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000a01',
  'Empty outfit', 'No items',
  array[]::uuid[],
  'manual', '{}')$$,
  '22023', 'Invalid capsule outfit input.',
  'outfit requires at least one item');

update public.wardrobe_items set archived_at = now()
where id = '10000000-0000-4000-8000-000000000102';
select throws_ok($$select public.create_capsule_outfit(
  '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000a01',
  'Archived trousers', 'Item archived',
  array['10000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000102']::uuid[],
  'manual', '{}')$$,
  '22023', 'Outfit items must belong to the capsule and be available.',
  'outfit rejects archived items');

select * from finish();
rollback;
