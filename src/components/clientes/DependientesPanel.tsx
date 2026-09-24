"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { listDependientes } from "@/lib/queries/dependientes";
import {
  createDependiente,
  deleteDependiente,
  updateDependiente,
  type DependienteInput,
} from "@/lib/actions/dependientes";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type Dependiente = Awaited<ReturnType<typeof listDependientes>>[number];

const PARENTESCO_LABELS: Record<string, string> = {
  conyuge: "Cónyuge",
  hijo: "Hijo",
  hija: "Hija",
  padre: "Padre",
  madre: "Madre",
  hermano: "Hermano",
  hermana: "Hermana",
  otro: "Otro",
};

function formatFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es").format(new Date(fecha + "T00:00:00"));
}

function DependienteForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  defaultValues?: Partial<DependienteInput>;
  onSubmit: (input: DependienteInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<DependienteInput>({
    nombre: defaultValues?.nombre ?? "",
    parentesco: defaultValues?.parentesco ?? "",
    fecha_nacimiento: defaultValues?.fecha_nacimiento ?? "",
    cedula: defaultValues?.cedula ?? "",
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
        <label className="block text-sm font-medium mb-1">Nombre *</label>
        <input
          required
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Parentesco</label>
          <select
            value={form.parentesco}
            onChange={(e) =>
              setForm({
                ...form,
                parentesco: e.target.value as DependienteInput["parentesco"],
              })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin especificar</option>
            {Object.entries(PARENTESCO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha de nacimiento</label>
          <input
            type="date"
            value={form.fecha_nacimiento}
            onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cédula</label>
        <input
          value={form.cedula}
          onChange={(e) => setForm({ ...form, cedula: e.target.value })}
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

export function DependientesPanel({
  clienteId,
  initialDependientes,
  puedeEditar,
}: {
  clienteId: string;
  initialDependientes: Dependiente[];
  puedeEditar: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Dependiente | null>(null);
  const [deleting, setDeleting] = useState<Dependiente | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: dependientes } = useQuery({
    queryKey: ["dependientes", clienteId],
    queryFn: () => listDependientes(createClient(), clienteId),
    initialData: initialDependientes,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["dependientes", clienteId] });
  }

  async function handleCreate(input: DependienteInput) {
    await createDependiente(clienteId, input);
    setCreating(false);
    invalidate();
  }

  async function handleUpdate(input: DependienteInput) {
    if (!editing) return;
    await updateDependiente(editing.id, clienteId, input);
    setEditing(null);
    invalidate();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteDependiente(deleting.id, clienteId);
      setDeleting(null);
      invalidate();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <h2 className="text-lg font-semibold">
          Dependientes ({dependientes?.length ?? 0})
        </h2>
        <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {puedeEditar && (
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setCreating(true)}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Agregar dependiente
              </button>
            </div>
          )}

          {dependientes?.length === 0 && (
            <p className="text-sm text-gray-400">Sin dependientes registrados.</p>
          )}

          {dependientes && dependientes.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Nombre</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Parentesco</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">
                      Fecha de nacimiento
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Cédula</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dependientes.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-2">{d.nombre}</td>
                      <td className="px-4 py-2">
                        {d.parentesco ? (PARENTESCO_LABELS[d.parentesco] ?? d.parentesco) : "—"}
                      </td>
                      <td className="px-4 py-2">{formatFecha(d.fecha_nacimiento)}</td>
                      <td className="px-4 py-2">{d.cedula ?? "—"}</td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        {puedeEditar && (
                          <>
                            <button
                              onClick={() => setEditing(d)}
                              className="text-sm text-gray-600 hover:text-gray-900 mr-3"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setDeleting(d)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Agregar dependiente">
        <DependienteForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Agregar"
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar dependiente">
        {editing && (
          <DependienteForm
            defaultValues={{
              nombre: editing.nombre,
              parentesco: (editing.parentesco as DependienteInput["parentesco"]) ?? "",
              fecha_nacimiento: editing.fecha_nacimiento ?? "",
              cedula: editing.cedula ?? "",
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar dependiente"
        message={`¿Seguro que quieres eliminar a "${deleting?.nombre}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}
