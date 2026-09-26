"use client";

import { useState, useId } from "react";
import type { TareaInput } from "@/lib/actions/tareas";
import type { Option } from "@/components/polizas/PolizaForm";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/fields";

export function TareaForm({
  defaultValues,
  clientes,
  miembros,
  oportunidades = [],
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  defaultValues?: Partial<TareaInput>;
  clientes: Option[];
  miembros: Option[];
  oportunidades?: { id: string; titulo: string }[];
  onSubmit: (input: TareaInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const uid = useId();
  const [form, setForm] = useState<TareaInput>({
    titulo: defaultValues?.titulo ?? "",
    descripcion: defaultValues?.descripcion ?? "",
    cliente_id: defaultValues?.cliente_id ?? "",
    asignado_a: defaultValues?.asignado_a ?? "",
    oportunidad_id: defaultValues?.oportunidad_id ?? "",
    fecha_limite: defaultValues?.fecha_limite ?? "",
    estado: defaultValues?.estado ?? "pendiente",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${uid}-1`}>Título *</FieldLabel>
        <Input
          id={`${uid}-1`}
          required
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-2`}>Descripción</FieldLabel>
        <Textarea
          id={`${uid}-2`}
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${uid}-3`}>Cliente</FieldLabel>
          <Select
            id={`${uid}-3`}
            value={form.cliente_id}
            onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
          >
            <option value="">Sin cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor={`${uid}-4`}>Asignado a</FieldLabel>
          <Select
            id={`${uid}-4`}
            value={form.asignado_a}
            onChange={(e) => setForm({ ...form, asignado_a: e.target.value })}
          >
            <option value="">Sin asignar</option>
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-5`}>Oportunidad relacionada</FieldLabel>
        <Select
          id={`${uid}-5`}
          value={form.oportunidad_id}
          onChange={(e) => setForm({ ...form, oportunidad_id: e.target.value })}
        >
          <option value="">Sin oportunidad</option>
          {oportunidades.map((o) => (
            <option key={o.id} value={o.id}>
              {o.titulo}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${uid}-6`}>Fecha límite *</FieldLabel>
          <Input
            id={`${uid}-6`}
            type="date"
            required
            value={form.fecha_limite}
            onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${uid}-7`}>Estado</FieldLabel>
          <Select
            id={`${uid}-7`}
            value={form.estado}
            onChange={(e) =>
              setForm({ ...form, estado: e.target.value as TareaInput["estado"] })
            }
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="en_espera">En espera</option>
            <option value="vencida">Vencida</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </Select>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
