"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useClientes, type ClienteListItem } from "@/lib/hooks/useClientes";
import { createCliente, deleteCliente, updateCliente } from "@/lib/actions/clientes";
import type { ClienteInput } from "@/lib/actions/clientes";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ClienteForm, type ProfileOption } from "./ClienteForm";

export function ClientesView({
  initialClientes,
  profiles,
}: {
  initialClientes: ClienteListItem[];
  profiles: ProfileOption[];
}) {
  const [search, setSearch] = useState("");
  const [propietarioId, setPropietarioId] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ClienteListItem | null>(null);
  const [deleting, setDeleting] = useState<ClienteListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const queryClient = useQueryClient();
  const filter = { search: search || undefined, propietarioId: propietarioId || undefined };
  const { data: clientes, isLoading } = useClientes(filter, initialClientes);

  async function handleCreate(input: ClienteInput) {
    await createCliente(input);
    setCreating(false);
    queryClient.invalidateQueries({ queryKey: ["clientes"] });
  }

  async function handleUpdate(input: ClienteInput) {
    if (!editing) return;
    await updateCliente(editing.id, input);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["clientes"] });
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteCliente(deleting.id);
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo cliente
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          placeholder="Buscar por nombre, correo o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={propietarioId}
          onChange={(e) => setPropietarioId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los propietarios</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden sm:table-cell">Teléfono</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden md:table-cell">Correo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden md:table-cell">Propietario</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && clientes?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No se encontraron clientes.
                </td>
              </tr>
            )}
            {clientes?.map((cliente) => (
              <tr key={cliente.id}>
                <td className="px-4 py-2">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {cliente.nombre}
                  </Link>
                </td>
                <td className="px-4 py-2 hidden sm:table-cell">{cliente.telefono ?? "—"}</td>
                <td className="px-4 py-2 hidden md:table-cell">{cliente.correo ?? "—"}</td>
                <td className="px-4 py-2 hidden md:table-cell">
                  {cliente.propietario?.full_name ?? "—"}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditing(cliente)}
                    className="text-sm text-gray-600 hover:text-gray-900 mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleting(cliente)}
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

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo cliente">
        <ClienteForm
          profiles={profiles}
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Crear"
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar cliente">
        {editing && (
          <ClienteForm
            profiles={profiles}
            defaultValues={{
              nombre: editing.nombre,
              telefono: editing.telefono ?? "",
              correo: editing.correo ?? "",
              notas: editing.notas ?? "",
              propietario_id: editing.propietario_id ?? "",
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar cliente"
        message={`¿Seguro que quieres eliminar a "${deleting?.nombre}"? También se eliminarán sus pólizas y oportunidades asociadas.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
