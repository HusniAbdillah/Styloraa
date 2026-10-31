-- A stale application revision is deterministic. SQLSTATE 40001 makes PostgREST
-- retry it as a serialization failure, so use its explicit HTTP 409 code.
-- Preserve each function's validated body, signature, owner and existing ACL.
do $migration$
declare
  target record;
  definition text;
  updated_count integer := 0;
begin
  for target in
    select p.oid
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
      and p.proname in (
        'persist_inspiration_revision', 'persist_look_results',
        'save_outfit_option', 'select_outfit_products'
      )
  loop
    definition := pg_catalog.pg_get_functiondef(target.oid);
    if pg_catalog.strpos(definition, '''40001''') = 0 then
      raise exception 'Expected a revision guard in each target function';
    end if;
    execute pg_catalog.replace(definition, '''40001''', '''PT409''');
    updated_count := updated_count + 1;
  end loop;
  if updated_count <> 4 then
    raise exception 'Expected exactly four revision-guarded functions';
  end if;
end
$migration$;
