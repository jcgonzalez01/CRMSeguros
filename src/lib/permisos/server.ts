import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export const MODULOS = [
  "clientes",
  "polizas",
  "aseguradoras",
  "oportunidades",
  "tareas",
  "reportes",
] as const;

export type ModuloKey = (typeof MODULOS)[number];

export type NivelPermiso = "bloqueado" | "ver" | "editar";

// Admin siempre tiene acceso total, Manager nunca llega a rutas de
// negocio — ninguno de los dos consulta permisos_modulo. Gerente/Corredor
// resuelven su nivel real: sin fila para (role, modulo) = 'bloqueado'
// (default restrictivo).
export async function getAccesoModulo(
  supabase: Client,
  modulo: ModuloKey
): Promise<NivelPermiso> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "bloqueado";

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileError) throw profileError;

  if (profile.role === "Admin" || profile.role === "Manager") return "editar";

  const { data: permiso, error: permisoError } = await supabase
    .from("permisos_modulo")
    .select("nivel")
    .eq("role", profile.role)
    .eq("modulo", modulo)
    .maybeSingle();
  if (permisoError) throw permisoError;

  return (permiso?.nivel as NivelPermiso | undefined) ?? "bloqueado";
}

export async function assertPuedeEditar(supabase: Client, modulo: ModuloKey) {
  const nivel = await getAccesoModulo(supabase, modulo);
  if (nivel !== "editar") {
    throw new Error(`No tienes permiso para editar en el módulo "${modulo}".`);
  }
}
