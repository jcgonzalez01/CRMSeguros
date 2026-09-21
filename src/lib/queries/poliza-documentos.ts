import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export async function listPolizaDocumentos(supabase: Client, polizaId: string) {
  const { data, error } = await supabase
    .from("poliza_documentos")
    .select("*")
    .eq("poliza_id", polizaId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
