"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { omitEmpresaId } from "@/lib/supabase/insert-helpers";
import type { Database } from "@/lib/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "logos-empresa";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

const empresaPerfilSchema = z.object({
  nombre_comercial: z.string().trim().optional().or(z.literal("")),
  rnc: z.string().trim().optional().or(z.literal("")),
  direccion: z.string().trim().optional().or(z.literal("")),
  telefono: z.string().trim().optional().or(z.literal("")),
  correo: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
  sitio_web: z.string().trim().optional().or(z.literal("")),
});

export type EmpresaPerfilInput = z.infer<typeof empresaPerfilSchema>;

export async function guardarEmpresaPerfil(input: EmpresaPerfilInput) {
  const parsed = empresaPerfilSchema.parse(input);
  const supabase = await createClient();

  // Sin chequeo manual de rol: la RLS de empresa_perfil (0020) ya exige
  // Admin de la propia empresa para INSERT/UPDATE — mismo patrón que
  // guardarPermisoModulo. No incluye logo_path: el upsert de supabase-js
  // solo pisa las columnas presentes en el payload, así que esto nunca
  // borra el logo ya guardado.
  const { error } = await supabase.from("empresa_perfil").upsert(
    omitEmpresaId<Database["public"]["Tables"]["empresa_perfil"]["Insert"]>({
      nombre_comercial: parsed.nombre_comercial || null,
      rnc: parsed.rnc || null,
      direccion: parsed.direccion || null,
      telefono: parsed.telefono || null,
      correo: parsed.correo || null,
      sitio_web: parsed.sitio_web || null,
      updated_at: new Date().toISOString(),
    }),
    { onConflict: "empresa_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
}

async function getCurrentEmpresaId(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("empresa_id")
    .eq("id", user!.id)
    .single();

  if (!profile?.empresa_id) {
    throw new Error("No se pudo determinar la empresa del usuario actual.");
  }
  return profile.empresa_id;
}

export async function subirLogoEmpresa(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo.");
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("El logo debe ser PNG, JPEG o WebP.");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("El logo no puede superar 2MB.");
  }

  const supabase = await createClient();
  const empresaId = await getCurrentEmpresaId(supabase);

  // Ruta fija por empresa (un único logo, se sobrescribe con upsert): así
  // no quedan archivos huérfanos acumulándose en el bucket.
  const path = `${empresaId}/logo`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { error: updateError } = await supabase.from("empresa_perfil").upsert(
    omitEmpresaId<Database["public"]["Tables"]["empresa_perfil"]["Insert"]>({
      logo_path: path,
      updated_at: new Date().toISOString(),
    }),
    { onConflict: "empresa_id" }
  );

  if (updateError) {
    // No dejar el objeto huérfano si falla la fila de metadata.
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(updateError.message);
  }

  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
}

export async function eliminarLogoEmpresa() {
  const supabase = await createClient();
  const empresaId = await getCurrentEmpresaId(supabase);
  const path = `${empresaId}/logo`;

  const { error: removeError } = await supabase.storage.from(BUCKET).remove([path]);
  if (removeError) throw new Error(removeError.message);

  const { error: updateError } = await supabase
    .from("empresa_perfil")
    .update({ logo_path: null, updated_at: new Date().toISOString() })
    .eq("empresa_id", empresaId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
}
