import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PolicyStatus } from "@/lib/types/database.types";
import { escapeOrFilterValue } from "./search";

type Client = SupabaseClient<Database>;

export interface PolizasFilter {
  search?: string;
  estado?: PolicyStatus;
  aseguradoraId?: string;
}

const POLIZA_SELECT =
  "*, cliente:clientes(id, nombre), aseguradora:aseguradoras(id, nombre), propietario:profiles!polizas_propietario_id_fkey(id, full_name)";

export async function listPolizas(supabase: Client, filter: PolizasFilter = {}) {
  let query = supabase
    .from("polizas")
    .select(POLIZA_SELECT)
    .order("fecha_vencimiento");

  if (filter.estado) {
    query = query.eq("estado", filter.estado);
  }
  if (filter.aseguradoraId) {
    query = query.eq("aseguradora_id", filter.aseguradoraId);
  }
  if (filter.search) {
    const term = escapeOrFilterValue(filter.search);
    query = query.or(`producto.ilike.%${term}%,numero_poliza.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function listClientesOptions(supabase: Client) {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre")
    .order("nombre");
  if (error) throw error;
  return data;
}

export async function listAseguradorasOptions(supabase: Client) {
  const { data, error } = await supabase
    .from("aseguradoras")
    .select("id, nombre")
    .order("nombre");
  if (error) throw error;
  return data;
}
