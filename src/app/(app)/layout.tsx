import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaLogoUrl } from "@/lib/queries/empresa";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, empresa:empresas(nombre, activa)")
    .eq("id", user.id)
    .single();

  const { data: permisos } = await supabase
    .from("permisos_modulo")
    .select("role, modulo, nivel");

  // Vacío para Manager (sin empresa_id, la RLS de empresa_perfil no
  // matchea ninguna fila) — cae naturalmente al fallback genérico.
  const { data: perfil } = await supabase
    .from("empresa_perfil")
    .select("nombre_comercial, logo_path")
    .maybeSingle();

  const logoUrl = getEmpresaLogoUrl(supabase, perfil?.logo_path ?? null);

  const displayName = profile?.full_name ?? user.email ?? "";

  const isAdmin = profile?.role === "Admin";
  const empresaSuspendida = isAdmin && profile?.empresa?.activa === false;

  return (
    <div className="flex flex-1 flex-col bg-canvas md:flex-row">
      <Sidebar
        role={profile?.role ?? "Admin"}
        permisos={permisos ?? []}
        logoUrl={logoUrl}
        nombreComercial={perfil?.nombre_comercial}
        displayName={displayName}
        empresaNombre={isAdmin ? profile?.empresa?.nombre : null}
      />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">
        {empresaSuspendida ? (
          <div className="mx-auto max-w-md rounded-[14px] border border-warning-200 bg-warning-50 p-6 text-center">
            <h1 className="text-lg font-semibold text-warning-700">
              Cuenta suspendida
            </h1>
            <p className="mt-2 text-sm text-warning-700">
              Tu empresa está desactivada. Contacta al administrador de la
              plataforma para reactivarla.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
