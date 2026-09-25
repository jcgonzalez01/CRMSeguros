-- Paso 1 de 2: amplía task_status con estados intermedios y terminales
-- adicionales. Antes solo existía pendiente/completada con un toggle tipo
-- checkbox en la UI.
--
-- alter type ... add value no puede usarse en la misma transacción en la que
-- luego se referencia el valor nuevo (p.ej. en una vista o un where), así que
-- las vistas/lógica que usan estos valores van en la migración 0029.
alter type task_status add value if not exists 'en_progreso' after 'pendiente';
alter type task_status add value if not exists 'en_espera' after 'en_progreso';
alter type task_status add value if not exists 'vencida' after 'en_espera';
alter type task_status add value if not exists 'cancelada' after 'completada';
