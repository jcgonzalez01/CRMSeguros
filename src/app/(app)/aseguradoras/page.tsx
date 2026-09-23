import { createClient } from "@/lib/supabase/server";
import { listAseguradoras } from "@/lib/queries/aseguradoras";
import { getAccesoModulo } from "@/lib/permisos/server";
import { AseguradorasView } from "@/components/aseguradoras/AseguradorasView";

export default async function AseguradorasPage() {
  const supabase = await createClient();
  const [aseguradoras, nivel] = await Promise.all([
    listAseguradoras(supabase),
    getAccesoModulo(supabase, "aseguradoras"),
  ]);

  return (
    <AseguradorasView
      initialAseguradoras={aseguradoras}
      puedeEditar={nivel === "editar"}
    />
  );
}
