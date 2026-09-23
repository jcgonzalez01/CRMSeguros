"use client";

import { useState } from "react";
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
  return new Intl.DateTimeFormat("es").format(new Date(fecha));
}

const ESTADO_BADGE: Record<PolicyStatus, string> = {
  activa: "bg-green-100 text-green-800",
  vencida: "bg-amber-100 text-amber-800",
  cancelada: "bg-gray-100 text-gray-600",
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
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{children}</p>
    </div>
  );
}

export function PolizaDetailView({
  poliza,
  clientes,
  aseguradoras,
  propietarios,
  puedeEditar,
}: {
  poliza: Poliza;
  clientes: Option[];
  aseguradoras: Option[];
  propietarios: Option[];
  puedeEditar: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const router = useRouter();

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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/polizas" className="text-sm text-blue-600 hover:underline">
          ← Pólizas
        </Link>
        <div className="flex items-start justify-between mt-1">
          <div>
            <h1 className="text-2xl font-semibold">{poliza.numero_poliza}</h1>
            <p className="text-sm text-gray-500">
              {poliza.producto} · {poliza.aseguradora?.nombre ?? "—"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${ESTADO_BADGE[poliza.estado]}`}
            >
              {ESTADO_LABELS[poliza.estado]}
            </span>
            {puedeEditar && (
              <>
                <button
                  onClick={() => setRenewing(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Renovar
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleting(true)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Campo label="Cliente">
          {poliza.cliente ? (
            <Link
              href={`/clientes/${poliza.cliente.id}`}
              className="text-blue-600 hover:underline"
            >
              {poliza.cliente.nombre}
            </Link>
          ) : (
            "—"
          )}
        </Campo>
        <Campo label="Aseguradora">{poliza.aseguradora?.nombre ?? "—"}</Campo>
        <Campo label="Propietario">{poliza.propietario?.full_name ?? "Sin asignar"}</Campo>
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
              <span className="text-gray-400 font-normal">
                ({poliza.comision_tipo === "porcentaje" ? `${poliza.comision_valor}%` : "fijo"})
              </span>
            </>
          )}
        </Campo>
        <Campo label="Beneficiarios">{poliza.beneficiarios ?? "—"}</Campo>
      </div>

      {poliza.notas && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Notas</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{poliza.notas}</p>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
        <PolizaDocumentos polizaId={poliza.id} />
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar póliza">
        <PolizaForm
          clientes={clientes}
          aseguradoras={aseguradoras}
          propietarios={propietarios}
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
      >
        <PolizaForm
          clientes={clientes}
          aseguradoras={aseguradoras}
          propietarios={propietarios}
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
