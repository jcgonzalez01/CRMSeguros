import { createClient } from "@/lib/supabase/server";
import { listOportunidades } from "@/lib/queries/oportunidades";
import { listClientesOptions } from "@/lib/queries/polizas";
import { listProfiles } from "@/lib/queries/clientes";
import { OportunidadesView } from "@/components/oportunidades/OportunidadesView";

export default async function OportunidadesPage() {
  const supabase = await createClient();
  const [oportunidades, clientes, propietarios] = await Promise.all([
    listOportunidades(supabase),
    listClientesOptions(supabase),
    listProfiles(supabase),
  ]);

  return (
    <OportunidadesView
      initialOportunidades={oportunidades}
      clientes={clientes}
      propietarios={propietarios}
    />
  );
}
