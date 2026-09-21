"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const empresaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  adminEmail: z.string().trim().email("Correo inválido"),
  adminFullName: z.string().trim().min(1, "El nombre del administrador es obligatorio"),
});

export type EmpresaInput = z.infer<typeof empresaSchema>;

export async function createEmpresa(input: EmpresaInput) {
  const parsed = empresaSchema.parse(input);

  // provisionar_empresa is SECURITY DEFINER and checks current_user_role()
  // itself against the real caller's session, so this runs through the
  // normal server client (not the admin client) — a non-Manager hitting
  // this action gets rejected by Postgres, not just by the UI.
  const supabase = await createClient();
  const { data: empresaId, error: rpcError } = await supabase.rpc(
    "provisionar_empresa",
    { p_nombre: parsed.nombre }
  );

  if (rpcError) throw new Error(rpcError.message);

  const admin = createAdminClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    parsed.adminEmail,
    {
      data: {
        full_name: parsed.adminFullName,
        role: "Admin",
        empresa_id: empresaId,
      },
      redirectTo: `${origin}/auth/callback?next=/set-password`,
    }
  );

  if (inviteError) throw new Error(inviteError.message);
  revalidatePath("/plataforma");
}

export async function setEmpresaActiva(id: string, activa: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("empresas")
    .update({ activa })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/plataforma");
}
