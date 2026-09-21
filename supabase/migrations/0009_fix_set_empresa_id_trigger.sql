-- set_empresa_id() unconditionally overwrote empresa_id, which breaks
-- provisionar_empresa(): it runs as the Manager (empresa_id = NULL) but
-- needs to seed aseguradoras for the *new* empresa it just created, not
-- the caller's own (nonexistent) one.
--
-- Fix: only fill empresa_id when the caller left it null. Ordinary app
-- inserts never send it (see src/lib/supabase/insert-helpers.ts), so this
-- still auto-fills them correctly. SECURITY DEFINER functions that
-- legitimately target a different empresa (provisionar_empresa) now work
-- by setting it explicitly in their own INSERT statements.
--
-- This does not weaken isolation for ordinary authenticated inserts: RLS
-- policies still enforce `with check (empresa_id = current_user_empresa_id())`
-- on every business table, so a client that explicitly sends a spoofed
-- empresa_id is rejected by RLS regardless of what this trigger does.
-- (Inside a SECURITY DEFINER function RLS does not apply at all, which is
-- exactly why sembrar_aseguradoras_default must keep setting it
-- explicitly — the trigger alone was never a substitute for that.)

create or replace function set_empresa_id()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.empresa_id is null then
    new.empresa_id = public.current_user_empresa_id();
  end if;
  return new;
end;
$$;
