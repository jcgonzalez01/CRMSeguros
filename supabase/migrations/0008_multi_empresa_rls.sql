-- Reescribe RLS para aislar cada tabla de negocio por empresa_id, y agrega
-- políticas para la nueva tabla empresas.

alter table empresas enable row level security;

create policy "empresas_select"
  on empresas for select
  to authenticated
  using (current_user_role() = 'Manager' or id = current_user_empresa_id());

create policy "empresas_write_manager"
  on empresas for all
  to authenticated
  using (current_user_role() = 'Manager')
  with check (current_user_role() = 'Manager');

-- profiles: antes cualquier autenticado veía todo el roster (fuga entre
-- empresas en un mundo multi-tenant). Ahora se limita a la propia empresa;
-- Manager ve todos los perfiles para administrar la plataforma.

drop policy "profiles_select_authenticated" on profiles;

create policy "profiles_select_own_empresa"
  on profiles for select
  to authenticated
  using (
    empresa_id = current_user_empresa_id()
    or current_user_role() = 'Manager'
  );

-- clientes, aseguradoras, polizas, oportunidades, tareas: reemplaza el
-- acceso compartido global por acceso compartido dentro de la propia
-- empresa únicamente.

drop policy "clientes_all_authenticated" on clientes;
create policy "clientes_all_own_empresa"
  on clientes for all
  to authenticated
  using (empresa_id = current_user_empresa_id())
  with check (empresa_id = current_user_empresa_id());

drop policy "aseguradoras_all_authenticated" on aseguradoras;
create policy "aseguradoras_all_own_empresa"
  on aseguradoras for all
  to authenticated
  using (empresa_id = current_user_empresa_id())
  with check (empresa_id = current_user_empresa_id());

drop policy "polizas_all_authenticated" on polizas;
create policy "polizas_all_own_empresa"
  on polizas for all
  to authenticated
  using (empresa_id = current_user_empresa_id())
  with check (empresa_id = current_user_empresa_id());

drop policy "oportunidades_all_authenticated" on oportunidades;
create policy "oportunidades_all_own_empresa"
  on oportunidades for all
  to authenticated
  using (empresa_id = current_user_empresa_id())
  with check (empresa_id = current_user_empresa_id());

drop policy "tareas_all_authenticated" on tareas;
create policy "tareas_all_own_empresa"
  on tareas for all
  to authenticated
  using (empresa_id = current_user_empresa_id())
  with check (empresa_id = current_user_empresa_id());
