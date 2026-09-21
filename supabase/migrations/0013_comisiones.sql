-- Comisión por póliza: monto fijo o porcentaje del monto de la póliza, a
-- elegir por póliza. "Corredor" reutiliza polizas.propietario_id (ya
-- representa al miembro del equipo responsable) — no se duplica el dato.

create type comision_tipo as enum ('monto', 'porcentaje');

alter table polizas
  add column comision_tipo comision_tipo,
  add column comision_valor numeric(12, 2),
  add column comision_monto numeric(12, 2) generated always as (
    case
      when comision_tipo = 'monto' then comision_valor
      when comision_tipo = 'porcentaje' then round(monto * comision_valor / 100, 2)
      else null
    end
  ) stored;
