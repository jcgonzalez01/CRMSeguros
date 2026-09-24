import { createClient } from "@/lib/supabase/server";
import {
  listPolizas,
  listClientesOptions,
  listAseguradorasOptions,
} from "@/lib/queries/polizas";
import { listProfiles } from "@/lib/queries/clientes";
import { listOportunidadesOptions } from "@/lib/queries/oportunidades";
import { getAccesoModulo } from "@/lib/permisos/server";
import { PolizasView } from "@/components/polizas/PolizasView";

export default async function PolizasPage() {
  const supabase = await createClient();
  const [polizas, clientes, aseguradoras, propietarios, oportunidades, nivel] = await Promise.all([
    listPolizas(supabase),
    listClientesOptions(supabase),
    listAseguradorasOptions(supabase),
    listProfiles(supabase),
    listOportunidadesOptions(supabase),
    getAccesoModulo(supabase, "polizas"),
  ]);

  return (
    <PolizasView
      initialPolizas={polizas}
      clientes={clientes}
      aseguradoras={aseguradoras}
      propietarios={propietarios}
      oportunidades={oportunidades}
      puedeEditar={nivel === "editar"}
    />
  );
}
