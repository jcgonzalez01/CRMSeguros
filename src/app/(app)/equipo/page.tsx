import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listEquipoConEstado } from "@/lib/queries/equipo";
import { listPermisosModulo } from "@/lib/queries/permisos";
import { EquipoView } from "@/components/equipo/EquipoView";

export default async function EquipoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [miembros, permisos] = await Promise.all([
    listEquipoConEstado(supabase, createAdminClient()),
    listPermisosModulo(supabase),
  ]);

  return (
    <EquipoView miembros={miembros} currentUserId={user!.id} permisos={permisos} />
  );
}
