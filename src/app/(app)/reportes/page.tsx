import { createClient } from "@/lib/supabase/server";
import { getReporteMensual } from "@/lib/queries/reportes";
import { listPolizasComision } from "@/lib/queries/comisiones";
import { listProfiles } from "@/lib/queries/clientes";
import { ReportesView } from "@/components/reportes/ReportesView";

const MESES_INICIAL = 12;

export default async function ReportesPage() {
  const supabase = await createClient();

  const [reporte, polizasComision, propietarios] = await Promise.all([
    getReporteMensual(supabase, MESES_INICIAL),
    listPolizasComision(supabase),
    listProfiles(supabase),
  ]);

  return (
    <ReportesView
      initialReporte={reporte}
      initialMeses={MESES_INICIAL}
      initialPolizasComision={polizasComision}
      propietarios={propietarios}
    />
  );
}
