import { createClient } from "@/lib/supabase/server";
import {
  listPolizas,
  listClientesOptions,
  listAseguradorasOptions,
} from "@/lib/queries/polizas";
import { listProfiles } from "@/lib/queries/clientes";
import { getAccesoModulo } from "@/lib/permisos/server";
import { PolizasView } from "@/components/polizas/PolizasView";

export default async function PolizasPage() {
  const supabase = await createClient();
  const [polizas, clientes, aseguradoras, propietarios, nivel] = await Promise.all([
    listPolizas(supabase),
    listClientesOptions(supabase),
    listAseguradorasOptions(supabase),
    listProfiles(supabase),
    getAccesoModulo(supabase, "polizas"),
  ]);

  return (
    <PolizasView
      initialPolizas={polizas}
      clientes={clientes}
      aseguradoras={aseguradoras}
      propietarios={propietarios}
      puedeEditar={nivel === "editar"}
    />
  );
}
