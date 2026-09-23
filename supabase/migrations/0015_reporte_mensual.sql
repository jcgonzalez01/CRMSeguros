-- Reemplaza la agregación en el navegador (traer todas las pólizas y sumar
-- en JS) por una función SQL que calcula todo por mes de una vez: pólizas
-- vendidas, primas por moneda, clientes nuevos, conversión de
-- oportunidades y cumplimiento de tareas. SECURITY INVOKER: corre con los
-- privilegios de quien llama, así que las políticas RLS de cada tabla ya
-- acotan todo a su propia empresa sin necesidad de filtrar empresa_id acá.

create function reporte_mensual(meses int default 12)
returns table (
  mes date,
  polizas_vendidas bigint,
  primas_dop numeric,
  primas_usd numeric,
  clientes_nuevos bigint,
  oportunidades_ganadas bigint,
  oportunidades_perdidas bigint,
  monto_ganado numeric,
  tareas_completadas bigint,
  tareas_totales bigint
)
language sql
security invoker
set search_path = ''
stable
as $$
  with meses_serie as (
    select date_trunc('month', current_date - (n || ' months')::interval)::date as mes
    from generate_series(0, meses - 1) as n
  ),
  polizas_agg as (
    select
      date_trunc('month', fecha_emision)::date as mes,
      count(*) as polizas_vendidas,
      sum(monto) filter (where moneda = 'DOP') as primas_dop,
      sum(monto) filter (where moneda = 'USD') as primas_usd
    from public.polizas
    group by 1
  ),
  clientes_agg as (
    select
      date_trunc('month', created_at)::date as mes,
      count(*) as clientes_nuevos
    from public.clientes
    group by 1
  ),
  oportunidades_agg as (
    select
      date_trunc('month', coalesce(fecha_cierre, created_at::date))::date as mes,
      count(*) filter (where estado = 'ganada') as oportunidades_ganadas,
      count(*) filter (where estado = 'perdida') as oportunidades_perdidas,
      sum(monto_estimado) filter (where estado = 'ganada') as monto_ganado
    from public.oportunidades
    group by 1
  ),
  tareas_agg as (
    select
      date_trunc('month', fecha_limite)::date as mes,
      count(*) filter (where estado = 'completada') as tareas_completadas,
      count(*) as tareas_totales
    from public.tareas
    group by 1
  )
  select
    ms.mes,
    coalesce(p.polizas_vendidas, 0),
    coalesce(p.primas_dop, 0),
    coalesce(p.primas_usd, 0),
    coalesce(c.clientes_nuevos, 0),
    coalesce(o.oportunidades_ganadas, 0),
    coalesce(o.oportunidades_perdidas, 0),
    coalesce(o.monto_ganado, 0),
    coalesce(t.tareas_completadas, 0),
    coalesce(t.tareas_totales, 0)
  from meses_serie ms
  left join polizas_agg p on p.mes = ms.mes
  left join clientes_agg c on c.mes = ms.mes
  left join oportunidades_agg o on o.mes = ms.mes
  left join tareas_agg t on t.mes = ms.mes
  order by ms.mes;
$$;
