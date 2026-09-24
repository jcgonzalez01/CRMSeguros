import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export async function listDependientes(supabase: Client, clienteId: string) {
  const { data, error } = await supabase
    .from("dependientes")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at");
  if (error) throw error;
  return data;
}
