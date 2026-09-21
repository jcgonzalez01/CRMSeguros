"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { omitEmpresaId } from "@/lib/supabase/insert-helpers";
import type { Database } from "@/lib/types/database.types";

const polizaSchema = z.object({
  cliente_id: z.string().uuid("Selecciona un cliente"),
  aseguradora_id: z.string().uuid("Selecciona una aseguradora"),
  producto: z.string().trim().min(1, "El producto es obligatorio"),
  numero_poliza: z.string().trim().min(1, "El número de póliza es obligatorio"),
  fecha_emision: z.string().min(1, "La fecha de emisión es obligatoria"),
  fecha_vencimiento: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  plan_pago: z.enum(["unico", "mensual", "trimestral", "semestral", "anual"]),
  estado: z.enum(["activa", "vencida", "cancelada"]),
  propietario_id: z.string().uuid().optional().or(z.literal("")),
});

export type PolizaInput = z.infer<typeof polizaSchema>;

function toInsertValues(parsed: PolizaInput) {
  return {
    cliente_id: parsed.cliente_id,
    aseguradora_id: parsed.aseguradora_id,
    producto: parsed.producto,
    numero_poliza: parsed.numero_poliza,
    fecha_emision: parsed.fecha_emision,
    fecha_vencimiento: parsed.fecha_vencimiento,
    monto: parsed.monto,
    plan_pago: parsed.plan_pago,
    estado: parsed.estado,
    propietario_id: parsed.propietario_id || null,
  };
}

export async function createPoliza(input: PolizaInput) {
  const parsed = polizaSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase.from("polizas").insert(
    omitEmpresaId<Database["public"]["Tables"]["polizas"]["Insert"]>(
      toInsertValues(parsed)
    )
  );

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una póliza con ese número para esta aseguradora.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/polizas");
  revalidatePath("/aseguradoras");
  revalidatePath(`/clientes/${parsed.cliente_id}`);
}

export async function updatePoliza(id: string, input: PolizaInput) {
  const parsed = polizaSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("polizas")
    .update(toInsertValues(parsed))
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una póliza con ese número para esta aseguradora.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/polizas");
  revalidatePath("/aseguradoras");
  revalidatePath(`/clientes/${parsed.cliente_id}`);
}

export async function deletePoliza(id: string, clienteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("polizas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/polizas");
  revalidatePath("/aseguradoras");
  revalidatePath(`/clientes/${clienteId}`);
}
