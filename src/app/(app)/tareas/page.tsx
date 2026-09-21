import { createClient } from "@/lib/supabase/server";
import { listTareas } from "@/lib/queries/tareas";
import { listClientesOptions } from "@/lib/queries/polizas";
import { listProfiles } from "@/lib/queries/clientes";
import { TareasView } from "@/components/tareas/TareasView";

export default async function TareasPage() {
  const supabase = await createClient();
  const [tareas, clientes, miembros] = await Promise.all([
    listTareas(supabase),
    listClientesOptions(supabase),
    listProfiles(supabase),
  ]);

  return (
    <TareasView initialTareas={tareas} clientes={clientes} miembros={miembros} />
  );
}
