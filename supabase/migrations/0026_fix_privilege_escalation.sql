-- Corrige 3 hallazgos CRÍTICOS de una auditoría de seguridad:
--
-- 1) profiles_update_own (0002) nunca se endureció cuando role/empresa_id
--    se agregaron en 0006 — cualquier usuario autenticado podía hacer
--    `update profiles set role='Admin', empresa_id='<otra>' where
--    id=auth.uid()` directo contra Postgres/PostgREST y auto-escalar
--    privilegios o migrarse a otra empresa, sin pasar por equipo.ts.
--    Fix: trigger BEFORE UPDATE que revierte role/empresa_id a su valor
--    anterior salvo que quien ejecuta sea el client admin/service_role
--    (que es como equipo.ts ya hace estos cambios legítimamente, con sus
--    propias validaciones en TypeScript — ver getTargetProfileOrThrow).
--
-- 2) sembrar_aseguradoras_default/sembrar_permisos_default/
--    sembrar_perfil_empresa_default: funciones SECURITY DEFINER sin
--    chequeo de rol propio, pensadas para llamarse solo desde
--    provisionar_empresa (que sí valida Manager) pero invocables por
--    cualquier usuario autenticado vía RPC directo con un p_empresa
--    arbitrario, permitiendo escritura cruzada en el catálogo de otra
--    empresa. Fix: agregar el mismo chequeo que ya tiene
--    provisionar_empresa. auth.uid() es null cuando estas funciones
--    corren desde una migración (contexto de `db push`, sin sesión), así
--    que el chequeo no afecta el backfill ya aplicado ni futuros
--    despliegues desde cero.
--
-- 3) crear_tareas_renovacion(): pensada para correr solo vía pg_cron
--    (sin sesión, auth.uid() null), pero invocable por cualquier usuario
--    autenticado vía RPC, creando tareas en TODAS las empresas del
--    sistema. Fix: rechaza cualquier invocación con auth.uid() no nulo
--    (es decir, cualquier llamada autenticada vía PostgREST) — el cron
--    sigue funcionando porque corre sin JWT/sesión.

-- 1) profiles: blindar role/empresa_id contra auto-escalación ----------

create function protect_profile_role_empresa()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.role() <> 'service_role' then
    new.role = old.role;
    new.empresa_id = old.empresa_id;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role_empresa
  before update on profiles
  for each row execute function protect_profile_role_empresa();

-- 2) Funciones de siembra: exigir rol Manager (recreadas por completo,
-- create or replace exige el cuerpo íntegro) --------------------------

create or replace function sembrar_aseguradoras_default(p_empresa uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if public.current_user_role() <> 'Manager' then
    raise exception 'No autorizado.';
  end if;

  insert into public.aseguradoras (empresa_id, nombre) values
    (p_empresa, 'Seguros Universal, S.A.'),
    (p_empresa, 'Humano Seguros, S.A.'),
    (p_empresa, 'Seguros Reservas, S.A.'),
    (p_empresa, 'MAPFRE BHD Seguros, S.A.'),
    (p_empresa, 'La Colonial, S.A. Compañía de Seguros'),
    (p_empresa, 'Atlántica Seguros, S.A.'),
    (p_empresa, 'La Monumental de Seguros, S.A.'),
    (p_empresa, 'UNIT Seguros, S.A.'),
    (p_empresa, 'Midas Seguros, S.A.'),
    (p_empresa, 'Seguros Yunen, S.A.'),
    (p_empresa, 'Seguros Sura, S.A.'),
    (p_empresa, 'Seguros Pepín, S.A.');
end;
$$;

create or replace function sembrar_permisos_default(p_empresa uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if public.current_user_role() <> 'Manager' then
    raise exception 'No autorizado.';
  end if;

  insert into public.permisos_modulo (empresa_id, role, modulo, nivel)
  select p_empresa, r.role, m.modulo, 'editar'
  from unnest(array['Gerente', 'Corredor']::public.user_role[]) as r(role)
  cross join unnest(array[
    'clientes', 'polizas', 'aseguradoras', 'oportunidades', 'tareas', 'reportes'
  ]) as m(modulo)
  on conflict (empresa_id, role, modulo) do nothing;
end;
$$;

create or replace function sembrar_perfil_empresa_default(p_empresa uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if public.current_user_role() <> 'Manager' then
    raise exception 'No autorizado.';
  end if;

  insert into public.empresa_perfil (empresa_id) values (p_empresa)
  on conflict (empresa_id) do nothing;
end;
$$;

-- 3) crear_tareas_renovacion: solo cron, nunca vía RPC autenticado ------

create or replace function crear_tareas_renovacion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    raise exception 'Esta función solo se ejecuta automáticamente (cron).';
  end if;

  insert into public.tareas (
    empresa_id, titulo, descripcion, cliente_id, poliza_id,
    asignado_a, fecha_limite, estado
  )
  select
    p.empresa_id,
    'Renovar póliza ' || p.numero_poliza,
    'Vence el ' || to_char(p.fecha_vencimiento, 'DD/MM/YYYY') || '. Producto: ' || p.producto || '.',
    p.cliente_id,
    p.id,
    p.propietario_id,
    p.fecha_vencimiento - interval '15 days',
    'pendiente'
  from public.polizas p
  where p.estado = 'activa'
    and p.fecha_vencimiento between current_date and current_date + 30
    and not exists (
      select 1 from public.tareas t
      where t.poliza_id = p.id and t.titulo like 'Renovar póliza %'
    );
end;
$$;
