"use client";

import { useMemo, useState } from "react";
import { useReportes, type PolizaTendenciaRow } from "@/lib/hooks/useReportes";
import type { MonedaPoliza } from "@/lib/types/database.types";
import { BarChart, type BarChartDatum } from "./BarChart";

const RANGOS = [
  { meses: 6, label: "6 meses" },
  { meses: 12, label: "12 meses" },
  { meses: 24, label: "24 meses" },
] as const;

const MONEDA_LOCALE: Record<MonedaPoliza, string> = { DOP: "es-DO", USD: "en-US" };

function formatMonto(monto: number, moneda: MonedaPoliza) {
  return new Intl.NumberFormat(MONEDA_LOCALE[moneda], {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("es", { month: "short", year: "2-digit" }).format(date);
}

// Every month in the window, even ones with zero pólizas — an omitted
// month would understate a slow period instead of showing it as zero.
function buildMonthBuckets(meses: number) {
  const buckets: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), label: monthLabel(d) });
  }
  return buckets;
}

function aggregarPorMes(
  polizas: PolizaTendenciaRow[],
  buckets: { key: string; label: string }[],
  moneda: MonedaPoliza
): { conteo: BarChartDatum[]; primas: BarChartDatum[] } {
  const conteoPorMes = new Map(buckets.map((b) => [b.key, 0]));
  const primasPorMes = new Map(buckets.map((b) => [b.key, 0]));

  for (const p of polizas) {
    const key = p.fecha_emision.slice(0, 7);
    if (conteoPorMes.has(key)) {
      conteoPorMes.set(key, (conteoPorMes.get(key) ?? 0) + 1);
    }
    if (p.moneda === moneda && primasPorMes.has(key)) {
      primasPorMes.set(key, (primasPorMes.get(key) ?? 0) + p.monto);
    }
  }

  return {
    conteo: buckets.map((b) => ({ label: b.label, value: conteoPorMes.get(b.key) ?? 0 })),
    primas: buckets.map((b) => ({ label: b.label, value: primasPorMes.get(b.key) ?? 0 })),
  };
}

export function ReportesView({
  initialPolizas,
  initialMeses,
}: {
  initialPolizas: PolizaTendenciaRow[];
  initialMeses: number;
}) {
  const [meses, setMeses] = useState(initialMeses);
  const [moneda, setMoneda] = useState<MonedaPoliza>("DOP");

  const buckets = useMemo(() => buildMonthBuckets(meses), [meses]);
  const desde = buckets[0].key + "-01";

  const { data: polizas, isLoading } = useReportes(
    desde,
    meses === initialMeses ? initialPolizas : undefined
  );

  const { conteo, primas } = useMemo(
    () => aggregarPorMes(polizas ?? [], buckets, moneda),
    [polizas, buckets, moneda]
  );

  const totalPolizas = conteo.reduce((sum, d) => sum + d.value, 0);
  const totalPrimas = primas.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tendencias de pólizas vendidas y primas en el tiempo.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex rounded-md border border-gray-300 overflow-hidden w-fit">
          {RANGOS.map((r) => (
            <button
              key={r.meses}
              onClick={() => setMeses(r.meses)}
              className={`px-3 py-1.5 text-sm font-medium ${
                meses === r.meses
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <select
          value={moneda}
          onChange={(e) => setMoneda(e.target.value as MonedaPoliza)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-fit"
        >
          <option value="DOP">Primas en RD$</option>
          <option value="USD">Primas en US$</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Pólizas vendidas por mes
            </h2>
            <span className="text-sm text-gray-500">{totalPolizas} en total</span>
          </div>
          {isLoading ? (
            <p className="text-sm text-gray-400 h-56 flex items-center justify-center">
              Cargando…
            </p>
          ) : (
            <BarChart data={conteo} color="#2a78d6" formatValue={(v) => String(v)} />
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Primas por mes</h2>
            <span className="text-sm text-gray-500">
              {formatMonto(totalPrimas, moneda)} en total
            </span>
          </div>
          {isLoading ? (
            <p className="text-sm text-gray-400 h-56 flex items-center justify-center">
              Cargando…
            </p>
          ) : (
            <BarChart
              data={primas}
              color="#1baf7a"
              formatValue={(v) => formatMonto(v, moneda)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
