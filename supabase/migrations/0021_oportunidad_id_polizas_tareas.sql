-- Vincula pólizas y tareas a la oportunidad de la que surgieron, cerrando
-- el hueco donde el pipeline de ventas quedaba desconectado del resto del
-- sistema (no había forma de medir conversión real oportunidad→póliza ni
-- de dar seguimiento estructurado atado a una oportunidad puntual).
-- on delete set null (no cascade): borrar una oportunidad nunca debe
-- borrar trabajo real ya hecho (una póliza o tarea existente).

alter table polizas add column oportunidad_id uuid references oportunidades (id) on delete set null;
alter table tareas add column oportunidad_id uuid references oportunidades (id) on delete set null;

create index polizas_oportunidad_id_idx on polizas (oportunidad_id);
create index tareas_oportunidad_id_idx on tareas (oportunidad_id);
