import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

// `profiles` (via the regular client) is already scoped to the caller's
// own empresa by RLS. auth.users' banned_until isn't in `profiles`, so it
// needs the admin client — but listUsers() returns every user in the
// project, so it's cross-referenced against the RLS-scoped profile list
// rather than trusted on its own.
export async function listEquipoConEstado(supabase: Client, admin: Client) {
  const { data: miembros, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at, role")
    .order("full_name");
  if (error) throw error;

  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (authError) throw authError;

  const authById = new Map(authData.users.map((u) => [u.id, u]));

  return miembros.map((m) => {
    const authUser = authById.get(m.id);
    const bloqueado = Boolean(
      authUser?.banned_until && new Date(authUser.banned_until) > new Date()
    );
    return { ...m, bloqueado };
  });
}
