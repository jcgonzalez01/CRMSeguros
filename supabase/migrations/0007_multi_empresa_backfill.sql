-- Backfill: los datos ya existentes (creados antes de multi-tenant) pasan
-- a pertenecer a la primera empresa real, "Kaizen Home RD". jcgonzalez.01@
-- gmail.com se convierte en el Manager de plataforma (sin empresa).

do $$
declare
  v_empresa uuid;
  v_manager_id uuid := 'b8d684fd-de3e-4610-937a-a7b08855b06f'; -- jcgonzalez.01@gmail.com
  v_admin_id uuid := '93c9c309-b0a0-4151-bc9d-96be565755fb';   -- jcgonzalez@kaizenhomerd.com
begin
  insert into empresas (nombre) values ('Kaizen Home RD')
  returning id into v_empresa;

  update clientes set empresa_id = v_empresa where empresa_id is null;
  update aseguradoras set empresa_id = v_empresa where empresa_id is null;
  update polizas set empresa_id = v_empresa where empresa_id is null;
  update oportunidades set empresa_id = v_empresa where empresa_id is null;
  update tareas set empresa_id = v_empresa where empresa_id is null;

  update profiles set role = 'Manager', empresa_id = null
    where id = v_manager_id;
  update profiles set role = 'Admin', empresa_id = v_empresa
    where id = v_admin_id;
end;
$$;

alter table clientes alter column empresa_id set not null;
alter table aseguradoras alter column empresa_id set not null;
alter table polizas alter column empresa_id set not null;
alter table oportunidades alter column empresa_id set not null;
alter table tareas alter column empresa_id set not null;
alter table profiles alter column role set not null;

-- El nombre de aseguradora ya no puede ser único globalmente: dos empresas
-- distintas pueden tener ambas "Seguros Universal, S.A." en su catálogo.
alter table aseguradoras drop constraint aseguradoras_nombre_key;
alter table aseguradoras add constraint aseguradoras_empresa_nombre_key
  unique (empresa_id, nombre);
