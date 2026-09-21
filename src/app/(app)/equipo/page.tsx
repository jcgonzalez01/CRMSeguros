import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listEquipoConEstado } from "@/lib/queries/equipo";
import { EquipoView } from "@/components/equipo/EquipoView";

export default async function EquipoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const miembros = await listEquipoConEstado(supabase, createAdminClient());

  return <EquipoView miembros={miembros} currentUserId={user!.id} />;
}
