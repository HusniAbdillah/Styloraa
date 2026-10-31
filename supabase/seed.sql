-- Shared, non-personal demo workspace. Never seed real user information here.
insert into public.workspaces (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Stylora demo')
on conflict (id) do nothing;

insert into public.user_preferences (workspace_id, style_notes)
values ('00000000-0000-4000-8000-000000000001', '')
on conflict (workspace_id) do nothing;

-- Local synthetic inventory using the repository's 20 clothing photos.
-- These local seed images are bundled app assets; user uploads remain private in Storage.
insert into public.wardrobe_items(workspace_id,name,category,color,subcategory,notes,attributes,attribute_provenance)
select '00000000-0000-4000-8000-000000000001', sample.name, sample.category, sample.color,
  sample.subcategory, sample.notes, sample.attributes,
  jsonb_build_object('demo_sample',true,'source','local_seed','demo_image',sample.image_name)
from (values
  ('Blue denim A-line skirt','bottom','Blue','Denim skirt','Easy to pair with a tucked tee on a sunny afternoon.','{"material":"denim","pattern":"solid","silhouette":"A-line","length":"above knee","style":["casual","classic"]}'::jsonb,'10001.jpg'),
  ('Color-pop graphic T-shirt','top','White','Printed short-sleeve tee','A playful graphic adds a bright note to simple layers.','{"material":"cotton","pattern":"graphic print","fit":"regular","sleeve":"short sleeve","style":["casual","playful"]}'::jsonb,'10007.jpg'),
  ('Black illustrated T-shirt','top','Black','Graphic tee','A relaxed graphic layer for low-key weekends.','{"material":"cotton","pattern":"graphic print","fit":"regular","sleeve":"short sleeve","style":["casual","streetwear"]}'::jsonb,'10008.jpg'),
  ('Pink garden-print dress','dress','Pink','Sleeveless floral dress','A cheerful one-piece for brunch or a daytime event.','{"material":"woven fabric","pattern":"floral","fit":"fit and flare","length":"knee length","style":["romantic","playful"]}'::jsonb,'10016.jpg'),
  ('White training shorts','bottom','White','Athletic shorts','Lightweight shorts for a warm-up or an easy day outside.','{"material":"performance fabric","pattern":"solid","fit":"relaxed","length":"above knee","style":["sporty","casual"]}'::jsonb,'10021.jpg'),
  ('Charcoal straight-leg trousers','bottom','Charcoal','Straight-leg pants','A simple dark neutral that works with both tees and knits.','{"material":"stretch twill","pattern":"solid","fit":"straight","length":"full length","style":["casual","utility"]}'::jsonb,'10023.jpg'),
  ('Make Your Self graphic tee','top','Black','Text-print T-shirt','Bold lettering gives a monochrome outfit a little attitude.','{"material":"cotton","pattern":"text graphic","fit":"regular","sleeve":"short sleeve","style":["streetwear","casual"]}'::jsonb,'10024.jpg'),
  ('Fox sketch T-shirt','top','White','Illustrated tee','An easy white layer with a hand-drawn look.','{"material":"cotton","pattern":"animal illustration","fit":"regular","sleeve":"short sleeve","style":["casual","playful"]}'::jsonb,'10027.jpg'),
  ('Navy zip-front hoodie','outerwear','Navy','Zip hoodie','A soft extra layer for cool mornings and late evenings.','{"material":"fleece","pattern":"solid","fit":"relaxed","sleeve":"long sleeve","style":["sporty","casual"]}'::jsonb,'10029.jpg'),
  ('Retro graphic T-shirt','top','Black','Vintage-print tee','A nostalgic print makes this an easy conversation piece.','{"material":"cotton","pattern":"retro graphic","fit":"regular","sleeve":"short sleeve","style":["casual","nostalgic"]}'::jsonb,'10032.jpg'),
  ('Black mesh training shorts','bottom','Black','Running shorts','A practical pair for a quick run or a relaxed gym session.','{"material":"performance fabric","pattern":"solid","fit":"relaxed","length":"above knee","style":["sporty","casual"]}'::jsonb,'10033.jpg'),
  ('Black patterned track top','top','Black','Long-sleeve athletic top','A streamlined layer for an early walk or cool workout.','{"material":"performance knit","pattern":"tonal stripe","fit":"regular","sleeve":"long sleeve","style":["sporty","minimal"]}'::jsonb,'10034.jpg'),
  ('Grey everyday running shoes','shoes','Grey','Running shoes','Cushioned trainers for errands, walks, and active days.','{"material":"mesh and synthetic","pattern":"color block","fit":"lace-up","use":"running","style":["sporty","casual"]}'::jsonb,'10035.jpg'),
  ('Grey and yellow running shoes','shoes','Grey and yellow','Cushioned trainers','A pop of yellow livens up a practical running shoe.','{"material":"mesh and synthetic","pattern":"color block","fit":"lace-up","use":"running","style":["sporty","bright"]}'::jsonb,'10037.jpg'),
  ('Silver-blue training shoes','shoes','Silver and blue','Running sneakers','A lightweight-looking pair for everyday movement.','{"material":"mesh and synthetic","pattern":"color block","fit":"lace-up","use":"training","style":["sporty","casual"]}'::jsonb,'10039.jpg'),
  ('White striped polo shirt','top','White and yellow','Short-sleeve polo','A clean collar and soft stripes make an easy smart-casual top.','{"material":"cotton blend","pattern":"horizontal stripe","fit":"regular","sleeve":"short sleeve","style":["classic","sporty"]}'::jsonb,'10040.jpg'),
  ('Earth-tone striped polo','top','Brown and charcoal','Striped polo shirt','Muted stripes bring a little texture to a neutral outfit.','{"material":"cotton blend","pattern":"horizontal stripe","fit":"regular","sleeve":"short sleeve","style":["classic","casual"]}'::jsonb,'10041.jpg'),
  ('Raspberry pink polo','top','Raspberry','Short-sleeve polo','A saturated pink layer brightens dark denim or neutral trousers.','{"material":"cotton blend","pattern":"solid","fit":"regular","sleeve":"short sleeve","style":["classic","bright"]}'::jsonb,'10042.jpg'),
  ('Black running shorts','bottom','Black','Lightweight sports shorts','A simple activewear staple for warm-weather workouts.','{"material":"performance fabric","pattern":"solid","fit":"relaxed","length":"short","style":["sporty","minimal"]}'::jsonb,'10052.jpg'),
  ('Purple rugby polo','top','Purple','Short-sleeve rugby shirt','A bold team-style top for a relaxed, sporty outfit.','{"material":"cotton blend","pattern":"graphic logo","fit":"regular","sleeve":"short sleeve","style":["sporty","statement"]}'::jsonb,'10054.jpg')
) as sample(name,category,color,subcategory,notes,attributes,image_name)
where not exists (
  select 1 from public.wardrobe_items existing
  where existing.workspace_id='00000000-0000-4000-8000-000000000001'
    and existing.name=sample.name
    and existing.attribute_provenance->>'source'='local_seed'
);
