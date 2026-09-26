"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { usePolizas, type PolizaListItem } from "@/lib/hooks/usePolizas";
import {
  createPoliza,
  deletePoliza,
  renovarPoliza,
  updatePoliza,
  type PolizaInput,
} from "@/lib/actions/polizas";
import { calcularRenovacion } from "@/lib/polizas/renovar";
import type { MonedaPoliza, PolicyStatus } from "@/lib/types/database.types";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PolizaForm, type Option } from "./PolizaForm";
import { PolizaDocumentos } from "./PolizaDocumentos";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/fields";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconButton } from "@/components/ui/Icon";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableMessage,
  TableRow,
} from "@/components/ui/Table";

const MONEDA_LOCALE: Record<MonedaPoliza, string> = { DOP: "es-DO", USD: "en-US" };

function formatMonto(monto: number, moneda: MonedaPoliza) {
  return new Intl.NumberFormat(MONEDA_LOCALE[moneda], {
    style: "currency",
    currency: moneda,
  }).format(monto);
}

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es").format(new Date(fecha + "T00:00:00"));
}

function diasHasta(fecha: string) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fecha + "T00:00:00");
  return Math.round((vence.getTime() - hoy.getTime()) / 86400000);
}

function vencePronto(p: PolizaListItem) {
  return p.estado === "activa" && diasHasta(p.fecha_vencimiento) <= 7;
}

const ESTADO_TONE: Record<PolicyStatus, BadgeTone> = {
  activa: "green",
  vencida: "amber",
  cancelada: "neutral",
};

const ESTADO_LABELS: Record<PolicyStatus, string> = {
  activa: "Activa",
  vencida: "Vencida",
  cancelada: "Cancelada",
};

const COLS =
  "grid-cols-[130px_minmax(0,2fr)_minmax(0,1.3fr)_110px_130px_96px_140px]";

