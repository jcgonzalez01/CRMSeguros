import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

// Raw rows for the selected window — aggregated into monthly buckets by
// the caller (ReportesView), not here, so the same fetch can drive both
// the count and premium trend charts without two round trips.
export async function listPolizasParaTendencias(supabase: Client, desde: string) {
  const { data, error } = await supabase
    .from("polizas")
    .select("fecha_emision, monto, moneda")
    .gte("fecha_emision", desde)
    .order("fecha_emision");

  if (error) throw error;
  return data;
}
