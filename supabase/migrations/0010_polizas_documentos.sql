-- Más campos en pólizas + documentos adjuntos (cotizaciones, contratos,
-- etc.), varios por póliza, almacenados en Supabase Storage con el mismo
-- aislamiento por empresa que el resto del esquema.

create type moneda_poliza as enum ('DOP', 'USD');

alter table polizas
  add column suma_asegurada numeric(12, 2),
  add column deducible numeric(12, 2),
  add column moneda moneda_poliza not null default 'DOP',
  add column notas text,
  add column beneficiarios text;

create table poliza_documentos (
  id uuid primary key default gen_random_uuid(),
  poliza_id uuid not null references polizas (id) on delete cascade,
  empresa_id uuid references empresas (id),
  storage_path text not null,
  nombre_archivo text not null,
  content_type text,
  size_bytes bigint,
  uploaded_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index poliza_documentos_poliza_id_idx on poliza_documentos (poliza_id);
create index poliza_documentos_empresa_id_idx on poliza_documentos (empresa_id);

-- Reutiliza el trigger genérico de la fase multi-tenant (0006): solo llena
-- empresa_id si el cliente no lo envía.
create trigger poliza_documentos_set_empresa_id
  before insert on poliza_documentos
  for each row execute function set_empresa_id();

alter table poliza_documentos enable row level security;

create policy "poliza_documentos_all_own_empresa"
  on poliza_documentos for all
  to authenticated
  using (empresa_id = current_user_empresa_id())
  with check (empresa_id = current_user_empresa_id());

-- Bucket privado. Cada archivo vive en <empresa_id>/<poliza_id>/<uuid>-<nombre>,
-- así el primer segmento de la ruta es lo que aísla por empresa en las
-- políticas de storage.objects de abajo.
insert into storage.buckets (id, name, public, file_size_limit)
values ('poliza-documentos', 'poliza-documentos', false, 20971520)
on conflict (id) do nothing;

create policy "poliza_documentos_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'poliza-documentos'
    and (storage.foldername(name))[1] = current_user_empresa_id()::text
  );

create policy "poliza_documentos_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'poliza-documentos'
    and (storage.foldername(name))[1] = current_user_empresa_id()::text
  );

create policy "poliza_documentos_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'poliza-documentos'
    and (storage.foldername(name))[1] = current_user_empresa_id()::text
  );
