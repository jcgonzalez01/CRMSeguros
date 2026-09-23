"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { omitEmpresaId } from "@/lib/supabase/insert-helpers";
import { assertPuedeEditar } from "@/lib/permisos/server";
import type { Database } from "@/lib/types/database.types";

const tareaSchema = z.object({
  titulo: z.string().trim().min(1, "El título es obligatorio"),
  descripcion: z.string().trim().optional().or(z.literal("")),
  cliente_id: z.string().uuid().optional().or(z.literal("")),
  asignado_a: z.string().uuid().optional().or(z.literal("")),
  fecha_limite: z.string().min(1, "La fecha límite es obligatoria"),
  estado: z.enum(["pendiente", "completada"]),
});

export type TareaInput = z.infer<typeof tareaSchema>;

function toValues(parsed: TareaInput) {
  return {
    titulo: parsed.titulo,
    descripcion: parsed.descripcion || null,
    cliente_id: parsed.cliente_id || null,
    asignado_a: parsed.asignado_a || null,
    fecha_limite: parsed.fecha_limite,
    estado: parsed.estado,
  };
}

export async function createTarea(input: TareaInput) {
  const parsed = tareaSchema.parse(input);
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "tareas");

  const { error } = await supabase.from("tareas").insert(
    omitEmpresaId<Database["public"]["Tables"]["tareas"]["Insert"]>(
      toValues(parsed)
    )
  );

  if (error) throw new Error(error.message);
  revalidatePath("/tareas");
  if (parsed.cliente_id) revalidatePath(`/clientes/${parsed.cliente_id}`);
}

export async function updateTarea(id: string, input: TareaInput) {
  const parsed = tareaSchema.parse(input);
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "tareas");

  const { error } = await supabase
    .from("tareas")
    .update(toValues(parsed))
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/tareas");
  if (parsed.cliente_id) revalidatePath(`/clientes/${parsed.cliente_id}`);
}

export async function setTareaEstado(id: string, estado: "pendiente" | "completada") {
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "tareas");
  const { error } = await supabase
    .from("tareas")
    .update({ estado })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/tareas");
}

export async function deleteTarea(id: string, clienteId: string | null) {
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "tareas");
  const { error } = await supabase.from("tareas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tareas");
  if (clienteId) revalidatePath(`/clientes/${clienteId}`);
}
