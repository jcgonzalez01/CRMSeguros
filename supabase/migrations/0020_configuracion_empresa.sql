-- Módulo Configuración: (a) datos "white-label" de cada empresa, editables
-- por su Admin (separados de `empresas`, que solo el Manager puede
-- escribir — ver 0008 — para no reabrir esa superficie de seguridad ya
-- probada); (b) logo, en un bucket público porque no es información
-- sensible y así el <img> del sidebar usa una URL pública estable sin
-- signed URLs.

create table empresa_perfil (
  empresa_id uuid primary key references empresas (id) on delete cascade,
  nombre_comercial text,
  rnc text,
  direccion text,
  telefono text,
  correo text,
  sitio_web text,
  logo_path text,
  updated_at timestamptz not null default now()
);

alter table empresa_perfil enable row level security;

-- SELECT: cualquier autenticado de la propia empresa (igual que
-- clientes/aseguradoras: compartido dentro del tenant).
create policy "empresa_perfil_select_own_empresa"
  on empresa_perfil for select
  to authenticated
  using (empresa_id = (select current_user_empresa_id()));

-- INSERT/UPDATE: solo Admin de la propia empresa. Sin policy de DELETE:
-- hoy no hay borrado físico de empresas.
create policy "empresa_perfil_insert_admin"
  on empresa_perfil for insert
  to authenticated
  with check (
    empresa_id = (select current_user_empresa_id())
    and (select current_user_role()) = 'Admin'
  );

create policy "empresa_perfil_update_admin"
  on empresa_perfil for update
  to authenticated
  using (
    empresa_id = (select current_user_empresa_id())
    and (select current_user_role()) = 'Admin'
  )
  with check (
    empresa_id = (select current_user_empresa_id())
    and (select current_user_role()) = 'Admin'
  );

-- Reusa el trigger genérico (0009): solo estampa empresa_id si el cliente
-- lo dejó null — es lo que permite que guardarEmpresaPerfil/
-- subirLogoEmpresa (Admin, cliente RLS-scoped, nunca envían empresa_id)
-- funcionen.
create trigger empresa_perfil_set_empresa_id
  before insert on empresa_perfil
  for each row execute function set_empresa_id();

create function sembrar_perfil_empresa_default(p_empresa uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.empresa_perfil (empresa_id) values (p_empresa)
  on conflict (empresa_id) do nothing;
end;
$$;

-- provisionar_empresa recreada por completo otra vez (create or replace
-- exige el cuerpo íntegro): agrega la tercera llamada a
-- sembrar_perfil_empresa_default, preservando 0006 + 0019 tal cual.
create or replace function provisionar_empresa(p_nombre text)
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
  perform public.sembrar_permisos_default(v_empresa);
  perform public.sembrar_perfil_empresa_default(v_empresa);

  return v_empresa;
end;
$$;

-- Backfill: todas las empresas existentes obtienen su fila vacía de
-- perfil, mismo patrón de 0019.
select public.sembrar_perfil_empresa_default(id) from public.empresas;

-- Storage: bucket público para el logo. Se excluye SVG a propósito: en un
-- bucket público el archivo se sirve inline, y un SVG puede contener
-- <script>, abriendo un vector de XSS servido desde el dominio de Storage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos-empresa',
  'logos-empresa',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- No hace falta policy de SELECT para SERVIR el logo: bucket public=true
-- bypassa RLS por completo en el endpoint GET público. La policy de abajo
-- es para otra cosa: Postgres exige SELECT+UPDATE (además de INSERT) bajo
-- RLS para que un INSERT ... ON CONFLICT DO UPDATE (lo que genera
-- upload(..., {upsert:true})) funcione al reemplazar el logo.
create policy "logos_empresa_storage_select_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'logos-empresa'
    and (storage.foldername(name))[1] = (select current_user_empresa_id())::text
    and (select current_user_role()) = 'Admin'
  );

create policy "logos_empresa_storage_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos-empresa'
    and (storage.foldername(name))[1] = (select current_user_empresa_id())::text
    and (select current_user_role()) = 'Admin'
  );

create policy "logos_empresa_storage_update_admin"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logos-empresa'
    and (storage.foldername(name))[1] = (select current_user_empresa_id())::text
    and (select current_user_role()) = 'Admin'
  )
  with check (
    bucket_id = 'logos-empresa'
    and (storage.foldername(name))[1] = (select current_user_empresa_id())::text
    and (select current_user_role()) = 'Admin'
  );

create policy "logos_empresa_storage_delete_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'logos-empresa'
    and (storage.foldername(name))[1] = (select current_user_empresa_id())::text
    and (select current_user_role()) = 'Admin'
  );
