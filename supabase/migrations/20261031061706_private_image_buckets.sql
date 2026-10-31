-- Storage is server-mediated in the shared demo; no browser policies are added.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('wardrobe', 'wardrobe', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('inspiration', 'inspiration', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('previews', 'previews', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
