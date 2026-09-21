"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAseguradoras,
  type AseguradoraListItem,
} from "@/lib/hooks/useAseguradoras";
import {
  createAseguradora,
  deleteAseguradora,
  updateAseguradora,
  type AseguradoraInput,
} from "@/lib/actions/aseguradoras";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AseguradoraForm } from "./AseguradoraForm";

export function AseguradorasView({
  initialAseguradoras,
}: {
  initialAseguradoras: AseguradoraListItem[];
}) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AseguradoraListItem | null>(null);
  const [deleting, setDeleting] = useState<AseguradoraListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const filter = { search: search || undefined };
  const { data: aseguradoras, isLoading } = useAseguradoras(
    filter,
    initialAseguradoras
  );

  async function handleCreate(input: AseguradoraInput) {
    await createAseguradora(input);
    setCreating(false);
    queryClient.invalidateQueries({ queryKey: ["aseguradoras"] });
  }

  async function handleUpdate(input: AseguradoraInput) {
    if (!editing) return;
    await updateAseguradora(editing.id, input);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["aseguradoras"] });
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteAseguradora(deleting.id);
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["aseguradoras"] });
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la aseguradora."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Aseguradoras</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nueva aseguradora
        </button>
      </div>

      <input
        placeholder="Buscar por nombre…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-80 rounded-md border border-gray-300 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Pólizas activas</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && aseguradoras?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  No se encontraron aseguradoras.
                </td>
              </tr>
            )}
            {aseguradoras?.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-2 font-medium">{a.nombre}</td>
                <td className="px-4 py-2">{a.polizas_activas}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditing(a)}
                    className="text-sm text-gray-600 hover:text-gray-900 mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleting(a)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva aseguradora">
        <AseguradoraForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Crear"
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar aseguradora">
        {editing && (
          <AseguradoraForm
            defaultValues={{ nombre: editing.nombre, notas: editing.notas ?? "" }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar aseguradora"
        message={
          deleteError ??
          `¿Seguro que quieres eliminar "${deleting?.nombre}"? No se puede eliminar si tiene pólizas asociadas.`
        }
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleting(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
