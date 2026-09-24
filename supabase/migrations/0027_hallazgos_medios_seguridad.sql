-- Corrige 2 hallazgos MEDIOS de la auditoría de seguridad que requieren
-- cambios de esquema (los demás son solo TypeScript, ver el commit
-- acompañante):
--
-- 1) poliza_documentos no restringía por Corredor (a diferencia de
--    polizas), permitiendo a un Corredor ver/gestionar documentos de
--    pólizas ajenas dentro de su misma empresa. Se alinea con el mismo
--    criterio que ya usan polizas/oportunidades/tareas.
-- 2) Sin rate limiting aplicativo en invitar/resetear contraseña
--    (equipo.ts) — un Admin (o sesión comprometida) podía hacer spam sin
--    fricción. Tabla + función mínimas para un cooldown simple.

-- 1) poliza_documentos: restringir por Corredor vía la póliza dueña -----

drop policy "poliza_documentos_all_own_empresa" on poliza_documentos;

create policy "poliza_documentos_all_own_empresa"
  on poliza_documentos for all
  to authenticated
  using (
    empresa_id = (select current_user_empresa_id())
    and (
      (select current_user_role()) in ('Admin', 'Gerente')
      or exists (
        select 1 from polizas p
        where p.id = poliza_documentos.poliza_id
          and p.propietario_id = (select auth.uid())
      )
    )
  )
  with check (
    empresa_id = (select current_user_empresa_id())
    and (
      (select current_user_role()) in ('Admin', 'Gerente')
      or exists (
        select 1 from polizas p
        where p.id = poliza_documentos.poliza_id
          and p.propietario_id = (select auth.uid())
      )
    )
  );

-- 2) Rate limiting mínimo para invitar/resetear contraseña -------------
-- Tabla de bookkeeping interna: sin policies para `authenticated` (RLS
-- habilitada, cero policies = nadie la toca directo), solo accesible vía
-- la función SECURITY DEFINER de abajo.

create table rate_limits (
  clave text primary key,
  intentos int not null default 1,
  ventana_inicio timestamptz not null default now()
);

alter table rate_limits enable row level security;

create function verificar_rate_limit(
  p_clave text,
  p_max_intentos int,
  p_ventana_segundos int
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fila public.rate_limits;
begin
  select * into v_fila from public.rate_limits where clave = p_clave for update;

  if not found then
    insert into public.rate_limits (clave, intentos, ventana_inicio) values (p_clave, 1, now());
    return true;
  end if;

  if now() - v_fila.ventana_inicio > (p_ventana_segundos || ' seconds')::interval then
    update public.rate_limits set intentos = 1, ventana_inicio = now() where clave = p_clave;
    return true;
  end if;

  if v_fila.intentos >= p_max_intentos then
    return false;
  end if;

  update public.rate_limits set intentos = intentos + 1 where clave = p_clave;
  return true;
end;
$$;
