import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listEquipoConEstado } from "@/lib/queries/equipo";
import { listPermisosModulo } from "@/lib/queries/permisos";
import { getEmpresaPerfil, getEmpresaLogoUrl } from "@/lib/queries/empresa";
import { ConfiguracionView } from "@/components/equipo/ConfiguracionView";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [miembros, permisos, perfil] = await Promise.all([
    listEquipoConEstado(supabase, createAdminClient()),
    listPermisosModulo(supabase),
    getEmpresaPerfil(supabase),
  ]);

  const logoUrl = getEmpresaLogoUrl(supabase, perfil?.logo_path ?? null);

  return (
    <ConfiguracionView
      miembros={miembros}
      currentUserId={user!.id}
      permisos={permisos}
      perfil={perfil}
      logoUrl={logoUrl}
    />
  );
}
