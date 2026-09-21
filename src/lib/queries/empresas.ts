import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export async function listEmpresas(supabase: Client) {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .order("nombre");

  if (error) throw error;
  return data;
}
