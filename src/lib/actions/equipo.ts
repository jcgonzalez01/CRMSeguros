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
});

export type InviteInput = z.infer<typeof inviteSchema>;

async function getCallerContext(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("empresa_id")
    .eq("id", user.id)
    .single();

  if (!profile?.empresa_id) {
    throw new Error("No se pudo determinar la empresa del usuario actual.");
  }
  return { userId: user.id, empresaId: profile.empresa_id };
}

// The admin client bypasses RLS entirely, so every action here must
// independently confirm the target user belongs to the caller's own
// empresa before touching anything — never trust a userId from the client
// alone (see MULTI-EMPRESA-Y-ROLES.md §2.1/§2.2).
async function assertMismaEmpresa(
  admin: SupabaseClient<Database>,
  empresaId: string,
  targetUserId: string
) {
  const { data: target } = await admin
    .from("profiles")
    .select("empresa_id")
    .eq("id", targetUserId)
    .single();

  if (!target || target.empresa_id !== empresaId) {
    throw new Error("No autorizado.");
  }
}

async function assertNoUltimoMiembro(
  admin: SupabaseClient<Database>,
  empresaId: string
) {
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId);

  if ((count ?? 0) <= 1) {
    throw new Error("No puedes eliminar ni bloquear al último miembro de la empresa.");
  }
}

export async function inviteTeamMember(input: InviteInput) {
  const parsed = inviteSchema.parse(input);

  // The new member joins whoever is inviting them's own empresa, as Admin
  // (the only company-scoped role — see MULTI-EMPRESA-Y-ROLES.md).
  const supabase = await createClient();
  const { empresaId } = await getCallerContext(supabase);

  const admin = createAdminClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.email, {
    data: {
      full_name: parsed.fullName,
      role: "Admin",
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
  await assertMismaEmpresa(admin, empresaId, userId);

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
  await assertMismaEmpresa(admin, empresaId, userId);
  if (bloqueado) await assertNoUltimoMiembro(admin, empresaId);

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
  await assertMismaEmpresa(admin, empresaId, userId);
  await assertNoUltimoMiembro(admin, empresaId);

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath("/equipo");
}
