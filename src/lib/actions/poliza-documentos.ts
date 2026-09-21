"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { omitEmpresaId } from "@/lib/supabase/insert-helpers";
import type { Database } from "@/lib/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "poliza-documentos";

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

export async function uploadPolizaDocumento(polizaId: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo.");
  }

  const supabase = await createClient();
  const empresaId = await getCurrentEmpresaId(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // First path segment is what storage.objects RLS checks against
  // current_user_empresa_id() — see supabase/migrations/0010_*.
  const path = `${empresaId}/${polizaId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("poliza_documentos").insert(
    omitEmpresaId<Database["public"]["Tables"]["poliza_documentos"]["Insert"]>({
      poliza_id: polizaId,
      storage_path: path,
      nombre_archivo: file.name,
      content_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: user?.id ?? null,
    })
  );

  if (insertError) {
    // Don't leave an orphaned object in Storage if the metadata row fails.
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(insertError.message);
  }

  revalidatePath("/polizas");
}

export async function getPolizaDocumentoUrl(id: string) {
  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("poliza_documentos")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);

  const { data, error: urlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 60);
  if (urlError) throw new Error(urlError.message);

  return data.signedUrl;
}

export async function deletePolizaDocumento(id: string) {
  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("poliza_documentos")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);

  await supabase.storage.from(BUCKET).remove([doc.storage_path]);

  const { error: deleteError } = await supabase
    .from("poliza_documentos")
    .delete()
    .eq("id", id);
  if (deleteError) throw new Error(deleteError.message);

  revalidatePath("/polizas");
}
