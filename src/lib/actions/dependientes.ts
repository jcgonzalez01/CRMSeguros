"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { omitEmpresaId } from "@/lib/supabase/insert-helpers";
import { assertPuedeEditar } from "@/lib/permisos/server";
import type { Database } from "@/lib/types/database.types";

const dependienteSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  parentesco: z
    .enum(["conyuge", "hijo", "hija", "padre", "madre", "hermano", "hermana", "otro"])
    .optional()
    .or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  cedula: z.string().trim().optional().or(z.literal("")),
});

export type DependienteInput = z.infer<typeof dependienteSchema>;

function toValues(parsed: DependienteInput) {
  return {
    nombre: parsed.nombre,
    parentesco: parsed.parentesco || null,
    fecha_nacimiento: parsed.fecha_nacimiento || null,
    cedula: parsed.cedula || null,
  };
}

export async function createDependiente(clienteId: string, input: DependienteInput) {
  const parsed = dependienteSchema.parse(input);
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "clientes");

  const { error } = await supabase.from("dependientes").insert(
    omitEmpresaId<Database["public"]["Tables"]["dependientes"]["Insert"]>({
      cliente_id: clienteId,
      ...toValues(parsed),
    })
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clienteId}`);
}

export async function updateDependiente(
  id: string,
  clienteId: string,
  input: DependienteInput
) {
  const parsed = dependienteSchema.parse(input);
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "clientes");

  const { error } = await supabase
    .from("dependientes")
    .update(toValues(parsed))
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clienteId}`);
}

export async function deleteDependiente(id: string, clienteId: string) {
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "clientes");
  const { error } = await supabase.from("dependientes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clienteId}`);
}
