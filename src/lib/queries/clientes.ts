import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { escapeOrFilterValue } from "./search";

type Client = SupabaseClient<Database>;

export interface ClientesFilter {
  search?: string;
  propietarioId?: string;
}

const CLIENTE_SELECT = "*, propietario:profiles!clientes_propietario_id_fkey(id, full_name)";

export async function listClientes(supabase: Client, filter: ClientesFilter = {}) {
  let query = supabase.from("clientes").select(CLIENTE_SELECT).order("nombre");

  if (filter.propietarioId) {
    query = query.eq("propietario_id", filter.propietarioId);
  }

  if (filter.search) {
    const term = escapeOrFilterValue(filter.search);
    query = query.or(
      `nombre.ilike.%${term}%,correo.ilike.%${term}%,telefono.ilike.%${term}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCliente(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from("clientes")
    .select(CLIENTE_SELECT)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getClienteRelated(supabase: Client, clienteId: string) {
  const [polizas, oportunidades, tareas] = await Promise.all([
    supabase
      .from("polizas")
      .select("*, aseguradora:aseguradoras(id, nombre)")
      .eq("cliente_id", clienteId)
      .order("fecha_vencimiento"),
    supabase
      .from("oportunidades")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false }),
    supabase
      .from("tareas")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("fecha_limite"),
  ]);

  if (polizas.error) throw polizas.error;
  if (oportunidades.error) throw oportunidades.error;
  if (tareas.error) throw tareas.error;

  return {
    polizas: polizas.data,
    oportunidades: oportunidades.data,
    tareas: tareas.data,
  };
}

export async function listProfiles(supabase: Client) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name");

  if (error) throw error;
  return data;
}
