import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { SignOutButton } from "@/components/layout/SignOutButton";

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

  const displayName = profile?.full_name ?? user.email ?? "";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isAdmin = profile?.role === "Admin";
  const empresaSuspendida = isAdmin && profile?.empresa?.activa === false;

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-gray-50">
      <Sidebar role={profile?.role ?? "Admin"} />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="hidden md:flex items-center justify-end gap-3 border-b border-gray-200 bg-white px-6 py-3">
          {isAdmin && profile?.empresa?.nombre && (
            <>
              <span className="text-sm font-medium text-gray-900">
                {profile.empresa.nombre}
              </span>
              <span className="h-5 w-px bg-gray-200" />
            </>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
              {initials || "?"}
            </div>
            <span className="text-sm text-gray-700">{displayName}</span>
          </div>
          <span className="h-5 w-px bg-gray-200" />
          <SignOutButton />
        </header>
        <main className="flex-1 p-4 md:p-6">
          {empresaSuspendida ? (
            <div className="mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
              <h1 className="text-lg font-semibold text-amber-900">
                Cuenta suspendida
              </h1>
              <p className="mt-2 text-sm text-amber-800">
                Tu empresa está desactivada. Contacta al administrador de la
                plataforma para reactivarla.
              </p>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
