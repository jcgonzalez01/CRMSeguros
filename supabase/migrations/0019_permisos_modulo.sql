-- Matriz de permisos configurable por módulo (rol Gerente/Corredor dentro
-- de cada empresa). Admin siempre tiene 'editar' en todo, hardcodeado en
-- código — nunca se consulta esta tabla para Admin/Manager. 'dashboard' y
-- 'equipo' no participan: dashboard es el fallback de todo redirect de
-- acceso denegado (bloquearlo crearía loop) y equipo ya es Admin-only fijo
-- vía middleware, sin relación con esta matriz.

create table permisos_modulo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas (id) on delete cascade,
  role user_role not null,
  modulo text not null check (
    modulo in ('clientes', 'polizas', 'aseguradoras', 'oportunidades', 'tareas', 'reportes')
  ),
  nivel text not null check (nivel in ('bloqueado', 'ver', 'editar')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, role, modulo)
);

create index permisos_modulo_empresa_id_idx on permisos_modulo (empresa_id);

alter table permisos_modulo enable row level security;

-- SELECT: cualquier autenticado de la propia empresa (Gerente/Corredor
-- necesitan leerla para saber qué ven; Admin la necesita para pintar la
-- matriz).
create policy "permisos_modulo_select_own_empresa"
  on permisos_modulo for select
  to authenticated
  using (empresa_id = (select current_user_empresa_id()));

-- INSERT/UPDATE/DELETE: solo Admin de la propia empresa. Separadas por
-- comando (no "for all") porque el SELECT es más permisivo que la
-- escritura.
create policy "permisos_modulo_insert_admin"
  on permisos_modulo for insert
  to authenticated
  with check (
    empresa_id = (select current_user_empresa_id())
    and (select current_user_role()) = 'Admin'
  );

create policy "permisos_modulo_update_admin"
  on permisos_modulo for update
  to authenticated
  using (
    empresa_id = (select current_user_empresa_id())
    and (select current_user_role()) = 'Admin'
  )
  with check (
    empresa_id = (select current_user_empresa_id())
    and (select current_user_role()) = 'Admin'
  );

create policy "permisos_modulo_delete_admin"
  on permisos_modulo for delete
  to authenticated
  using (
    empresa_id = (select current_user_empresa_id())
    and (select current_user_role()) = 'Admin'
  );

-- Reusa el trigger existente (0009): solo estampa empresa_id si el
-- cliente lo dejó null, así el frontend nunca lo envía, igual que
-- clientes/aseguradoras/polizas/oportunidades/tareas.
create trigger permisos_modulo_set_empresa_id
  before insert on permisos_modulo
  for each row execute function set_empresa_id();

-- Siembra 'editar' para Gerente y Corredor en los 6 módulos — preserva el
-- comportamiento actual (hoy ambos roles ya pueden ver/editar todo), así
-- que activar esta feature no le quita acceso a nadie de golpe.
create function sembrar_permisos_default(p_empresa uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.permisos_modulo (empresa_id, role, modulo, nivel)
  select p_empresa, r.role, m.modulo, 'editar'
  from unnest(array['Gerente', 'Corredor']::public.user_role[]) as r(role)
  cross join unnest(array[
    'clientes', 'polizas', 'aseguradoras', 'oportunidades', 'tareas', 'reportes'
  ]) as m(modulo)
  on conflict (empresa_id, role, modulo) do nothing;
end;
$$;

-- provisionar_empresa recreada por completo (create or replace no permite
-- "agregar una línea": se reproduce el cuerpo íntegro de 0006, agregando
-- solo la llamada a sembrar_permisos_default).
create or replace function provisionar_empresa(p_nombre text)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_empresa uuid;
begin
  if public.current_user_role() <> 'Manager' then
    raise exception 'Solo el Manager puede crear empresas.';
  end if;

  insert into public.empresas (nombre) values (trim(p_nombre))
  returning id into v_empresa;

  perform public.sembrar_aseguradoras_default(v_empresa);
  perform public.sembrar_permisos_default(v_empresa);

  return v_empresa;
end;
$$;

-- Backfill: todas las empresas existentes obtienen las 12 filas ('editar'
-- para Gerente/Corredor × 6 módulos) — mismo comportamiento de hoy,
-- preservado explícitamente en vez de heredado por default de tabla vacía.
select public.sembrar_permisos_default(id) from public.empresas;
