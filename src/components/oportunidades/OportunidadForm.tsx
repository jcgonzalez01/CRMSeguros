"use client";

import { useState, useId } from "react";
import type { OportunidadInput } from "@/lib/actions/oportunidades";
import type { Option } from "@/components/polizas/PolizaForm";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/fields";

const ESTADO_LABELS: Record<OportunidadInput["estado"], string> = {
  abierta: "Abierta",
  ganada: "Ganada",
  perdida: "Perdida",
};

const MOTIVO_PERDIDA_LABELS: Record<
  NonNullable<OportunidadInput["motivo_perdida"]>,
  string
> = {
  precio: "Precio",
  competencia: "Se fue con la competencia",
  no_responde: "Dejó de responder",
  cambio_necesidad: "Cambió de necesidad",
  otro: "Otro",
  "": "",
};

export function OportunidadForm({
  defaultValues,
  clientes,
  propietarios,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  defaultValues?: Partial<OportunidadInput>;
  clientes: Option[];
  propietarios: Option[];
  onSubmit: (input: OportunidadInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const uid = useId();
  const [form, setForm] = useState<OportunidadInput>({
    cliente_id: defaultValues?.cliente_id ?? "",
    titulo: defaultValues?.titulo ?? "",
    monto_estimado: defaultValues?.monto_estimado ?? null,
    estado: defaultValues?.estado ?? "abierta",
    propietario_id: defaultValues?.propietario_id ?? "",
    motivo_perdida: defaultValues?.motivo_perdida ?? "",
    notas: defaultValues?.notas ?? "",
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
        <FieldLabel htmlFor={`${uid}-2`}>Cliente *</FieldLabel>
        <Select
          id={`${uid}-2`}
          required
          value={form.cliente_id}
          onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${uid}-3`}>Monto estimado</FieldLabel>
          <Input
            id={`${uid}-3`}
            type="number"
            min="0"
            step="0.01"
            value={form.monto_estimado ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                monto_estimado: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${uid}-4`}>Estado *</FieldLabel>
          <Select
            id={`${uid}-4`}
            value={form.estado}
            onChange={(e) =>
              setForm({
                ...form,
                estado: e.target.value as OportunidadInput["estado"],
              })
            }
          >
            {Object.entries(ESTADO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {form.estado === "perdida" && (
        <div>
          <FieldLabel htmlFor={`${uid}-5`}>Motivo de pérdida *</FieldLabel>
          <Select
            id={`${uid}-5`}
            required
            value={form.motivo_perdida}
            onChange={(e) =>
              setForm({
                ...form,
                motivo_perdida: e.target.value as OportunidadInput["motivo_perdida"],
              })
            }
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {Object.entries(MOTIVO_PERDIDA_LABELS)
              .filter(([value]) => value !== "")
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </Select>
        </div>
      )}

      <div>
        <FieldLabel htmlFor={`${uid}-6`}>Propietario</FieldLabel>
        <Select
          id={`${uid}-6`}
          value={form.propietario_id}
          onChange={(e) => setForm({ ...form, propietario_id: e.target.value })}
        >
          <option value="">Sin asignar</option>
          {propietarios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-7`}>Notas</FieldLabel>
        <Textarea
          id={`${uid}-7`}
          value={form.notas}
          onChange={(e) => setForm({ ...form, notas: e.target.value })}
          rows={3}
        />
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
