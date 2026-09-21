import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, OpportunityStatus } from "@/lib/types/database.types";
import { escapeOrFilterValue } from "./search";

type Client = SupabaseClient<Database>;

export interface OportunidadesFilter {
  search?: string;
  estado?: OpportunityStatus;
}

const OPORTUNIDAD_SELECT =
  "*, cliente:clientes(id, nombre), propietario:profiles!oportunidades_propietario_id_fkey(id, full_name)";

export async function listOportunidades(
  supabase: Client,
  filter: OportunidadesFilter = {}
) {
  let query = supabase
    .from("oportunidades")
    .select(OPORTUNIDAD_SELECT)
    .order("created_at", { ascending: false });

  if (filter.estado) {
    query = query.eq("estado", filter.estado);
  }
  if (filter.search) {
    const term = escapeOrFilterValue(filter.search);
    query = query.ilike("titulo", `%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getTotalesOportunidades(supabase: Client) {
  const { data, error } = await supabase
    .from("v_totales_oportunidades")
    .select("*");
  if (error) throw error;
  return data;
}
