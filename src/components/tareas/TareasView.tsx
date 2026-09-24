"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTareas, type TareaListItem } from "@/lib/hooks/useTareas";
import {
  createTarea,
  deleteTarea,
  setTareaEstado,
  updateTarea,
  type TareaInput,
} from "@/lib/actions/tareas";
import type { TaskStatus } from "@/lib/types/database.types";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TareaForm } from "./TareaForm";
import type { Option } from "@/components/polizas/PolizaForm";

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es").format(new Date(fecha));
}

function isAtrasada(tarea: TareaListItem) {
  if (tarea.estado === "completada") return false;
  return new Date(tarea.fecha_limite) < new Date(new Date().toDateString());
}

export function TareasView({
  initialTareas,
  clientes,
  miembros,
  oportunidades = [],
  puedeEditar,
}: {
  initialTareas: TareaListItem[];
  clientes: Option[];
  miembros: Option[];
  oportunidades?: { id: string; titulo: string }[];
  puedeEditar: boolean;
}) {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<TaskStatus | "">("");
  const [asignadoA, setAsignadoA] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TareaListItem | null>(null);
  const [deleting, setDeleting] = useState<TareaListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const queryClient = useQueryClient();
  const filter = {
    search: search || undefined,
    estado: estado || undefined,
    asignadoA: asignadoA || undefined,
  };
  const { data: tareas, isLoading } = useTareas(filter, initialTareas);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["tareas"] });
  }

  async function handleCreate(input: TareaInput) {
    await createTarea(input);
    setCreating(false);
    invalidate();
  }

  async function handleUpdate(input: TareaInput) {
    if (!editing) return;
    await updateTarea(editing.id, input);
    setEditing(null);
    invalidate();
  }

  async function handleToggle(tarea: TareaListItem) {
    const next = tarea.estado === "completada" ? "pendiente" : "completada";
    await setTareaEstado(tarea.id, next);
    invalidate();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteTarea(deleting.id, deleting.cliente_id);
      setDeleting(null);
      invalidate();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Tareas</h1>
        {puedeEditar && (
          <button
            onClick={() => setCreating(true)}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Nueva tarea
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          placeholder="Buscar por título…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as TaskStatus | "")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="completada">Completada</option>
        </select>
        <select
          value={asignadoA}
          onChange={(e) => setAsignadoA(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los asignados</option>
          {miembros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500 w-10" />
              <th className="px-4 py-2 text-left font-medium text-gray-500">Título</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden sm:table-cell">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden md:table-cell">Asignado</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Fecha límite</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && tareas?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No se encontraron tareas.
                </td>
              </tr>
            )}
            {tareas?.map((t) => (
              <tr key={t.id} className={t.estado === "completada" ? "opacity-60" : ""}>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={t.estado === "completada"}
                    onChange={() => handleToggle(t)}
                    disabled={!puedeEditar}
                    className="h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                  />
                </td>
                <td className={`px-4 py-2 ${t.estado === "completada" ? "line-through" : ""}`}>
                  {t.titulo}
                  {t.oportunidad && (
                    <p className="text-xs text-gray-400 font-normal">
                      De: {t.oportunidad.titulo}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2 hidden sm:table-cell">{t.cliente?.nombre ?? "—"}</td>
                <td className="px-4 py-2 hidden md:table-cell">
                  {t.asignado?.full_name ?? "—"}
                </td>
                <td className={`px-4 py-2 ${isAtrasada(t) ? "text-red-600 font-medium" : ""}`}>
                  {formatFecha(t.fecha_limite)}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {puedeEditar && (
                    <>
                      <button
                        onClick={() => setEditing(t)}
                        className="text-sm text-gray-600 hover:text-gray-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleting(t)}
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

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva tarea">
        <TareaForm
          clientes={clientes}
          miembros={miembros}
          oportunidades={oportunidades}
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Crear"
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar tarea">
        {editing && (
          <TareaForm
            clientes={clientes}
            miembros={miembros}
            oportunidades={oportunidades}
            defaultValues={{
              titulo: editing.titulo,
              descripcion: editing.descripcion ?? "",
              cliente_id: editing.cliente_id ?? "",
              asignado_a: editing.asignado_a ?? "",
              oportunidad_id: editing.oportunidad_id ?? "",
              fecha_limite: editing.fecha_limite,
              estado: editing.estado,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar tarea"
        message={`¿Seguro que quieres eliminar "${deleting?.titulo}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
