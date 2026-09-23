import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth"];

// Mapeo ruta -> módulo, para el bloqueo de navegación de Gerente/Corredor
// según permisos_modulo. dashboard y equipo no participan (dashboard es
// el fallback de todo redirect de acceso denegado; equipo ya es Admin-only
// fijo, sin relación con esta matriz).
const MODULE_ROUTES: [prefix: string, modulo: string][] = [
  ["/clientes", "clientes"],
  ["/polizas", "polizas"],
  ["/aseguradoras", "aseguradoras"],
  ["/oportunidades", "oportunidades"],
  ["/tareas", "tareas"],
  ["/reportes", "reportes"],
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() verifies the JWT (locally when the project uses asymmetric
  // signing keys) and refreshes it when close to expiry — this is what
  // keeps the session alive across server-rendered requests.
  const { data } = await supabase.auth.getClaims();
  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!data?.claims && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Route by role: Manager is platform-only (manages empresas, never sees
  // a tenant's business data). Admin, Gerente and Corredor are all scoped
  // to their own empresa and never see the platform area; only Admin
  // manages the team (/equipo).
  if (data?.claims && !isPublicPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.claims.sub as string)
      .single();

    const isPlatformPath = request.nextUrl.pathname.startsWith("/plataforma");
    const isEquipoPath = request.nextUrl.pathname.startsWith("/equipo");

    if (profile?.role === "Manager" && !isPlatformPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/plataforma";
      return NextResponse.redirect(url);
    }
    if (profile?.role !== "Manager" && isPlatformPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    if (profile?.role !== "Admin" && isEquipoPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Matriz de permisos por módulo: solo aplica a Gerente/Corredor (Admin
    // siempre pasa, Manager nunca llega aquí por los redirects de arriba).
    if (profile?.role === "Gerente" || profile?.role === "Corredor") {
      const match = MODULE_ROUTES.find(([prefix]) =>
        request.nextUrl.pathname.startsWith(prefix)
      );

      if (match) {
        const [, modulo] = match;
        const { data: permiso } = await supabase
          .from("permisos_modulo")
          .select("nivel")
          .eq("role", profile.role)
          .eq("modulo", modulo)
          .maybeSingle();

        if ((permiso?.nivel ?? "bloqueado") === "bloqueado") {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse;
}
