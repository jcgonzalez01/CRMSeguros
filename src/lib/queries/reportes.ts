import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

// One row per month, already aggregated in Postgres (reporte_mensual,
// see migration 0015) — no raw rows fetched, no client-side grouping.
export async function getReporteMensual(supabase: Client, meses: number) {
  const { data, error } = await supabase.rpc("reporte_mensual", { meses });
  if (error) throw error;
  return data;
}
