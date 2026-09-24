import { createClient } from "@/lib/supabase/server";
import { listOportunidades } from "@/lib/queries/oportunidades";
import { listClientesOptions, listAseguradorasOptions } from "@/lib/queries/polizas";
import { listProfiles } from "@/lib/queries/clientes";
import { getAccesoModulo } from "@/lib/permisos/server";
import { OportunidadesView } from "@/components/oportunidades/OportunidadesView";

export default async function OportunidadesPage() {
  const supabase = await createClient();
  const [oportunidades, clientes, aseguradoras, propietarios, nivel, nivelPolizas, nivelTareas] =
    await Promise.all([
      listOportunidades(supabase),
      listClientesOptions(supabase),
      listAseguradorasOptions(supabase),
      listProfiles(supabase),
      getAccesoModulo(supabase, "oportunidades"),
      getAccesoModulo(supabase, "polizas"),
      getAccesoModulo(supabase, "tareas"),
    ]);

  return (
    <OportunidadesView
      initialOportunidades={oportunidades}
      clientes={clientes}
      aseguradoras={aseguradoras}
      propietarios={propietarios}
      puedeEditar={nivel === "editar"}
      puedeEditarPolizas={nivelPolizas === "editar"}
      puedeEditarTareas={nivelTareas === "editar"}
    />
  );
}
