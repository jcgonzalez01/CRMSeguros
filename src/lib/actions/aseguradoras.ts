"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { omitEmpresaId } from "@/lib/supabase/insert-helpers";
import { assertPuedeEditar } from "@/lib/permisos/server";
import type { Database } from "@/lib/types/database.types";

const aseguradoraSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  notas: z.string().trim().optional().or(z.literal("")),
});

export type AseguradoraInput = z.infer<typeof aseguradoraSchema>;

export async function createAseguradora(input: AseguradoraInput) {
  const parsed = aseguradoraSchema.parse(input);
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "aseguradoras");

  const { error } = await supabase.from("aseguradoras").insert(
    omitEmpresaId<Database["public"]["Tables"]["aseguradoras"]["Insert"]>({
      nombre: parsed.nombre,
      notas: parsed.notas || null,
    })
  );

  if (error) throw new Error(error.message);
  revalidatePath("/aseguradoras");
}

export async function updateAseguradora(id: string, input: AseguradoraInput) {
  const parsed = aseguradoraSchema.parse(input);
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "aseguradoras");

  const { error } = await supabase
    .from("aseguradoras")
    .update({ nombre: parsed.nombre, notas: parsed.notas || null })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/aseguradoras");
}

export async function deleteAseguradora(id: string) {
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "aseguradoras");
  const { error } = await supabase.from("aseguradoras").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: tiene pólizas asociadas. Elimina o reasigna esas pólizas primero."
      );
    }
    throw new Error(error.message);
  }
  revalidatePath("/aseguradoras");
}
