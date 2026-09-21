-- Realtime is opt-in per table in Supabase.

alter publication supabase_realtime add table clientes;
alter publication supabase_realtime add table aseguradoras;
alter publication supabase_realtime add table polizas;
alter publication supabase_realtime add table oportunidades;
alter publication supabase_realtime add table tareas;
