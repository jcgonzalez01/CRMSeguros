-- Paso 2 de 2: 'Gerente' y 'Corredor' ya son valores confirmados del enum
-- (0016 hizo commit). Ahora:
--   1) autoasignación de dueño para Corredor en insert (oportunidades,
--      polizas, tareas);
--   2) RLS: Admin/Gerente sin restricción adicional (como hoy, solo
--      empresa_id); Corredor solo ve/edita filas donde es el dueño, y no
--      puede reasignarlas a otra persona.
-- clientes y aseguradoras NO se tocan: siguen compartidos dentro de la
-- empresa para cualquier rol (evita romper el join clientes<->polizas
-- cuando el propietario del cliente y el de la póliza son Corredores
-- distintos).

-- 1) Autoasignación --------------------------------------------------

create function set_propietario_id_corredor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select current_user_role()) = 'Corredor' and new.propietario_id is null then
    new.propietario_id = (select auth.uid());
  end if;
  return new;
end;
$$;

create function set_asignado_a_corredor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select current_user_role()) = 'Corredor' and new.asignado_a is null then
    new.asignado_a = (select auth.uid());
  end if;
  return new;
end;
$$;

create trigger oportunidades_set_propietario_id_corredor
  before insert on oportunidades
  for each row execute function set_propietario_id_corredor();

create trigger polizas_set_propietario_id_corredor
  before insert on polizas
  for each row execute function set_propietario_id_corredor();

create trigger tareas_set_asignado_a_corredor
  before insert on tareas
  for each row execute function set_asignado_a_corredor();

-- 2) RLS ---------------------------------------------------------------

drop policy "oportunidades_all_own_empresa" on oportunidades;
create policy "oportunidades_all_own_empresa"
  on oportunidades for all
  to authenticated
  using (
    empresa_id = (select current_user_empresa_id())
    and (
      (select current_user_role()) in ('Admin', 'Gerente')
      or propietario_id = (select auth.uid())
    )
  )
  with check (
    empresa_id = (select current_user_empresa_id())
    and (
      (select current_user_role()) in ('Admin', 'Gerente')
      or propietario_id = (select auth.uid())
    )
  );

drop policy "polizas_all_own_empresa" on polizas;
create policy "polizas_all_own_empresa"
  on polizas for all
  to authenticated
  using (
    empresa_id = (select current_user_empresa_id())
    and (
      (select current_user_role()) in ('Admin', 'Gerente')
      or propietario_id = (select auth.uid())
    )
  )
  with check (
    empresa_id = (select current_user_empresa_id())
    and (
      (select current_user_role()) in ('Admin', 'Gerente')
      or propietario_id = (select auth.uid())
    )
  );

drop policy "tareas_all_own_empresa" on tareas;
create policy "tareas_all_own_empresa"
  on tareas for all
  to authenticated
  using (
    empresa_id = (select current_user_empresa_id())
    and (
      (select current_user_role()) in ('Admin', 'Gerente')
      or asignado_a = (select auth.uid())
    )
  )
  with check (
    empresa_id = (select current_user_empresa_id())
    and (
      (select current_user_role()) in ('Admin', 'Gerente')
      or asignado_a = (select auth.uid())
    )
  );

-- Nota: oportunidades_propietario_id_idx, polizas_propietario_id_idx y
-- tareas_asignado_a_idx ya existen desde 0001_init_schema.sql — ahora
-- pasan de ser puramente informativos a ser predicado de RLS evaluado en
-- cada consulta de un Corredor, pero no hace falta crearlos de nuevo.
