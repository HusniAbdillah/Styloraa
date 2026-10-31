-- Shared, non-personal demo workspace. Never seed real user information here.
insert into public.workspaces (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Stylora demo')
on conflict (id) do nothing;

insert into public.user_preferences (workspace_id, style_notes)
values ('00000000-0000-4000-8000-000000000001', '')
on conflict (workspace_id) do nothing;
