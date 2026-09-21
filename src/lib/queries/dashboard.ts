import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

const POLIZA_DASHBOARD_SELECT = "*, cliente:clientes(id, nombre), aseguradora:aseguradoras(id, nombre)";
const TAREA_DASHBOARD_SELECT = "*, cliente:clientes(id, nombre), asignado:profiles!tareas_asignado_a_fkey(id, full_name)";
const OPORTUNIDAD_DASHBOARD_SELECT = "*, cliente:clientes(id, nombre), propietario:profiles!oportunidades_propietario_id_fkey(id, full_name)";

export async function getDashboardData(supabase: Client) {
  const [
    polizasVencenSemana,
    polizasVencidas,
    tareasSemana,
    tareasAtrasadas,
    oportunidadesSemana,
    resumenFinanciero,
  ] = await Promise.all([
    supabase
      .from("v_polizas_vencen_semana")
      .select(POLIZA_DASHBOARD_SELECT)
      .order("fecha_vencimiento"),
    supabase
      .from("v_polizas_vencidas")
      .select(POLIZA_DASHBOARD_SELECT)
      .order("fecha_vencimiento"),
    supabase
      .from("v_tareas_semana")
      .select(TAREA_DASHBOARD_SELECT)
      .order("fecha_limite"),
    supabase
      .from("v_tareas_atrasadas")
      .select(TAREA_DASHBOARD_SELECT)
      .order("fecha_limite"),
    supabase
      .from("v_oportunidades_semana")
      .select(OPORTUNIDAD_DASHBOARD_SELECT)
      .order("fecha_cierre", { ascending: false }),
    supabase.from("v_resumen_financiero").select("*").single(),
  ]);

  if (polizasVencenSemana.error) throw polizasVencenSemana.error;
  if (polizasVencidas.error) throw polizasVencidas.error;
  if (tareasSemana.error) throw tareasSemana.error;
  if (tareasAtrasadas.error) throw tareasAtrasadas.error;
  if (oportunidadesSemana.error) throw oportunidadesSemana.error;
  if (resumenFinanciero.error) throw resumenFinanciero.error;

  return {
    polizasVencenSemana: polizasVencenSemana.data,
    polizasVencidas: polizasVencidas.data,
    tareasSemana: tareasSemana.data,
    tareasAtrasadas: tareasAtrasadas.data,
    oportunidadesSemana: oportunidadesSemana.data,
    resumenFinanciero: resumenFinanciero.data,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
