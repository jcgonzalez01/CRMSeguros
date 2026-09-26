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
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/fields";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableMessage,
  TableRow,
} from "@/components/ui/Table";

function formatMonto(monto: number | null) {
  if (monto === null) return "—";
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(
    monto
  );
}

const ESTADO_TONE: Record<OpportunityStatus, BadgeTone> = {
  abierta: "blue",
  ganada: "green",
  perdida: "red",
};

const COLS =
  "grid-cols-[44px_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.2fr)_120px_140px_280px]";

const LINK_ACTION = "text-[13px] font-semibold text-blue-700 hover:underline";
const LINK_DIALOG = "text-sm font-semibold text-blue-700 hover:underline";

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

function DetailItem({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={["flex min-w-0 flex-col gap-[3px]", className].filter(Boolean).join(" ")}>
      <dt className="text-xs font-medium text-gray-600">{label}</dt>
      <dd className="m-0 text-sm font-medium leading-normal text-gray-900">{children}</dd>
    </div>
  );
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
  const [viewing, setViewing] = useState<OportunidadListItem | null>(null);

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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Oportunidades"
        description="Seguimiento de tu pipeline de ventas"
        actions={
          puedeEditar && (
            <Button type="button" onClick={() => setCreating(true)}>
              Nueva oportunidad
            </Button>
          )
        }
      />

      <section
        aria-label="Resumen por estado"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {(["abierta", "ganada", "perdida"] as const).map((key) => (
          <Card key={key} className="flex flex-col items-start gap-2 px-[22px] py-[18px]">
            <Badge tone={ESTADO_TONE[key]}>{ESTADO_LABELS[key]}</Badge>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="text-[32px] font-semibold tracking-tight tabular-nums">
                {totales[key].cantidad}
              </span>
              <span className="text-sm tabular-nums text-gray-600">
                {formatMonto(totales[key].monto)}
              </span>
            </div>
          </Card>
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Buscar por título"
          placeholder="Buscar por título…"
          value={search}
          onChange={(e) => setSearch(e.target.value)} fullWidth={false} className="min-w-0 flex-1"
        />
        <Select
          aria-label="Todos los estados"
          value={estado}
          onChange={(e) => setEstado(e.target.value as OpportunityStatus | "")} fullWidth={false}
        >
          <option value="">Todos los estados</option>
          <option value="abierta">Abierta</option>
          <option value="ganada">Ganada</option>
          <option value="perdida">Perdida</option>
        </Select>
        <Select
          aria-label="Todos los meses"
          value={mes}
          onChange={(e) => setMes(e.target.value ? Number(e.target.value) : "")} fullWidth={false}
        >
          <option value="">Todos los meses</option>
          {MES_LABELS.map((label, i) => (
            <option key={label} value={i + 1}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Todos los años"
          value={año}
          onChange={(e) => setAño(e.target.value ? Number(e.target.value) : "")} fullWidth={false}
        >
          <option value="">Todos los años</option>
          {añosDisponibles.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </div>

      <Table label="Oportunidades" minWidth="min-w-[1120px]">
        <TableHeader cols={COLS}>
          <TableHead>#</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Propietario</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead srOnly>Acciones</TableHead>
        </TableHeader>
        {isLoading && <TableMessage>Cargando…</TableMessage>}
        {!isLoading && oportunidadesFiltradas?.length === 0 && (
          <TableMessage>No se encontraron oportunidades.</TableMessage>
        )}
        {oportunidadesFiltradas?.map((o, index) => (
          <TableRow
            key={o.id}
            cols={COLS}
            onClick={() => setViewing(o)}
            className="cursor-pointer hover:bg-gray-50"
          >
            <TableCell className="tabular-nums text-gray-600">{index + 1}</TableCell>
            <TableCell>
              <button
                type="button"
                onClick={() => setViewing(o)}
                className="max-w-full truncate text-left font-semibold text-blue-700 hover:underline"
              >
                {o.titulo}
              </button>
            </TableCell>
            <TableCell className="truncate">{o.cliente?.nombre ?? "—"}</TableCell>
            <TableCell className="truncate text-gray-600">
              {o.propietario?.full_name ?? "—"}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatMonto(o.monto_estimado)}
            </TableCell>
            <TableCell>
              <div className="flex flex-col items-start gap-1">
                <Badge tone={ESTADO_TONE[o.estado]}>{ESTADO_LABELS[o.estado]}</Badge>
                {o.estado === "perdida" && o.motivo_perdida && (
                  <span className="text-xs text-gray-600">
                    {MOTIVO_PERDIDA_LABELS[o.motivo_perdida] ?? o.motivo_perdida}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div
                className="flex items-center justify-end gap-1 whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                {puedeEditarPolizas && (
                  <button
                    type="button"
                    onClick={() => setCreatingPolizaFrom(o)}
                    className={`${LINK_ACTION} mr-2`}
                  >
                    Crear póliza
                  </button>
                )}
                {puedeEditarTareas && (
                  <button
                    type="button"
                    onClick={() => setCreatingTareaFrom(o)}
                    className={`${LINK_ACTION} mr-2`}
                  >
                    Nueva tarea
                  </button>
                )}
                {puedeEditar && (
                  <>
                    <IconButton icon="pencil" label="Editar oportunidad" onClick={() => setEditing(o)} />
                    <IconButton
                      icon="trash"
                      tone="danger"
                      label="Eliminar oportunidad"
                      onClick={() => setDeleting(o)}
                    />
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>

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

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.titulo ?? ""}
      >
        {viewing && (
          <div className="flex flex-col gap-5">
            <dl className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              <DetailItem label="Cliente">{viewing.cliente?.nombre ?? "—"}</DetailItem>
              <DetailItem label="Propietario">{viewing.propietario?.full_name ?? "—"}</DetailItem>
              <DetailItem label="Monto">
                <span className="tabular-nums">{formatMonto(viewing.monto_estimado)}</span>
              </DetailItem>
              <DetailItem label="Creada">
                {new Date(viewing.created_at).toLocaleDateString("es-DO")}
              </DetailItem>
              <div className="flex flex-col items-start gap-1">
                <dt className="text-xs font-medium text-gray-600">Estado</dt>
                <dd>
                  <Badge tone={ESTADO_TONE[viewing.estado]}>{ESTADO_LABELS[viewing.estado]}</Badge>
                </dd>
              </div>
              {viewing.fecha_cierre && (
                <DetailItem label="Fecha de cierre">
                  {new Date(viewing.fecha_cierre).toLocaleDateString("es-DO")}
                </DetailItem>
              )}
              {viewing.estado === "perdida" && viewing.motivo_perdida && (
                <DetailItem label="Motivo de pérdida">
                  {MOTIVO_PERDIDA_LABELS[viewing.motivo_perdida] ?? viewing.motivo_perdida}
                </DetailItem>
              )}
              {viewing.notas && (
                <DetailItem label="Notas" className="sm:col-span-2">
                  <span className="whitespace-pre-wrap">{viewing.notas}</span>
                </DetailItem>
              )}
            </dl>
            <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-4">
              {puedeEditarTareas && (
                <button
                  type="button"
                  onClick={() => {
                    setCreatingTareaFrom(viewing);
                    setViewing(null);
                  }}
                  className={LINK_DIALOG}
                >
                  Nueva tarea
                </button>
              )}
              {puedeEditarPolizas && (
                <button
                  type="button"
                  onClick={() => {
                    setCreatingPolizaFrom(viewing);
                    setViewing(null);
                  }}
                  className={LINK_DIALOG}
                >
                  Crear póliza
                </button>
              )}
              {puedeEditar && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditing(viewing);
                    setViewing(null);
                  }}
                >
                  Editar
                </Button>
              )}
            </div>
          </div>
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
