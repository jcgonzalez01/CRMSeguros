-- Seguimiento de renovaciones: cuando una póliza activa está por vencer,
-- se crea automáticamente una tarea de renovación (si no existe ya una),
-- asignada al propietario de la póliza. Corre una vez al día vía pg_cron.

create extension if not exists pg_cron with schema pg_catalog;

alter table tareas add column poliza_id uuid references polizas (id) on delete cascade;
create index tareas_poliza_id_idx on tareas (poliza_id);

-- SECURITY DEFINER porque itera TODAS las empresas (el cron no tiene un
-- "usuario actual"): current_user_empresa_id() sería null, así que cada
-- fila estampa su empresa_id explícitamente (mismo patrón que
-- sembrar_aseguradoras_default en 0006) en vez de confiar en el trigger.
create function crear_tareas_renovacion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
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

select cron.schedule(
  'crear-tareas-renovacion-diario',
  '0 8 * * *',
  $$select public.crear_tareas_renovacion()$$
);
