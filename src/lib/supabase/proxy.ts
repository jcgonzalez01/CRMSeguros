import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth"];

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
  }

  return supabaseResponse;
}
