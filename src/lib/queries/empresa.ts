import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type EmpresaPerfil = Database["public"]["Tables"]["empresa_perfil"]["Row"];

export async function getEmpresaPerfil(supabase: Client): Promise<EmpresaPerfil | null> {
  const { data, error } = await supabase.from("empresa_perfil").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

// getPublicUrl es síncrono (no hace red): construye la URL a partir del
// bucket público, no valida que el objeto exista.
export function getEmpresaLogoUrl(supabase: Client, logoPath: string | null) {
  if (!logoPath) return null;
  const { data } = supabase.storage.from("logos-empresa").getPublicUrl(logoPath);
  return data.publicUrl;
}
