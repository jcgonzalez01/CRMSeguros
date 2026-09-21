-- Enums

create type policy_status as enum ('activa', 'vencida', 'cancelada');
create type payment_plan as enum ('unico', 'mensual', 'trimestral', 'semestral', 'anual');
create type opportunity_status as enum ('abierta', 'ganada', 'perdida');
create type task_status as enum ('pendiente', 'completada');

-- profiles: mirrors auth.users, represents "Equipo" (team members)

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- clientes

create table clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  correo text,
  notas text,
  propietario_id uuid references profiles (id) on delete set null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clientes_propietario_id_idx on clientes (propietario_id);
create index clientes_created_by_idx on clientes (created_by);
create index clientes_nombre_idx on clientes (nombre);
create index clientes_search_idx on clientes
  using gin (
    to_tsvector(
      'spanish',
      coalesce(nombre, '') || ' ' || coalesce(correo, '') || ' ' || coalesce(telefono, '')
    )
  );

-- aseguradoras

create table aseguradoras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  notas text,
  created_at timestamptz not null default now()
);

-- polizas

create table polizas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  aseguradora_id uuid not null references aseguradoras (id) on delete restrict,
  producto text not null,
  numero_poliza text not null,
  fecha_emision date not null,
  fecha_vencimiento date not null,
  monto numeric(12, 2) not null,
  plan_pago payment_plan not null,
  estado policy_status not null default 'activa',
  propietario_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (aseguradora_id, numero_poliza)
);

create index polizas_cliente_id_idx on polizas (cliente_id);
create index polizas_aseguradora_id_idx on polizas (aseguradora_id);
create index polizas_propietario_id_idx on polizas (propietario_id);
create index polizas_estado_idx on polizas (estado);
create index polizas_fecha_vencimiento_idx on polizas (fecha_vencimiento);

-- oportunidades

create table oportunidades (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  titulo text not null,
  monto_estimado numeric(12, 2),
  estado opportunity_status not null default 'abierta',
  propietario_id uuid references profiles (id) on delete set null,
  fecha_cierre date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index oportunidades_cliente_id_idx on oportunidades (cliente_id);
create index oportunidades_propietario_id_idx on oportunidades (propietario_id);
create index oportunidades_estado_idx on oportunidades (estado);
create index oportunidades_fecha_cierre_idx on oportunidades (fecha_cierre);

-- tareas

create table tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  cliente_id uuid references clientes (id) on delete set null,
  asignado_a uuid references profiles (id) on delete set null,
  fecha_limite date not null,
  estado task_status not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tareas_cliente_id_idx on tareas (cliente_id);
create index tareas_asignado_a_idx on tareas (asignado_a);
create index tareas_estado_idx on tareas (estado);
create index tareas_fecha_limite_idx on tareas (fecha_limite);

-- updated_at maintenance trigger, reused by every table that has the column

create function set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clientes_set_updated_at
  before update on clientes
  for each row execute function set_updated_at();

create trigger polizas_set_updated_at
  before update on polizas
  for each row execute function set_updated_at();

create trigger oportunidades_set_updated_at
  before update on oportunidades
  for each row execute function set_updated_at();

create trigger tareas_set_updated_at
  before update on tareas
  for each row execute function set_updated_at();
