-- Dashboard aggregation views. security_invoker ensures each view enforces
-- the RLS policies of the querying user (not the view owner's), consistent
-- with the shared-team access model.

create view v_polizas_vencen_semana
with (security_invoker = true) as
select p.*
from polizas p
where p.estado = 'activa'
  and p.fecha_vencimiento between date_trunc('week', current_date)::date
  and (date_trunc('week', current_date) + interval '6 days')::date;

create view v_polizas_vencidas
with (security_invoker = true) as
select p.*
from polizas p
where p.fecha_vencimiento < current_date
  and p.estado <> 'cancelada';

create view v_tareas_semana
with (security_invoker = true) as
select t.*
from tareas t
where t.estado = 'pendiente'
  and t.fecha_limite between date_trunc('week', current_date)::date
  and (date_trunc('week', current_date) + interval '6 days')::date;

create view v_tareas_atrasadas
with (security_invoker = true) as
select t.*
from tareas t
where t.estado = 'pendiente'
  and t.fecha_limite < current_date;

create view v_oportunidades_semana
with (security_invoker = true) as
select o.*
from oportunidades o
where o.estado in ('ganada', 'perdida')
  and o.fecha_cierre between date_trunc('week', current_date)::date
  and (date_trunc('week', current_date) + interval '6 days')::date;

create view v_resumen_financiero
with (security_invoker = true) as
select
  (select coalesce(sum(monto), 0) from polizas where estado = 'activa') as prima_total_activa,
  (select coalesce(sum(monto_estimado), 0) from oportunidades where estado = 'ganada') as monto_ganado;

create view v_conteo_polizas_por_aseguradora
with (security_invoker = true) as
select
  a.id,
  a.nombre,
  count(p.id) filter (where p.estado = 'activa') as polizas_activas
from aseguradoras a
left join polizas p on p.aseguradora_id = a.id
group by a.id, a.nombre;

create view v_totales_oportunidades
with (security_invoker = true) as
select
  estado,
  count(*) as cantidad,
  coalesce(sum(monto_estimado), 0) as monto_total
from oportunidades
group by estado;
