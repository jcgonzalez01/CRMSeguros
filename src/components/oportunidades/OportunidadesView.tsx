"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useOportunidades,
  useTotalesOportunidades,
  type OportunidadListItem,
} from "@/lib/hooks/useOportunidades";
import {
  createOportunidad,
  deleteOportunidad,
  updateOportunidad,
  type OportunidadInput,
} from "@/lib/actions/oportunidades";
import type { OpportunityStatus } from "@/lib/types/database.types";
import type { getTotalesOportunidades } from "@/lib/queries/oportunidades";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OportunidadForm } from "./OportunidadForm";
import type { Option } from "@/components/polizas/PolizaForm";

function formatMonto(monto: number | null) {
  if (monto === null) return "—";
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(
    monto
  );
}

const ESTADO_BADGE: Record<OpportunityStatus, string> = {
  abierta: "bg-blue-100 text-blue-800",
  ganada: "bg-green-100 text-green-800",
  perdida: "bg-red-100 text-red-800",
};

const ESTADO_LABELS: Record<OpportunityStatus, string> = {
  abierta: "Abierta",
  ganada: "Ganada",
  perdida: "Perdida",
};

export function OportunidadesView({
  initialOportunidades,
  initialTotales,
  clientes,
  propietarios,
}: {
  initialOportunidades: OportunidadListItem[];
  initialTotales: Awaited<ReturnType<typeof getTotalesOportunidades>>;
  clientes: Option[];
  propietarios: Option[];
}) {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<OpportunityStatus | "">("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<OportunidadListItem | null>(null);
  const [deleting, setDeleting] = useState<OportunidadListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const queryClient = useQueryClient();
  const filter = { search: search || undefined, estado: estado || undefined };
  const { data: oportunidades, isLoading } = useOportunidades(
    filter,
    initialOportunidades
  );
  const { data: totales } = useTotalesOportunidades(initialTotales);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["oportunidades"] });
    queryClient.invalidateQueries({ queryKey: ["oportunidades-totales"] });
  }

  async function handleCreate(input: OportunidadInput) {
    await createOportunidad(input);
    setCreating(false);
    invalidate();
  }

  async function handleUpdate(input: OportunidadInput) {
    if (!editing) return;
    await updateOportunidad(editing.id, input);
    setEditing(null);
    invalidate();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteOportunidad(deleting.id, deleting.cliente_id);
      setDeleting(null);
      invalidate();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Oportunidades</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nueva oportunidad
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {(["abierta", "ganada", "perdida"] as const).map((key) => {
          const totalRow = totales?.find((t) => t.estado === key);
          return (
            <div key={key} className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">{ESTADO_LABELS[key]}</p>
              <p className="text-xl font-semibold">{totalRow?.cantidad ?? 0}</p>
              <p className="text-sm text-gray-500">
                {formatMonto(totalRow?.monto_total ?? 0)}
              </p>
            </div>
          );
        })}
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
          onChange={(e) => setEstado(e.target.value as OpportunityStatus | "")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="abierta">Abierta</option>
          <option value="ganada">Ganada</option>
          <option value="perdida">Perdida</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Título</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden sm:table-cell">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden md:table-cell">Propietario</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Monto</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
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
            {!isLoading && oportunidades?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No se encontraron oportunidades.
                </td>
              </tr>
            )}
            {oportunidades?.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-2">{o.titulo}</td>
                <td className="px-4 py-2 hidden sm:table-cell">{o.cliente?.nombre ?? "—"}</td>
                <td className="px-4 py-2 hidden md:table-cell">
                  {o.propietario?.full_name ?? "—"}
                </td>
                <td className="px-4 py-2">{formatMonto(o.monto_estimado)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${ESTADO_BADGE[o.estado]}`}
                  >
                    {ESTADO_LABELS[o.estado]}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditing(o)}
                    className="text-sm text-gray-600 hover:text-gray-900 mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleting(o)}
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

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva oportunidad">
        <OportunidadForm
          clientes={clientes}
          propietarios={propietarios}
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Crear"
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar oportunidad">
        {editing && (
          <OportunidadForm
            clientes={clientes}
            propietarios={propietarios}
            defaultValues={{
              cliente_id: editing.cliente_id,
              titulo: editing.titulo,
              monto_estimado: editing.monto_estimado,
              estado: editing.estado,
              propietario_id: editing.propietario_id ?? "",
              notas: editing.notas ?? "",
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar oportunidad"
        message={`¿Seguro que quieres eliminar "${deleting?.titulo}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
