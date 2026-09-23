import { createClient } from "@/lib/supabase/server";
import { listClientes, listProfiles } from "@/lib/queries/clientes";
import { getAccesoModulo } from "@/lib/permisos/server";
import { ClientesView } from "@/components/clientes/ClientesView";

export default async function ClientesPage() {
  const supabase = await createClient();
  const [clientes, profiles, nivel] = await Promise.all([
    listClientes(supabase),
    listProfiles(supabase),
    getAccesoModulo(supabase, "clientes"),
  ]);

  return (
    <ClientesView
      initialClientes={clientes}
      profiles={profiles}
      puedeEditar={nivel === "editar"}
    />
  );
}
