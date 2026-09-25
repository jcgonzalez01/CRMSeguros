"use client";

import { useState } from "react";
import type { TareaInput } from "@/lib/actions/tareas";
import type { Option } from "@/components/polizas/PolizaForm";

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
        <label className="block text-sm font-medium mb-1">Título *</label>
        <input
          required
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <textarea
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cliente</label>
          <select
            value={form.cliente_id}
            onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Asignado a</label>
          <select
            value={form.asignado_a}
            onChange={(e) => setForm({ ...form, asignado_a: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin asignar</option>
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Oportunidad relacionada</label>
        <select
          value={form.oportunidad_id}
          onChange={(e) => setForm({ ...form, oportunidad_id: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sin oportunidad</option>
          {oportunidades.map((o) => (
            <option key={o.id} value={o.id}>
              {o.titulo}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fecha límite *</label>
          <input
            type="date"
            required
            value={form.fecha_limite}
            onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estado</label>
          <select
            value={form.estado}
            onChange={(e) =>
              setForm({ ...form, estado: e.target.value as TareaInput["estado"] })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="en_espera">En espera</option>
            <option value="vencida">Vencida</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
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
