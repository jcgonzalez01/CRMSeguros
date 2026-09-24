"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { omitEmpresaId } from "@/lib/supabase/insert-helpers";
import { assertPuedeEditar } from "@/lib/permisos/server";
import type { Database } from "@/lib/types/database.types";

const clienteSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  telefono: z.string().trim().optional().or(z.literal("")),
  correo: z
    .string()
    .trim()
    .email("Correo inválido")
    .optional()
    .or(z.literal("")),
  cedula: z.string().trim().optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  direccion: z.string().trim().optional().or(z.literal("")),
  sexo: z.enum(["M", "F"]).optional().or(z.literal("")),
  estado_civil: z
    .enum(["soltero", "casado", "divorciado", "viudo", "union_libre"])
    .optional()
    .or(z.literal("")),
  ocupacion: z.string().trim().optional().or(z.literal("")),
  notas: z.string().trim().optional().or(z.literal("")),
  propietario_id: z.string().uuid().optional().or(z.literal("")),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

export async function createCliente(input: ClienteInput) {
  const parsed = clienteSchema.parse(input);
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "clientes");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("clientes").insert(
    omitEmpresaId<Database["public"]["Tables"]["clientes"]["Insert"]>({
      nombre: parsed.nombre,
      telefono: parsed.telefono || null,
      correo: parsed.correo || null,
      cedula: parsed.cedula || null,
      fecha_nacimiento: parsed.fecha_nacimiento || null,
      direccion: parsed.direccion || null,
      sexo: parsed.sexo || null,
      estado_civil: parsed.estado_civil || null,
      ocupacion: parsed.ocupacion || null,
      notas: parsed.notas || null,
      propietario_id: parsed.propietario_id || null,
      created_by: user?.id ?? null,
    })
  );

  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}

export async function updateCliente(id: string, input: ClienteInput) {
  const parsed = clienteSchema.parse(input);
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "clientes");

  const { error } = await supabase
    .from("clientes")
    .update({
      nombre: parsed.nombre,
      telefono: parsed.telefono || null,
      correo: parsed.correo || null,
      cedula: parsed.cedula || null,
      fecha_nacimiento: parsed.fecha_nacimiento || null,
      direccion: parsed.direccion || null,
      sexo: parsed.sexo || null,
      estado_civil: parsed.estado_civil || null,
      ocupacion: parsed.ocupacion || null,
      notas: parsed.notas || null,
      propietario_id: parsed.propietario_id || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
}

export async function deleteCliente(id: string) {
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "clientes");
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}
