import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getPoliza,
  listAseguradorasOptions,
  listClientesOptions,
} from "@/lib/queries/polizas";
import { listProfiles } from "@/lib/queries/clientes";
import { listOportunidadesOptions } from "@/lib/queries/oportunidades";
import { getAccesoModulo } from "@/lib/permisos/server";
import { PolizaDetailView } from "@/components/polizas/PolizaDetailView";

export default async function PolizaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  let poliza;
  try {
    poliza = await getPoliza(supabase, id);
  } catch {
    notFound();
  }

  const [clientes, aseguradoras, propietarios, oportunidades, nivel] = await Promise.all([
    listClientesOptions(supabase),
    listAseguradorasOptions(supabase),
    listProfiles(supabase),
    listOportunidadesOptions(supabase),
    getAccesoModulo(supabase, "polizas"),
  ]);

  return (
    <PolizaDetailView
      poliza={poliza}
      clientes={clientes}
      aseguradoras={aseguradoras}
      propietarios={propietarios}
      oportunidades={oportunidades}
      puedeEditar={nivel === "editar"}
    />
  );
}
