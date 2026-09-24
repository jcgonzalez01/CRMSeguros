"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOportunidades, type OportunidadListItem } from "@/lib/hooks/useOportunidades";
import {
  createOportunidad,
  deleteOportunidad,
  updateOportunidad,
  type OportunidadInput,
} from "@/lib/actions/oportunidades";
import { createPoliza, type PolizaInput } from "@/lib/actions/polizas";
import { createTarea, type TareaInput } from "@/lib/actions/tareas";
import type { OpportunityStatus } from "@/lib/types/database.types";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OportunidadForm } from "./OportunidadForm";
import { PolizaForm, type Option } from "@/components/polizas/PolizaForm";
import { TareaForm } from "@/components/tareas/TareaForm";

function formatMonto(monto: number | null) {
  if (monto === null) return "—";
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(
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

const MOTIVO_PERDIDA_LABELS: Record<string, string> = {
  precio: "Precio",
  competencia: "Competencia",
  no_responde: "No responde",
  cambio_necesidad: "Cambió de necesidad",
  otro: "Otro",
};

const MES_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Closed deals (ganada/perdida) are tracked by when they closed; a still-
// open one has no fecha_cierre yet, so it's tracked by when it entered
// the pipeline — either way, every opportunity lands in exactly one month.
function fechaEfectiva(o: OportunidadListItem): Date {
  return new Date((o.fecha_cierre ?? o.created_at).slice(0, 10) + "T00:00:00");
}

export function OportunidadesView({
  initialOportunidades,
  clientes,
  aseguradoras = [],
  propietarios,
  puedeEditar,
  puedeEditarPolizas = false,
  puedeEditarTareas = false,
}: {
  initialOportunidades: OportunidadListItem[];
  clientes: Option[];
  aseguradoras?: Option[];
  propietarios: Option[];
  puedeEditar: boolean;
  puedeEditarPolizas?: boolean;
  puedeEditarTareas?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<OpportunityStatus | "">("");
  const [año, setAño] = useState<number | "">("");
  const [mes, setMes] = useState<number | "">("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<OportunidadListItem | null>(null);
  const [deleting, setDeleting] = useState<OportunidadListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [creatingPolizaFrom, setCreatingPolizaFrom] = useState<OportunidadListItem | null>(null);
  const [creatingTareaFrom, setCreatingTareaFrom] = useState<OportunidadListItem | null>(null);

  const queryClient = useQueryClient();
  const filter = { search: search || undefined, estado: estado || undefined };
  const { data: oportunidades, isLoading } = useOportunidades(
    filter,
    initialOportunidades
  );

  const añosDisponibles = useMemo(() => {
    const años = new Set(
      (oportunidades ?? []).map((o) => fechaEfectiva(o).getFullYear())
    );
    años.add(new Date().getFullYear());
    return Array.from(años).sort((a, b) => b - a);
  }, [oportunidades]);

  const oportunidadesFiltradas = useMemo(() => {
    if (!oportunidades) return oportunidades;
    return oportunidades.filter((o) => {
      const fecha = fechaEfectiva(o);
      if (año !== "" && fecha.getFullYear() !== año) return false;
      if (mes !== "" && fecha.getMonth() + 1 !== mes) return false;
      return true;
    });
  }, [oportunidades, año, mes]);

  const totales = useMemo(() => {
    const porEstado = { abierta: { cantidad: 0, monto: 0 }, ganada: { cantidad: 0, monto: 0 }, perdida: { cantidad: 0, monto: 0 } };
    for (const o of oportunidadesFiltradas ?? []) {
      porEstado[o.estado].cantidad += 1;
      porEstado[o.estado].monto += o.monto_estimado ?? 0;
    }
    return porEstado;
  }, [oportunidadesFiltradas]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["oportunidades"] });
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

  async function handleCreatePoliza(input: PolizaInput) {
    await createPoliza(input);
    setCreatingPolizaFrom(null);
    queryClient.invalidateQueries({ queryKey: ["polizas"] });
    queryClient.invalidateQueries({ queryKey: ["aseguradoras"] });
  }

  async function handleCreateTarea(input: TareaInput) {
    await createTarea(input);
    setCreatingTareaFrom(null);
    queryClient.invalidateQueries({ queryKey: ["tareas"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Oportunidades</h1>
        {puedeEditar && (
          <button
            onClick={() => setCreating(true)}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Nueva oportunidad
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {(["abierta", "ganada", "perdida"] as const).map((key) => (
          <div key={key} className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
            <p className="text-sm text-gray-500">{ESTADO_LABELS[key]}</p>
            <p className="text-xl font-semibold">{totales[key].cantidad}</p>
            <p className="text-sm text-gray-500">{formatMonto(totales[key].monto)}</p>
          </div>
        ))}
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
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value ? Number(e.target.value) : "")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los meses</option>
          {MES_LABELS.map((label, i) => (
            <option key={label} value={i + 1}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={año}
          onChange={(e) => setAño(e.target.value ? Number(e.target.value) : "")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los años</option>
          {añosDisponibles.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
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
            {!isLoading && oportunidadesFiltradas?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No se encontraron oportunidades.
                </td>
              </tr>
            )}
            {oportunidadesFiltradas?.map((o) => (
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
                  {o.estado === "perdida" && o.motivo_perdida && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {MOTIVO_PERDIDA_LABELS[o.motivo_perdida] ?? o.motivo_perdida}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {puedeEditarPolizas && (
                    <button
                      onClick={() => setCreatingPolizaFrom(o)}
                      className="text-sm text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Crear póliza
                    </button>
                  )}
                  {puedeEditarTareas && (
                    <button
                      onClick={() => setCreatingTareaFrom(o)}
                      className="text-sm text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Nueva tarea
                    </button>
                  )}
                  {puedeEditar && (
                    <>
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
                    </>
                  )}
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
              motivo_perdida:
                (editing.motivo_perdida as OportunidadInput["motivo_perdida"]) ?? "",
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

      <Modal
        open={!!creatingPolizaFrom}
        onClose={() => setCreatingPolizaFrom(null)}
        title={`Crear póliza desde "${creatingPolizaFrom?.titulo ?? ""}"`}
      >
        {creatingPolizaFrom && (
          <PolizaForm
            clientes={clientes}
            aseguradoras={aseguradoras}
            propietarios={propietarios}
            oportunidades={[{ id: creatingPolizaFrom.id, titulo: creatingPolizaFrom.titulo }]}
            defaultValues={{
              cliente_id: creatingPolizaFrom.cliente_id,
              oportunidad_id: creatingPolizaFrom.id,
              monto: creatingPolizaFrom.monto_estimado ?? 0,
              propietario_id: creatingPolizaFrom.propietario_id ?? "",
            }}
            onSubmit={handleCreatePoliza}
            onCancel={() => setCreatingPolizaFrom(null)}
            submitLabel="Crear póliza"
          />
        )}
      </Modal>

      <Modal
        open={!!creatingTareaFrom}
        onClose={() => setCreatingTareaFrom(null)}
        title={`Nueva tarea desde "${creatingTareaFrom?.titulo ?? ""}"`}
      >
        {creatingTareaFrom && (
          <TareaForm
            clientes={clientes}
            miembros={propietarios}
            oportunidades={[{ id: creatingTareaFrom.id, titulo: creatingTareaFrom.titulo }]}
            defaultValues={{
              titulo: `Seguimiento: ${creatingTareaFrom.titulo}`,
              cliente_id: creatingTareaFrom.cliente_id,
              oportunidad_id: creatingTareaFrom.id,
              asignado_a: creatingTareaFrom.propietario_id ?? "",
            }}
            onSubmit={handleCreateTarea}
            onCancel={() => setCreatingTareaFrom(null)}
            submitLabel="Crear tarea"
          />
        )}
      </Modal>
    </div>
  );
}
