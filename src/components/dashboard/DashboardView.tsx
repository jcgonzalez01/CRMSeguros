"use client";

import Link from "next/link";
import { useDashboard } from "@/lib/hooks/useDashboard";
import type { DashboardData } from "@/lib/queries/dashboard";
import type { MonedaPoliza } from "@/lib/types/database.types";
import { StatCard } from "./StatCard";

const MONEDA_LOCALE: Record<MonedaPoliza, string> = { DOP: "es-DO", USD: "en-US" };
const MONEDA_LABEL: Record<MonedaPoliza, string> = { DOP: "RD$", USD: "US$" };

function formatMonto(monto: number | null, moneda: MonedaPoliza = "DOP") {
  if (monto === null) return "—";
  return new Intl.NumberFormat(MONEDA_LOCALE[moneda], {
    style: "currency",
    currency: moneda,
  }).format(monto);
}

function formatFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es").format(new Date(fecha));
}

function PolizaList({ polizas }: { polizas: DashboardData["polizasVencenSemana"] }) {
  if (polizas.length === 0) {
    return <p className="text-sm text-gray-400 px-4 py-3">Sin pólizas.</p>;
  }
  return (
    <ul className="divide-y divide-gray-100">
      {polizas.map((p) => (
        <li key={p.id} className="px-4 py-3 flex items-center justify-between text-sm">
          <div>
            <Link
              href={`/clientes/${p.cliente_id}`}
              className="font-medium text-blue-600 hover:underline"
            >
              {p.cliente?.nombre ?? "—"}
            </Link>
            <p className="text-gray-500">
              {p.producto} · {p.aseguradora?.nombre ?? "—"}
            </p>
          </div>
          <span className="text-gray-600">{formatFecha(p.fecha_vencimiento)}</span>
        </li>
      ))}
    </ul>
  );
}

function TareaList({ tareas }: { tareas: DashboardData["tareasSemana"] }) {
  if (tareas.length === 0) {
    return <p className="text-sm text-gray-400 px-4 py-3">Sin tareas.</p>;
  }
  return (
    <ul className="divide-y divide-gray-100">
      {tareas.map((t) => (
        <li key={t.id} className="px-4 py-3 flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">{t.titulo}</p>
            <p className="text-gray-500">
              {t.asignado?.full_name ?? "Sin asignar"}
              {t.cliente ? ` · ${t.cliente.nombre}` : ""}
            </p>
          </div>
          <span className="text-gray-600">{formatFecha(t.fecha_limite)}</span>
        </li>
      ))}
    </ul>
  );
}

function OportunidadList({
  oportunidades,
}: {
  oportunidades: DashboardData["oportunidadesSemana"];
}) {
  if (oportunidades.length === 0) {
    return <p className="text-sm text-gray-400 px-4 py-3">Sin movimientos esta semana.</p>;
  }
  return (
    <ul className="divide-y divide-gray-100">
      {oportunidades.map((o) => (
        <li key={o.id} className="px-4 py-3 flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">{o.titulo}</p>
            <p className="text-gray-500">{o.cliente?.nombre ?? "—"}</p>
          </div>
          <span
            className={
              o.estado === "ganada"
                ? "text-green-600 font-medium"
                : "text-red-600 font-medium"
            }
          >
            {o.estado === "ganada" ? "Ganada" : "Perdida"} ·{" "}
            {formatMonto(o.monto_estimado ?? 0)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DashboardView({ initialData }: { initialData: DashboardData }) {
  const { data } = useDashboard(initialData);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Vencen esta semana"
          value={data.polizasVencenSemana.length}
          tone="warning"
        />
        <StatCard label="Ya vencidas" value={data.polizasVencidas.length} tone="danger" />
        <StatCard label="Tareas de la semana" value={data.tareasSemana.length} />
        <StatCard
          label="Tareas atrasadas"
          value={data.tareasAtrasadas.length}
          tone="danger"
        />
        {(() => {
          // moneda is NOT NULL in the DB (group by on a non-null enum
          // column); the view's generated type is just conservative.
          const filas = data.primaActivaPorMoneda.filter(
            (p): p is typeof p & { moneda: MonedaPoliza } => p.moneda !== null
          );
          if (filas.length === 0) {
            return <StatCard label="Prima total activa" value={formatMonto(0)} tone="success" />;
          }
          return filas.map((p) => (
            <StatCard
              key={p.moneda}
              label={`Prima total activa (${MONEDA_LABEL[p.moneda]})`}
              value={formatMonto(p.prima_total_activa, p.moneda)}
              tone="success"
            />
          ));
        })()}
        <StatCard
          label="Monto ganado"
          value={formatMonto(data.montoGanado)}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <h2 className="text-sm font-semibold px-4 py-3 border-b border-gray-100">
            Pólizas que vencen esta semana
          </h2>
          <PolizaList polizas={data.polizasVencenSemana} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <h2 className="text-sm font-semibold px-4 py-3 border-b border-gray-100">
            Pólizas vencidas
          </h2>
          <PolizaList polizas={data.polizasVencidas} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <h2 className="text-sm font-semibold px-4 py-3 border-b border-gray-100">
            Tareas de la semana
          </h2>
          <TareaList tareas={data.tareasSemana} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <h2 className="text-sm font-semibold px-4 py-3 border-b border-gray-100">
            Tareas atrasadas
          </h2>
          <TareaList tareas={data.tareasAtrasadas} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold px-4 py-3 border-b border-gray-100">
            Oportunidades ganadas/perdidas de la semana
          </h2>
          <OportunidadList oportunidades={data.oportunidadesSemana} />
        </div>
      </div>
    </div>
  );
}
