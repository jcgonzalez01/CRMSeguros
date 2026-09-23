import { createClient } from "@/lib/supabase/server";
import { listPolizasParaTendencias } from "@/lib/queries/reportes";
import { ReportesView } from "@/components/reportes/ReportesView";

const MESES_INICIAL = 12;

export default async function ReportesPage() {
  const supabase = await createClient();

  const now = new Date();
  const desde = new Date(now.getFullYear(), now.getMonth() - (MESES_INICIAL - 1), 1)
    .toISOString()
    .slice(0, 10);

  const polizas = await listPolizasParaTendencias(supabase, desde);

  return <ReportesView initialPolizas={polizas} initialMeses={MESES_INICIAL} />;
}
