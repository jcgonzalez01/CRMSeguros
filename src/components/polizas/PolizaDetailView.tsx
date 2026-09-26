"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deletePoliza,
  renovarPoliza,
  updatePoliza,
  type PolizaInput,
} from "@/lib/actions/polizas";
import { calcularRenovacion } from "@/lib/polizas/renovar";
import type { MonedaPoliza, PolicyStatus } from "@/lib/types/database.types";
import type { getPoliza } from "@/lib/queries/polizas";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PolizaForm, type Option } from "./PolizaForm";
import { PolizaDocumentos } from "./PolizaDocumentos";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

type Poliza = Awaited<ReturnType<typeof getPoliza>>;

const MONEDA_LOCALE: Record<MonedaPoliza, string> = { DOP: "es-DO", USD: "en-US" };

function formatMonto(monto: number | null, moneda: MonedaPoliza) {
  if (monto === null) return "—";
  return new Intl.NumberFormat(MONEDA_LOCALE[moneda], {
    style: "currency",
    currency: moneda,
  }).format(monto);
}

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es").format(new Date(fecha + "T00:00:00"));
}

const MS_POR_DIA = 86400000;

function hoyLocal() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy.getTime();
}

function textoVigencia(dias: number, fechaVencimiento: string) {
  if (dias < 0) return dias === -1 ? "Venció ayer" : `Venció hace ${-dias} días`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  if (dias <= 30) return `Vence en ${dias} días`;
  return `Vence el ${formatFecha(fechaVencimiento)}`;
}

function progresoVigencia(emision: string, vencimiento: string) {
  const inicio = new Date(emision + "T00:00:00").getTime();
  const fin = new Date(vencimiento + "T00:00:00").getTime();
  if (fin <= inicio) return 100;
  return Math.min(100, Math.max(0, Math.round(((hoyLocal() - inicio) / (fin - inicio)) * 100)));
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

const PLAN_PAGO_LABELS: Record<PolizaInput["plan_pago"], string> = {
  unico: "Único",
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs font-medium text-gray-600">{label}</dt>
      <dd className="m-0 break-words text-sm font-medium text-gray-900">{children}</dd>
    </div>
  );
}

