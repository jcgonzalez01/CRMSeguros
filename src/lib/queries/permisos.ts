import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export async function listPermisosModulo(supabase: Client) {
  const { data, error } = await supabase
    .from("permisos_modulo")
    .select("role, modulo, nivel")
    .order("modulo");
  if (error) throw error;
  return data;
}
