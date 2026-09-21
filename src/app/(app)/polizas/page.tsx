import { createClient } from "@/lib/supabase/server";
import {
  listPolizas,
  listClientesOptions,
  listAseguradorasOptions,
} from "@/lib/queries/polizas";
import { listProfiles } from "@/lib/queries/clientes";
import { PolizasView } from "@/components/polizas/PolizasView";

export default async function PolizasPage() {
  const supabase = await createClient();
  const [polizas, clientes, aseguradoras, propietarios] = await Promise.all([
    listPolizas(supabase),
    listClientesOptions(supabase),
    listAseguradorasOptions(supabase),
    listProfiles(supabase),
  ]);

  return (
    <PolizasView
      initialPolizas={polizas}
      clientes={clientes}
      aseguradoras={aseguradoras}
      propietarios={propietarios}
    />
  );
}
