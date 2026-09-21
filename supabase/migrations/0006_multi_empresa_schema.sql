-- Multi-tenant: cada corredora ("empresa") es un tenant aislado. Admin =
-- miembro con acceso total dentro de su propia empresa. Manager = rol de
-- plataforma, sin empresa, administra el catálogo de empresas.

create type user_role as enum ('Admin', 'Manager');

create table empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

-- Columnas nullable por ahora; 0007 hace el backfill de los datos
-- existentes y luego las pone NOT NULL.
alter table profiles
  add column empresa_id uuid references empresas (id),
  add column role user_role;

alter table clientes add column empresa_id uuid references empresas (id);
alter table aseguradoras add column empresa_id uuid references empresas (id);
alter table polizas add column empresa_id uuid references empresas (id);
alter table oportunidades add column empresa_id uuid references empresas (id);
alter table tareas add column empresa_id uuid references empresas (id);

create index clientes_empresa_id_idx on clientes (empresa_id);
create index aseguradoras_empresa_id_idx on aseguradoras (empresa_id);
create index polizas_empresa_id_idx on polizas (empresa_id);
create index oportunidades_empresa_id_idx on oportunidades (empresa_id);
create index tareas_empresa_id_idx on tareas (empresa_id);
create index profiles_empresa_id_idx on profiles (empresa_id);

-- Funciones bisagra: resuelven la empresa/rol del usuario autenticado
-- actual. SECURITY DEFINER porque profiles tiene RLS y leerla desde una
-- política de la propia profiles sería una dependencia circular.

create function current_user_empresa_id()
returns uuid
language sql
stable
security definer set search_path = ''
as $$
  select empresa_id from public.profiles where id = auth.uid();
$$;

create function current_user_role()
returns user_role
language sql
stable
security definer set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Estampa empresa_id en cada insert de una tabla de negocio, siempre
-- sobrescribiendo lo que mande el cliente (nunca confiar en ese valor) —
-- así ningún código de aplicación necesita enviar empresa_id, y no hay
-- forma de insertar una fila en la empresa de otro.

create function set_empresa_id()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.empresa_id = public.current_user_empresa_id();
  return new;
end;
$$;

create trigger clientes_set_empresa_id
  before insert on clientes
  for each row execute function set_empresa_id();

create trigger aseguradoras_set_empresa_id
  before insert on aseguradoras
  for each row execute function set_empresa_id();

create trigger polizas_set_empresa_id
  before insert on polizas
  for each row execute function set_empresa_id();

create trigger oportunidades_set_empresa_id
  before insert on oportunidades
  for each row execute function set_empresa_id();

create trigger tareas_set_empresa_id
  before insert on tareas
  for each row execute function set_empresa_id();

-- Cataálogo base de aseguradoras dominicanas, sembrado en cada empresa
-- nueva (mismo listado usado para los datos de prueba).
create function sembrar_aseguradoras_default(p_empresa uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.aseguradoras (empresa_id, nombre) values
    (p_empresa, 'Seguros Universal, S.A.'),
    (p_empresa, 'Humano Seguros, S.A.'),
    (p_empresa, 'Seguros Reservas, S.A.'),
    (p_empresa, 'MAPFRE BHD Seguros, S.A.'),
    (p_empresa, 'La Colonial, S.A. Compañía de Seguros'),
    (p_empresa, 'Atlántica Seguros, S.A.'),
    (p_empresa, 'La Monumental de Seguros, S.A.'),
    (p_empresa, 'UNIT Seguros, S.A.'),
    (p_empresa, 'Midas Seguros, S.A.'),
    (p_empresa, 'Seguros Yunen, S.A.'),
    (p_empresa, 'Seguros Sura, S.A.'),
    (p_empresa, 'Seguros Pepín, S.A.');
end;
$$;

create function provisionar_empresa(p_nombre text)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_empresa uuid;
begin
  if public.current_user_role() <> 'Manager' then
    raise exception 'Solo el Manager puede crear empresas.';
  end if;

  insert into public.empresas (nombre) values (trim(p_nombre))
  returning id into v_empresa;

  perform public.sembrar_aseguradoras_default(v_empresa);

  return v_empresa;
end;
$$;

-- Reemplaza el trigger de perfiles (0003) para leer también role/empresa_id
-- de la metadata del usuario invitado, y fallar fuerte si no cuadran en
-- vez de crear un perfil inconsistente.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_empresa uuid;
begin
  v_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'Admin'
  );
  v_empresa := (new.raw_user_meta_data ->> 'empresa_id')::uuid;

  if v_role = 'Manager' and v_empresa is not null then
    raise exception 'Un usuario Manager no puede tener empresa_id.';
  end if;
  if v_role = 'Admin' and v_empresa is null then
    raise exception 'Un usuario Admin requiere empresa_id.';
  end if;

  insert into public.profiles (id, full_name, email, role, empresa_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    v_role,
    v_empresa
  );
  return new;
end;
$$;
