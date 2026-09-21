"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const inviteSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  fullName: z.string().trim().min(1, "El nombre es obligatorio"),
});

export type InviteInput = z.infer<typeof inviteSchema>;

export async function inviteTeamMember(input: InviteInput) {
  const parsed = inviteSchema.parse(input);

  // The new member joins whoever is inviting them's own empresa, as Admin
  // (the only company-scoped role — see MULTI-EMPRESA-Y-ROLES.md).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("empresa_id")
    .eq("id", user!.id)
    .single();

  if (!inviterProfile?.empresa_id) {
    throw new Error("No se pudo determinar la empresa del usuario actual.");
  }

  const admin = createAdminClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.email, {
    data: {
      full_name: parsed.fullName,
      role: "Admin",
      empresa_id: inviterProfile.empresa_id,
    },
    redirectTo: `${origin}/auth/callback?next=/set-password`,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/equipo");
}
