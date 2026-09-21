import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export interface ComisionesFilter {
  desde?: string;
  hasta?: string;
  propietarioId?: string;
}

const POLIZA_COMISION_SELECT =
  "*, cliente:clientes(id, nombre), aseguradora:aseguradoras(id, nombre), propietario:profiles!polizas_propietario_id_fkey(id, full_name)";

// Every póliza issued in the filtered range, commission set or not — a
// policy missing a commission still shows up (as "—") so gaps are visible
// instead of silently hidden.
export async function listPolizasComision(supabase: Client, filter: ComisionesFilter = {}) {
  let query = supabase
    .from("polizas")
    .select(POLIZA_COMISION_SELECT)
    .order("fecha_emision", { ascending: false });

  if (filter.desde) query = query.gte("fecha_emision", filter.desde);
  if (filter.hasta) query = query.lte("fecha_emision", filter.hasta);
  if (filter.propietarioId) query = query.eq("propietario_id", filter.propietarioId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
