-- v_resumen_financiero sumaba monto de todas las pólizas activas sin
-- distinguir moneda, lo cual ya no tiene sentido ahora que una póliza
-- puede estar en DOP o USD (sumar RD$ + US$ da un total sin significado).
-- Se reemplaza por una vista agrupada por moneda, más v_monto_ganado
-- separado (oportunidades no tiene columna de moneda).

drop view v_resumen_financiero;

create view v_prima_activa_por_moneda
with (security_invoker = true) as
select
  moneda,
  coalesce(sum(monto), 0) as prima_total_activa
from polizas
where estado = 'activa'
group by moneda;

create view v_monto_ganado
with (security_invoker = true) as
select coalesce(sum(monto_estimado), 0) as monto_ganado
from oportunidades
where estado = 'ganada';
