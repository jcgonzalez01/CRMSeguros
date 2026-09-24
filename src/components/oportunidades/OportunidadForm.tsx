"use client";

import { useState } from "react";
import type { OportunidadInput } from "@/lib/actions/oportunidades";
import type { Option } from "@/components/polizas/PolizaForm";

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
        <label className="block text-sm font-medium mb-1">Título *</label>
        <input
          required
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cliente *</label>
        <select
          required
          value={form.cliente_id}
          onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Monto estimado</label>
          <input
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estado *</label>
          <select
            value={form.estado}
            onChange={(e) =>
              setForm({
                ...form,
                estado: e.target.value as OportunidadInput["estado"],
              })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(ESTADO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {form.estado === "perdida" && (
        <div>
          <label className="block text-sm font-medium mb-1">Motivo de pérdida *</label>
          <select
            required
            value={form.motivo_perdida}
            onChange={(e) =>
              setForm({
                ...form,
                motivo_perdida: e.target.value as OportunidadInput["motivo_perdida"],
              })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Propietario</label>
        <select
          value={form.propietario_id}
          onChange={(e) => setForm({ ...form, propietario_id: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sin asignar</option>
          {propietarios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notas</label>
        <textarea
          value={form.notas}
          onChange={(e) => setForm({ ...form, notas: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