export function PolizaDetailView({
  poliza,
  clientes,
  aseguradoras,
  propietarios,
  oportunidades = [],
  puedeEditar,
}: {
  poliza: Poliza;
  clientes: Option[];
  aseguradoras: Option[];
  propietarios: Option[];
  oportunidades?: { id: string; titulo: string }[];
  puedeEditar: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const router = useRouter();
  const datosId = useId();
  const vigenciaId = useId();
  const notasId = useId();

  async function handleUpdate(input: PolizaInput) {
    await updatePoliza(poliza.id, input);
    setEditing(false);
    router.refresh();
  }

  async function handleRenovar(input: PolizaInput) {
    const nueva = await renovarPoliza(poliza.id, input);
    setRenewing(false);
    router.push(`/polizas/${nueva.id}`);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await deletePoliza(poliza.id, poliza.cliente_id);
      router.replace("/polizas");
    } finally {
      setDeleteLoading(false);
    }
  }

  const diasRestantes = Math.round(
    (new Date(poliza.fecha_vencimiento + "T00:00:00").getTime() - hoyLocal()) / MS_POR_DIA
  );
  const porVencer = diasRestantes <= 30;
  const progreso = progresoVigencia(poliza.fecha_emision, poliza.fecha_vencimiento);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3.5">
        <Link
          href="/polizas"
          className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-blue-700 hover:underline"
        >
          <Icon name="arrowLeft" size={14} strokeWidth={2.25} />
          Pólizas
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3.5">
              <h1 className="break-all font-mono text-[28px] font-semibold leading-tight tracking-tight text-gray-900">
                {poliza.numero_poliza}
              </h1>
              <Badge tone={ESTADO_TONE[poliza.estado]}>{ESTADO_LABELS[poliza.estado]}</Badge>
            </div>
            <p className="text-sm text-gray-600">
              {poliza.producto} · {poliza.aseguradora?.nombre ?? "—"}
            </p>
          </div>
          {puedeEditar && (
            <div className="flex items-center gap-2.5">
              <Button onClick={() => setRenewing(true)}>Renovar</Button>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Editar
              </Button>
              <Button variant="dangerOutline" onClick={() => setDeleting(true)}>
                Eliminar
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card aria-labelledby={datosId}>
          <CardHeader id={datosId} title="Datos de la póliza" />
          <dl className="m-0 grid grid-cols-2 gap-6 p-5 md:grid-cols-3">
            <Campo label="Cliente">
              {poliza.cliente ? (
                <Link
                  href={`/clientes/${poliza.cliente.id}`}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {poliza.cliente.nombre}
                </Link>
              ) : (
                "—"
              )}
            </Campo>
            <Campo label="Aseguradora">{poliza.aseguradora?.nombre ?? "—"}</Campo>
            <Campo label="Propietario">{poliza.propietario?.full_name ?? "Sin asignar"}</Campo>
            <Campo label="Oportunidad de origen">{poliza.oportunidad?.titulo ?? "—"}</Campo>
            <Campo label="Fecha de emisión">{formatFecha(poliza.fecha_emision)}</Campo>
            <Campo label="Fecha de vencimiento">{formatFecha(poliza.fecha_vencimiento)}</Campo>
            <Campo label="Plan de pago">{PLAN_PAGO_LABELS[poliza.plan_pago]}</Campo>
            <Campo label="Monto">{formatMonto(poliza.monto, poliza.moneda)}</Campo>
            <Campo label="Suma asegurada">
              {formatMonto(poliza.suma_asegurada, poliza.moneda)}
            </Campo>
            <Campo label="Deducible">{formatMonto(poliza.deducible, poliza.moneda)}</Campo>
            <Campo label="Comisión">
              {poliza.comision_monto === null ? (
                "—"
              ) : (
                <>
                  {formatMonto(poliza.comision_monto, poliza.moneda)}{" "}
                  <span className="font-normal text-gray-600">
                    ({poliza.comision_tipo === "porcentaje" ? `${poliza.comision_valor}%` : "fijo"})
                  </span>
                </>
              )}
            </Campo>
            <Campo label="Beneficiarios">{poliza.beneficiarios ?? "—"}</Campo>
          </dl>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          {poliza.estado === "activa" && (
            <section
              aria-labelledby={vigenciaId}
              className={[
                "flex flex-col gap-3 rounded-[14px] border px-5 py-5",
                porVencer
                  ? "border-warning-200 bg-warning-50"
                  : "border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2
                  id={vigenciaId}
                  className={`text-[15px] font-semibold ${porVencer ? "text-warning-700" : "text-gray-900"}`}
                >
                  Vigencia
                </h2>
                <span
                  className={`text-[13px] font-semibold ${porVencer ? "text-warning-700" : "text-gray-700"}`}
                >
                  {textoVigencia(diasRestantes, poliza.fecha_vencimiento)}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Tiempo transcurrido de la vigencia"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progreso}
                className={`h-2 overflow-hidden rounded ${porVencer ? "bg-warning-200" : "bg-gray-100"}`}
              >
                <div
                  className={`h-full ${porVencer ? "bg-amber-600" : "bg-blue-600"}`}
                  style={{ width: `${progreso}%` }}
                />
              </div>
              <div
                className={`flex justify-between gap-3 text-xs tabular-nums ${porVencer ? "text-warning-700" : "text-gray-600"}`}
              >
                <span>Emisión {formatFecha(poliza.fecha_emision)}</span>
                <span>Vence {formatFecha(poliza.fecha_vencimiento)}</span>
              </div>
              {puedeEditar && (
                <Button className="w-full" onClick={() => setRenewing(true)}>
                  Renovar ahora
                </Button>
              )}
            </section>
          )}

          <PolizaDocumentos polizaId={poliza.id} />

          {poliza.notas && (
            <Card aria-labelledby={notasId}>
              <CardHeader id={notasId} title="Notas" />
              <p className="whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-gray-700">
                {poliza.notas}
              </p>
            </Card>
          )}
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar póliza" size="lg">
        <PolizaForm
          clientes={clientes}
          aseguradoras={aseguradoras}
          propietarios={propietarios}
          oportunidades={oportunidades}
          defaultValues={{
            cliente_id: poliza.cliente_id,
            aseguradora_id: poliza.aseguradora_id,
            producto: poliza.producto,
            numero_poliza: poliza.numero_poliza,
            fecha_emision: poliza.fecha_emision,
            fecha_vencimiento: poliza.fecha_vencimiento,
            monto: poliza.monto,
            moneda: poliza.moneda,
            suma_asegurada: poliza.suma_asegurada,
            deducible: poliza.deducible,
            plan_pago: poliza.plan_pago,
            estado: poliza.estado,
            propietario_id: poliza.propietario_id ?? "",
            oportunidad_id: poliza.oportunidad_id ?? "",
            beneficiarios: poliza.beneficiarios ?? "",
            notas: poliza.notas ?? "",
            comision_tipo: poliza.comision_tipo ?? "",
            comision_valor: poliza.comision_valor,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Guardar cambios"
        />
      </Modal>

      <Modal
        open={renewing}
        onClose={() => setRenewing(false)}
        title={`Renovar póliza ${poliza.numero_poliza}`}
        size="lg"
      >
        <PolizaForm
          clientes={clientes}
          aseguradoras={aseguradoras}
          propietarios={propietarios}
          oportunidades={oportunidades}
          defaultValues={calcularRenovacion(poliza)}
          onSubmit={handleRenovar}
          onCancel={() => setRenewing(false)}
          submitLabel="Crear póliza renovada"
        />
      </Modal>

      <ConfirmDialog
        open={deleting}
        title="Eliminar póliza"
        message={`¿Seguro que quieres eliminar la póliza "${poliza.numero_poliza}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(false)}
      />
    </div>
  );
}
