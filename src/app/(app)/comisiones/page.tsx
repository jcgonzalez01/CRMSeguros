import { createClient } from "@/lib/supabase/server";
import { listPolizasComision } from "@/lib/queries/comisiones";
import { listProfiles } from "@/lib/queries/clientes";
import { ComisionesView } from "@/components/comisiones/ComisionesView";

export default async function ComisionesPage() {
  const supabase = await createClient();
  const [polizas, propietarios] = await Promise.all([
    listPolizasComision(supabase),
    listProfiles(supabase),
  ]);

  return <ComisionesView initialPolizas={polizas} propietarios={propietarios} />;
}
