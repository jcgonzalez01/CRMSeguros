"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { omitEmpresaId } from "@/lib/supabase/insert-helpers";
import { POLIZA_SELECT } from "@/lib/queries/polizas";
import type { Database } from "@/lib/types/database.types";

const polizaSchema = z.object({
  cliente_id: z.string().uuid("Selecciona un cliente"),
  aseguradora_id: z.string().uuid("Selecciona una aseguradora"),
  producto: z.string().trim().min(1, "El producto es obligatorio"),
  numero_poliza: z.string().trim().min(1, "El número de póliza es obligatorio"),
  fecha_emision: z.string().min(1, "La fecha de emisión es obligatoria"),
  fecha_vencimiento: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  moneda: z.enum(["DOP", "USD"]),
  suma_asegurada: z.coerce.number().nonnegative().optional().nullable(),
  deducible: z.coerce.number().nonnegative().optional().nullable(),
  plan_pago: z.enum(["unico", "mensual", "trimestral", "semestral", "anual"]),
  estado: z.enum(["activa", "vencida", "cancelada"]),
  propietario_id: z.string().uuid().optional().or(z.literal("")),
  beneficiarios: z.string().trim().optional().or(z.literal("")),
  notas: z.string().trim().optional().or(z.literal("")),
  comision_tipo: z.enum(["monto", "porcentaje"]).optional().or(z.literal("")),
  comision_valor: z.coerce.number().positive().optional().nullable(),
}).refine(
  (data) => !data.comision_tipo || (data.comision_valor && data.comision_valor > 0),
  { message: "Ingresa el valor de la comisión", path: ["comision_valor"] }
);

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
    moneda: parsed.moneda,
    suma_asegurada: parsed.suma_asegurada ?? null,
    deducible: parsed.deducible ?? null,
    plan_pago: parsed.plan_pago,
    estado: parsed.estado,
    propietario_id: parsed.propietario_id || null,
    beneficiarios: parsed.beneficiarios || null,
    notas: parsed.notas || null,
    comision_tipo: parsed.comision_tipo || null,
    comision_valor: parsed.comision_tipo ? parsed.comision_valor ?? null : null,
  };
}

export async function createPoliza(input: PolizaInput) {
  const parsed = polizaSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("polizas")
    .insert(
      omitEmpresaId<Database["public"]["Tables"]["polizas"]["Insert"]>(
        toInsertValues(parsed)
      )
    )
    .select(POLIZA_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una póliza con ese número para esta aseguradora.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/polizas");
  revalidatePath("/aseguradoras");
  revalidatePath(`/clientes/${parsed.cliente_id}`);
  return data;
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

// Creates the renewed póliza, then closes out any pending renewal task
// linked to the old one — closing the loop between the automated
// reminder (crear_tareas_renovacion, see migration 0014) and this manual
// action, so a renewed policy doesn't leave a stale "Renovar" task behind.
export async function renovarPoliza(polizaAnteriorId: string, input: PolizaInput) {
  const nueva = await createPoliza(input);

  const supabase = await createClient();
  await supabase
    .from("tareas")
    .update({ estado: "completada" })
    .eq("poliza_id", polizaAnteriorId)
    .eq("estado", "pendiente");

  revalidatePath("/tareas");
  return nueva;
}
