import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { escapeOrFilterValue } from "./search";

type Client = SupabaseClient<Database>;

export interface AseguradorasFilter {
  search?: string;
}

export async function listAseguradoras(
  supabase: Client,
  filter: AseguradorasFilter = {}
) {
  let query = supabase.from("aseguradoras").select("*").order("nombre");

  if (filter.search) {
    const term = escapeOrFilterValue(filter.search);
    query = query.ilike("nombre", `%${term}%`);
  }

  const [{ data: aseguradoras, error }, { data: conteos, error: conteoError }] =
    await Promise.all([
      query,
      supabase.from("v_conteo_polizas_por_aseguradora").select("*"),
    ]);

  if (error) throw error;
  if (conteoError) throw conteoError;

  const conteoPorId = new Map(
    (conteos ?? []).map((c) => [c.id, c.polizas_activas])
  );

  return (aseguradoras ?? []).map((a) => ({
    ...a,
    polizas_activas: conteoPorId.get(a.id) ?? 0,
  }));
}