export function PolizasView({
  initialPolizas,
  clientes,
  aseguradoras,
  propietarios,
  oportunidades = [],
  puedeEditar,
}: {
  initialPolizas: PolizaListItem[];
  clientes: Option[];
  aseguradoras: Option[];
  propietarios: Option[];
  oportunidades?: { id: string; titulo: string }[];
  puedeEditar: boolean;
}) {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<PolicyStatus | "">("");
  const [aseguradoraId, setAseguradoraId] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PolizaListItem | null>(null);
  const [deleting, setDeleting] = useState<PolizaListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [renewingFrom, setRenewingFrom] = useState<PolizaListItem | null>(null);

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
    const nueva = await createPoliza(input);
    setCreating(false);
    invalidate();
    // Switch straight into edit mode so the user can attach documents
    // (cotización, contrato, etc.) without an extra click.
    setEditing(nueva);
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

  async function handleRenovar(input: PolizaInput) {
    if (!renewingFrom) return;
    const nueva = await renovarPoliza(renewingFrom.id, input);
    setRenewingFrom(null);
    invalidate();
    queryClient.invalidateQueries({ queryKey: ["tareas"] });
    // Same as a fresh "Nueva póliza": go straight to edit mode so
    // documents can be attached right away.
    setEditing(nueva);
  }

  const total = polizas?.length;
  const porVencer = polizas?.filter(vencePronto).length ?? 0;
  const descripcion =
    total === undefined
      ? undefined
      : `${total} ${total === 1 ? "póliza" : "pólizas"}${
          porVencer > 0
            ? ` · ${porVencer} ${porVencer === 1 ? "vence" : "vencen"} esta semana`
            : ""
        }`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pólizas"
        description={descripcion}
        actions={
          puedeEditar && <Button onClick={() => setCreating(true)}>Nueva póliza</Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          aria-label="Buscar por producto o número"
          placeholder="Buscar por producto o número…"
          value={search}
          onChange={(e) => setSearch(e.target.value)} fullWidth={false} className="flex-1"
        />
        <Select
          aria-label="Todos los estados"
          value={estado}
          onChange={(e) => setEstado(e.target.value as PolicyStatus | "")} fullWidth={false}
        >
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="vencida">Vencida</option>
          <option value="cancelada">Cancelada</option>
        </Select>
        <Select
          aria-label="Todas las aseguradoras"
          value={aseguradoraId}
          onChange={(e) => setAseguradoraId(e.target.value)} fullWidth={false}
        >
          <option value="">Todas las aseguradoras</option>
          {aseguradoras.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </Select>
      </div>

      <Table label="Pólizas" minWidth="min-w-[1040px]">
        <TableHeader cols={COLS}>
          <TableHead>Número</TableHead>
          <TableHead>Cliente y producto</TableHead>
          <TableHead>Aseguradora</TableHead>
          <TableHead>Vencimiento</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead srOnly>Acciones</TableHead>
        </TableHeader>
        {isLoading && <TableMessage>Cargando…</TableMessage>}
        {!isLoading && polizas?.length === 0 && (
          <TableMessage>No se encontraron pólizas.</TableMessage>
        )}
        {polizas?.map((p) => (
          <TableRow key={p.id} cols={COLS}>
            <TableCell>
              <Link
                href={`/polizas/${p.id}`}
                className="font-mono text-[13px] font-medium text-blue-700 hover:underline"
              >
                {p.numero_poliza}
              </Link>
            </TableCell>
            <TableCell className="flex flex-col gap-px">
              <span className="truncate font-semibold text-gray-900">
                {p.cliente?.nombre ?? "—"}
              </span>
              <span className="truncate text-[13px] text-gray-600">{p.producto}</span>
            </TableCell>
            <TableCell className="truncate text-gray-600">
              {p.aseguradora?.nombre ?? "—"}
            </TableCell>
            <TableCell
              className={
                vencePronto(p)
                  ? "tabular-nums font-semibold text-warning-700"
                  : "tabular-nums text-gray-900"
              }
            >
              {formatFecha(p.fecha_vencimiento)}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums text-gray-900">
              {formatMonto(p.monto, p.moneda)}
            </TableCell>
            <TableCell>
              <Badge tone={ESTADO_TONE[p.estado]}>{ESTADO_LABELS[p.estado]}</Badge>
            </TableCell>
            <TableCell className="flex items-center justify-end gap-1">
              {puedeEditar && (
                <>
                  <button
                    type="button"
                    onClick={() => setRenewingFrom(p)}
                    aria-label={`Renovar póliza ${p.numero_poliza}`}
                    className="mr-2 text-[13px] font-semibold text-blue-700 hover:underline"
                  >
                    Renovar
                  </button>
                  <IconButton
                    icon="pencil"
                    label={`Editar póliza ${p.numero_poliza}`}
                    onClick={() => setEditing(p)}
                  />
                  <IconButton
                    icon="trash"
                    tone="danger"
                    label={`Eliminar póliza ${p.numero_poliza}`}
                    onClick={() => setDeleting(p)}
                  />
                </>
              )}
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva póliza" size="lg">
        <PolizaForm
          clientes={clientes}
          aseguradoras={aseguradoras}
          propietarios={propietarios}
          oportunidades={oportunidades}
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Crear"
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar póliza" size="lg">
        {editing && (
          <>
            <PolizaForm
              clientes={clientes}
              aseguradoras={aseguradoras}
              propietarios={propietarios}
              oportunidades={oportunidades}
              defaultValues={{
                cliente_id: editing.cliente_id,
                aseguradora_id: editing.aseguradora_id,
                producto: editing.producto,
                numero_poliza: editing.numero_poliza,
                fecha_emision: editing.fecha_emision,
                fecha_vencimiento: editing.fecha_vencimiento,
                monto: editing.monto,
                moneda: editing.moneda,
                suma_asegurada: editing.suma_asegurada,
                deducible: editing.deducible,
                plan_pago: editing.plan_pago,
                estado: editing.estado,
                propietario_id: editing.propietario_id ?? "",
                oportunidad_id: editing.oportunidad_id ?? "",
                beneficiarios: editing.beneficiarios ?? "",
                notas: editing.notas ?? "",
                comision_tipo: editing.comision_tipo ?? "",
                comision_valor: editing.comision_valor,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
              submitLabel="Guardar cambios"
            />
            <div className="mt-6">
              <PolizaDocumentos polizaId={editing.id} />
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={!!renewingFrom}
        onClose={() => setRenewingFrom(null)}
        title={`Renovar póliza ${renewingFrom?.numero_poliza ?? ""}`}
        size="lg"
      >
        {renewingFrom && (
          <PolizaForm
            clientes={clientes}
            aseguradoras={aseguradoras}
            propietarios={propietarios}
            oportunidades={oportunidades}
            defaultValues={calcularRenovacion(renewingFrom)}
            onSubmit={handleRenovar}
            onCancel={() => setRenewingFrom(null)}
            submitLabel="Crear póliza renovada"
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
