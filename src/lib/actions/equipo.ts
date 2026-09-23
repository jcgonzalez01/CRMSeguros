"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

const inviteSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  fullName: z.string().trim().min(1, "El nombre es obligatorio"),
  role: z.enum(["Admin", "Gerente", "Corredor"]),
});

export type InviteInput = z.infer<typeof inviteSchema>;

async function getCallerContext(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("empresa_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.empresa_id) {
    throw new Error("No se pudo determinar la empresa del usuario actual.");
  }
  return { userId: user.id, empresaId: profile.empresa_id, role: profile.role };
}

// The admin client bypasses RLS entirely, so every action here must
// independently confirm the target user belongs to the caller's own
// empresa before touching anything — never trust a userId from the client
// alone (see MULTI-EMPRESA-Y-ROLES.md §2.1/§2.2).
async function getTargetProfileOrThrow(
  admin: SupabaseClient<Database>,
  empresaId: string,
  targetUserId: string
) {
  const { data: target } = await admin
    .from("profiles")
    .select("empresa_id, role")
    .eq("id", targetUserId)
    .single();

  if (!target || target.empresa_id !== empresaId) {
    throw new Error("No autorizado.");
  }
  return target;
}

// Solo Admin gestiona el equipo, así que el único bloqueo real es
// quedarse sin ningún Admin — perder al último Gerente o Corredor no
// deja a la empresa sin quien la administre.
async function assertNoUltimoAdmin(
  admin: SupabaseClient<Database>,
  empresaId: string,
  targetUserId: string
) {
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId)
    .eq("role", "Admin")
    .neq("id", targetUserId);

  if ((count ?? 0) === 0) {
    throw new Error(
      "No puedes eliminar, bloquear ni cambiar el rol del último Admin de la empresa."
    );
  }
}

export async function inviteTeamMember(input: InviteInput) {
  const parsed = inviteSchema.parse(input);

  const supabase = await createClient();
  const { empresaId, role: callerRole } = await getCallerContext(supabase);

  if (callerRole !== "Admin") {
    throw new Error("Solo un Admin puede invitar miembros.");
  }

  const admin = createAdminClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.email, {
    data: {
      full_name: parsed.fullName,
      role: parsed.role,
      empresa_id: empresaId,
    },
    redirectTo: `${origin}/auth/callback?next=/set-password`,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/equipo");
}

export async function resetTeamMemberPassword(userId: string) {
  const supabase = await createClient();
  const { empresaId } = await getCallerContext(supabase);

  const admin = createAdminClient();
  await getTargetProfileOrThrow(admin, empresaId, userId);

  const { data: target } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();
  if (!target) throw new Error("Usuario no encontrado.");

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const { error } = await admin.auth.resetPasswordForEmail(target.email, {
    redirectTo: `${origin}/auth/callback?next=/set-password`,
  });
  if (error) throw new Error(error.message);
}

export async function setTeamMemberBloqueado(userId: string, bloqueado: boolean) {
  const supabase = await createClient();
  const { userId: callerId, empresaId } = await getCallerContext(supabase);

  if (userId === callerId) {
    throw new Error("No puedes bloquearte a ti mismo.");
  }

  const admin = createAdminClient();
  const target = await getTargetProfileOrThrow(admin, empresaId, userId);
  if (bloqueado && target.role === "Admin") {
    await assertNoUltimoAdmin(admin, empresaId, userId);
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: bloqueado ? "87600h" : "none",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/equipo");
}

export async function deleteTeamMember(userId: string) {
  const supabase = await createClient();
  const { userId: callerId, empresaId } = await getCallerContext(supabase);

  if (userId === callerId) {
    throw new Error("No puedes eliminarte a ti mismo.");
  }

  const admin = createAdminClient();
  const target = await getTargetProfileOrThrow(admin, empresaId, userId);
  if (target.role === "Admin") {
    await assertNoUltimoAdmin(admin, empresaId, userId);
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath("/equipo");
}

const roleUpdateSchema = z.enum(["Admin", "Gerente", "Corredor"]);

export async function setTeamMemberRole(userId: string, role: string) {
  const parsedRole = roleUpdateSchema.parse(role);

  const supabase = await createClient();
  const { userId: callerId, empresaId, role: callerRole } = await getCallerContext(supabase);

  if (callerRole !== "Admin") {
    throw new Error("Solo un Admin puede cambiar roles.");
  }
  if (userId === callerId) {
    throw new Error("No puedes cambiar tu propio rol.");
  }

  const admin = createAdminClient();
  const target = await getTargetProfileOrThrow(admin, empresaId, userId);

  if (target.role === "Admin" && parsedRole !== "Admin") {
    await assertNoUltimoAdmin(admin, empresaId, userId);
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: parsedRole })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/equipo");
}
