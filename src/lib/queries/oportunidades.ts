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

// Excluye 'perdida': no tiene sentido vincular una póliza o tarea nueva a
// una oportunidad ya perdida.
export async function listOportunidadesOptions(supabase: Client) {
  const { data, error } = await supabase
    .from("oportunidades")
    .select("id, titulo, cliente_id")
    .neq("estado", "perdida")
    .order("titulo");
  if (error) throw error;
  return data;
}
