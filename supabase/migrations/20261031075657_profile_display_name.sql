-- Shared demo profile label; never use it as a per-visitor identity.
alter table public.user_preferences
  add column display_name text,
  add constraint user_preferences_display_name_check
    check (
      display_name is null
      or (
        char_length(btrim(display_name)) between 1 and 80
        and display_name = btrim(display_name)
      )
    );

