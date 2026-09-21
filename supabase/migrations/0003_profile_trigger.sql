-- Auto-populate profiles (Equipo) whenever a new auth.users row is created,
-- which happens immediately when a team member is invited via
-- supabase.auth.admin.inviteUserByEmail (not only once they set a password).

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
