-- Shared-team CRM: every authenticated team member can read and write every
-- row in every business table. Row-level ownership (propietario_id,
-- asignado_a) is a display/assignment concept, not an access-control
-- boundary, so policies use `using (true)` scoped to the `authenticated`
-- role rather than an auth.uid() ownership predicate.

alter table profiles enable row level security;
alter table clientes enable row level security;
alter table aseguradoras enable row level security;
alter table polizas enable row level security;
alter table oportunidades enable row level security;
alter table tareas enable row level security;

-- profiles: any authenticated user can see the team roster; a user may only
-- update their own row. Inserts happen exclusively via the handle_new_user
-- trigger (security definer), so no insert policy is granted to clients.

create policy "profiles_select_authenticated"
  on profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- clientes, aseguradoras, polizas, oportunidades, tareas: full shared access
-- for any authenticated team member.

create policy "clientes_all_authenticated"
  on clientes for all
  to authenticated
  using (true)
  with check (true);

create policy "aseguradoras_all_authenticated"
  on aseguradoras for all
  to authenticated
  using (true)
  with check (true);

create policy "polizas_all_authenticated"
  on polizas for all
  to authenticated
  using (true)
  with check (true);

create policy "oportunidades_all_authenticated"
  on oportunidades for all
  to authenticated
  using (true)
  with check (true);

create policy "tareas_all_authenticated"
  on tareas for all
  to authenticated
  using (true)
  with check (true);
