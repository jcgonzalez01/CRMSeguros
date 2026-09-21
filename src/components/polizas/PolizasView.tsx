"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePolizas, type PolizaListItem } from "@/lib/hooks/usePolizas";
import {
  createPoliza,
  deletePoliza,
  updatePoliza,
  type PolizaInput,
} from "@/lib/actions/polizas";
import type { PolicyStatus } from "@/lib/types/database.types";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PolizaForm, type Option } from "./PolizaForm";

function formatMonto(monto: number) {
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(
    monto
  );
}

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es").format(new Date(fecha));
}

const ESTADO_BADGE: Record<PolicyStatus, string> = {
  activa: "bg-green-100 text-green-800",
  vencida: "bg-amber-100 text-amber-800",
  cancelada: "bg-gray-100 text-gray-600",
};

export function PolizasView({
  initialPolizas,
  clientes,
  aseguradoras,
  propietarios,
}: {
  initialPolizas: PolizaListItem[];
  clientes: Option[];
  aseguradoras: Option[];
  propietarios: Option[];
}) {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<PolicyStatus | "">("");
  const [aseguradoraId, setAseguradoraId] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PolizaListItem | null>(null);
  const [deleting, setDeleting] = useState<PolizaListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const queryClient = useQueryClient();
  const filter = {
    search: search || undefined,
    estado: estado || undefined,
    aseguradoraId: aseguradoraId || undefined,
  };
  const { data: polizas, isLoading } = usePolizas(filter, initialPolizas);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["polizas"] });
    queryClient.invalidateQueries({ queryKey: ["aseguradoras"] });
  }

  async function handleCreate(input: PolizaInput) {
    await createPoliza(input);
    setCreating(false);
    invalidate();
  }

  async function handleUpdate(input: PolizaInput) {
    if (!editing) return;
    await updatePoliza(editing.id, input);
    setEditing(null);
    invalidate();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deletePoliza(deleting.id, deleting.cliente_id);
      setDeleting(null);
      invalidate();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Pólizas</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nueva póliza
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          placeholder="Buscar por producto o número…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as PolicyStatus | "")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="vencida">Vencida</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <select
          value={aseguradoraId}
          onChange={(e) => setAseguradoraId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las aseguradoras</option>
          {aseguradoras.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden sm:table-cell">Producto</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden md:table-cell">Aseguradora</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Vencimiento</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden sm:table-cell">Monto</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && polizas?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  No se encontraron pólizas.
                </td>
              </tr>
            )}
            {polizas?.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">{p.cliente?.nombre ?? "—"}</td>
                <td className="px-4 py-2 hidden sm:table-cell">{p.producto}</td>
                <td className="px-4 py-2 hidden md:table-cell">{p.aseguradora?.nombre ?? "—"}</td>
                <td className="px-4 py-2">{formatFecha(p.fecha_vencimiento)}</td>
                <td className="px-4 py-2 hidden sm:table-cell">{formatMonto(p.monto)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${ESTADO_BADGE[p.estado]}`}
                  >
                    {p.estado}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditing(p)}
                    className="text-sm text-gray-600 hover:text-gray-900 mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleting(p)}
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

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva póliza">
        <PolizaForm
          clientes={clientes}
          aseguradoras={aseguradoras}
          propietarios={propietarios}
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Crear"
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar póliza">
        {editing && (
          <PolizaForm
            clientes={clientes}
            aseguradoras={aseguradoras}
            propietarios={propietarios}
            defaultValues={{
              cliente_id: editing.cliente_id,
              aseguradora_id: editing.aseguradora_id,
              producto: editing.producto,
              numero_poliza: editing.numero_poliza,
              fecha_emision: editing.fecha_emision,
              fecha_vencimiento: editing.fecha_vencimiento,
              monto: editing.monto,
              plan_pago: editing.plan_pago,
              estado: editing.estado,
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
        title="Eliminar póliza"
        message={`¿Seguro que quieres eliminar la póliza "${deleting?.numero_poliza}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
