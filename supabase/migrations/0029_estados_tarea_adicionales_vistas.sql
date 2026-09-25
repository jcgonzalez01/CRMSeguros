-- Paso 2 de 2: 'en_progreso', 'en_espera', 'vencida' y 'cancelada' ya son
-- valores confirmados del enum task_status (0028 hizo commit). Ahora se
-- actualizan las vistas del dashboard y renovarPoliza para que cualquier
-- estado no terminal (todo menos completada/cancelada) cuente como
-- "pendiente de atención", en vez de solo el literal 'pendiente'.

create or replace view v_tareas_semana
with (security_invoker = true) as
select t.*
from tareas t
where t.estado not in ('completada', 'cancelada')
  and t.fecha_limite between date_trunc('week', current_date)::date
  and (date_trunc('week', current_date) + interval '6 days')::date;

create or replace view v_tareas_atrasadas
with (security_invoker = true) as
select t.*
from tareas t
where t.estado not in ('completada', 'cancelada')
  and t.fecha_limite < current_date;
