"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const inviteSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  fullName: z.string().trim().min(1, "El nombre es obligatorio"),
});

export type InviteInput = z.infer<typeof inviteSchema>;

export async function inviteTeamMember(input: InviteInput) {
  const parsed = inviteSchema.parse(input);
  const admin = createAdminClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.email, {
    data: { full_name: parsed.fullName },
    redirectTo: `${origin}/auth/callback?next=/set-password`,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/equipo");
}
