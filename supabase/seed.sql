-- Shared, non-personal demo workspace. Never seed real user information here.
insert into public.workspaces (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Stylora demo')
on conflict (id) do nothing;

insert into public.user_preferences (workspace_id, style_notes)
values ('00000000-0000-4000-8000-000000000001', '')
on conflict (workspace_id) do nothing;

-- Local synthetic inventory for matching integration tests and demo exploration.
-- The API labels these rows as sample via attribute_provenance.demo_sample.
insert into public.wardrobe_items(workspace_id,name,category,color,subcategory,attributes,attribute_provenance)
select '00000000-0000-4000-8000-000000000001', sample.name, sample.category, sample.color,
  sample.subcategory, sample.attributes, '{"demo_sample":true,"source":"local_seed"}'::jsonb
from (values
  ('Sample ivory relaxed shirt','top','ivory','shirt','{"primaryColor":"ivory","pattern":"solid","material":"cotton","texture":"smooth","silhouette":"relaxed","fit":"relaxed","styleTags":["classic","minimal"]}'::jsonb),
  ('Sample charcoal wide-leg trousers','bottom','charcoal','wide-leg trousers','{"primaryColor":"charcoal","pattern":"solid","material":"woven","silhouette":"wide-leg","fit":"relaxed","length":"full length","styleTags":["tailored","minimal"]}'::jsonb),
  ('Sample oxblood tote','accessory','oxblood','tote bag','{"primaryColor":"oxblood","material":"leather-like","texture":"smooth","silhouette":"structured","styleTags":["classic"]}'::jsonb),
  ('Sample dark leather loafers','shoes','dark brown','loafers','{"primaryColor":"dark brown","material":"leather-like","texture":"smooth","silhouette":"loafer","styleTags":["classic"]}'::jsonb)
) as sample(name,category,color,subcategory,attributes)
where not exists (
  select 1 from public.wardrobe_items existing
  where existing.workspace_id='00000000-0000-4000-8000-000000000001'
    and existing.name=sample.name
    and existing.attribute_provenance->>'source'='local_seed'
);
