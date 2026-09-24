import { createClient } from "@/lib/supabase/server";
import { listTareas } from "@/lib/queries/tareas";
import { listClientesOptions } from "@/lib/queries/polizas";
import { listProfiles } from "@/lib/queries/clientes";
import { listOportunidadesOptions } from "@/lib/queries/oportunidades";
import { getAccesoModulo } from "@/lib/permisos/server";
import { TareasView } from "@/components/tareas/TareasView";

export default async function TareasPage() {
  const supabase = await createClient();
  const [tareas, clientes, miembros, oportunidades, nivel] = await Promise.all([
    listTareas(supabase),
    listClientesOptions(supabase),
    listProfiles(supabase),
    listOportunidadesOptions(supabase),
    getAccesoModulo(supabase, "tareas"),
  ]);

  return (
    <TareasView
      initialTareas={tareas}
      clientes={clientes}
      miembros={miembros}
      oportunidades={oportunidades}
      puedeEditar={nivel === "editar"}
    />
  );
}
