-- Dependientes de un cliente (cónyuge, hijos, etc.) — necesarios para
-- pólizas de vida/salud. Compartidos dentro de la empresa igual que
-- `clientes` (no ownership-scoped por Corredor): un dependiente es parte
-- del perfil de un cliente que ya es compartido.

create table dependientes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  empresa_id uuid references empresas (id),
  nombre text not null,
  parentesco text check (
    parentesco in ('conyuge', 'hijo', 'hija', 'padre', 'madre', 'hermano', 'hermana', 'otro')
  ),
  fecha_nacimiento date,
  cedula text,
  created_at timestamptz not null default now()
);

create index dependientes_cliente_id_idx on dependientes (cliente_id);
create index dependientes_empresa_id_idx on dependientes (empresa_id);

alter table dependientes enable row level security;

create policy "dependientes_all_own_empresa"
  on dependientes for all
  to authenticated
  using (empresa_id = (select current_user_empresa_id()))
  with check (empresa_id = (select current_user_empresa_id()));

-- Reusa el trigger genérico (0009): solo estampa empresa_id si el
-- cliente lo dejó null.
create trigger dependientes_set_empresa_id
  before insert on dependientes
  for each row execute function set_empresa_id();
