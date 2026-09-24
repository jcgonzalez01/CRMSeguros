"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { omitEmpresaId } from "@/lib/supabase/insert-helpers";
import { assertPuedeEditar } from "@/lib/permisos/server";
import type { Database } from "@/lib/types/database.types";

const MOTIVOS_PERDIDA = [
  "precio",
  "competencia",
  "no_responde",
  "cambio_necesidad",
  "otro",
] as const;

const oportunidadSchema = z
  .object({
    cliente_id: z.string().uuid("Selecciona un cliente"),
    titulo: z.string().trim().min(1, "El título es obligatorio"),
    monto_estimado: z.coerce.number().nonnegative().optional().nullable(),
    estado: z.enum(["abierta", "ganada", "perdida"]),
    propietario_id: z.string().uuid().optional().or(z.literal("")),
    motivo_perdida: z.enum(MOTIVOS_PERDIDA).optional().or(z.literal("")),
    notas: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => data.estado !== "perdida" || data.motivo_perdida, {
    message: "Selecciona el motivo de la pérdida",
    path: ["motivo_perdida"],
  });

export type OportunidadInput = z.infer<typeof oportunidadSchema>;

function toValues(parsed: OportunidadInput) {
  return {
    cliente_id: parsed.cliente_id,
    titulo: parsed.titulo,
    monto_estimado: parsed.monto_estimado ?? null,
    estado: parsed.estado,
    propietario_id: parsed.propietario_id || null,
    // Solo tiene sentido mientras el estado siga siendo 'perdida' — se
    // limpia si se reabre o se termina ganando.
    motivo_perdida: parsed.estado === "perdida" ? parsed.motivo_perdida || null : null,
    notas: parsed.notas || null,
    // Closed the moment it moves to ganada/perdida; cleared if reopened.
    fecha_cierre:
      parsed.estado === "abierta"
        ? null
        : new Date().toISOString().slice(0, 10),
  };
}

export async function createOportunidad(input: OportunidadInput) {
  const parsed = oportunidadSchema.parse(input);
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "oportunidades");

  const { error } = await supabase
    .from("oportunidades")
    .insert(
      omitEmpresaId<Database["public"]["Tables"]["oportunidades"]["Insert"]>(
        toValues(parsed)
      )
    );

  if (error) throw new Error(error.message);
  revalidatePath("/oportunidades");
  revalidatePath(`/clientes/${parsed.cliente_id}`);
}

export async function updateOportunidad(id: string, input: OportunidadInput) {
  const parsed = oportunidadSchema.parse(input);
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "oportunidades");

  // Only stamp fecha_cierre on the actual abierta -> ganada/perdida
  // transition, not on every subsequent edit, so the dashboard's "de la
  // semana" views reflect when the deal genuinely closed.
  const { data: existing } = await supabase
    .from("oportunidades")
    .select("estado, fecha_cierre")
    .eq("id", id)
    .single();

  const values = toValues(parsed);
  if (existing && existing.estado === parsed.estado) {
    values.fecha_cierre = existing.fecha_cierre;
  }

  const { error } = await supabase
    .from("oportunidades")
    .update(values)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/oportunidades");
  revalidatePath(`/clientes/${parsed.cliente_id}`);
}

export async function deleteOportunidad(id: string, clienteId: string) {
  const supabase = await createClient();
  await assertPuedeEditar(supabase, "oportunidades");
  const { error } = await supabase.from("oportunidades").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/oportunidades");
  revalidatePath(`/clientes/${clienteId}`);
}
