import { createClient } from "@/lib/supabase/server";
import { listClientes, listProfiles } from "@/lib/queries/clientes";
import { ClientesView } from "@/components/clientes/ClientesView";

export default async function ClientesPage() {
  const supabase = await createClient();
  const [clientes, profiles] = await Promise.all([
    listClientes(supabase),
    listProfiles(supabase),
  ]);

  return <ClientesView initialClientes={clientes} profiles={profiles} />;
}
