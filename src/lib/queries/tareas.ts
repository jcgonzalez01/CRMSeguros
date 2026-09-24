import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TaskStatus } from "@/lib/types/database.types";
import { escapeOrFilterValue } from "./search";

type Client = SupabaseClient<Database>;

export interface TareasFilter {
  search?: string;
  estado?: TaskStatus;
  asignadoA?: string;
}

const TAREA_SELECT =
  "*, cliente:clientes(id, nombre), asignado:profiles!tareas_asignado_a_fkey(id, full_name), oportunidad:oportunidades(id, titulo)";

export async function listTareas(supabase: Client, filter: TareasFilter = {}) {
  let query = supabase
    .from("tareas")
    .select(TAREA_SELECT)
    .order("fecha_limite");

  if (filter.estado) {
    query = query.eq("estado", filter.estado);
  }
  if (filter.asignadoA) {
    query = query.eq("asignado_a", filter.asignadoA);
  }
  if (filter.search) {
    const term = escapeOrFilterValue(filter.search);
    query = query.ilike("titulo", `%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
