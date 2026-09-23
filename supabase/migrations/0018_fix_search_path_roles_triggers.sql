-- Corrige un bug de 0017: las funciones trigger llevan `set search_path = ''`
-- (correcto, mismo patrón que set_empresa_id en 0006), pero llamaban a
-- current_user_role() sin calificar el esquema, lo que falla en runtime
-- ("function current_user_role() does not exist") porque con search_path
-- vacío solo resuelven identificadores completamente calificados.
-- Detectado en vivo al probar la funcionalidad con un script adversarial.

create or replace function set_propietario_id_corredor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if public.current_user_role() = 'Corredor' and new.propietario_id is null then
    new.propietario_id = auth.uid();
  end if;
  return new;
end;
$$;

create or replace function set_asignado_a_corredor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if public.current_user_role() = 'Corredor' and new.asignado_a is null then
    new.asignado_a = auth.uid();
  end if;
  return new;
end;
$$;
