"use client";

import { useMemo, useState } from "react";
import { useReportes } from "@/lib/hooks/useReportes";
import type { ComisionPoliza } from "@/lib/hooks/useComisiones";
import type { MonedaPoliza } from "@/lib/types/database.types";
import { BarChart, type BarChartDatum } from "./BarChart";
import { StatTileDelta } from "./StatTileDelta";
import { ComisionesView } from "@/components/comisiones/ComisionesView";

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

function monthLabel(mes: string) {
  return new Intl.DateTimeFormat("es", { month: "short", year: "2-digit" }).format(
    new Date(mes + "T00:00:00")
  );
}

function tasaConversion(ganadas: number, perdidas: number) {
  const total = ganadas + perdidas;
  return total === 0 ? 0 : (ganadas / total) * 100;
}

export function ReportesView({
  initialReporte,
  initialMeses,
  initialPolizasComision,
  propietarios,
}: {
  initialReporte: ReturnType<typeof useReportes>["data"];
  initialMeses: number;
  initialPolizasComision: ComisionPoliza[];
  propietarios: { id: string; full_name: string }[];
}) {
  const [tab, setTab] = useState<"tendencias" | "comisiones">("tendencias");
  const [meses, setMeses] = useState(initialMeses);
  const [monedaPrimas, setMonedaPrimas] = useState<MonedaPoliza>("DOP");

  const { data: reporte } = useReportes(
    meses,
    meses === initialMeses ? initialReporte : undefined
  );

  const filas = useMemo(() => reporte ?? [], [reporte]);
  const actual = filas[filas.length - 1];
  const anterior = filas[filas.length - 2];

  const charts = useMemo(() => {
    const polizas: BarChartDatum[] = filas.map((f) => ({
      label: monthLabel(f.mes),
      value: f.polizas_vendidas,
    }));
    const primas: BarChartDatum[] = filas.map((f) => ({
      label: monthLabel(f.mes),
      value: monedaPrimas === "DOP" ? f.primas_dop : f.primas_usd,
    }));
    const clientes: BarChartDatum[] = filas.map((f) => ({
      label: monthLabel(f.mes),
      value: f.clientes_nuevos,
    }));
    const conversion: BarChartDatum[] = filas.map((f) => ({
      label: monthLabel(f.mes),
      value: Math.round(tasaConversion(f.oportunidades_ganadas, f.oportunidades_perdidas)),
    }));
    return { polizas, primas, clientes, conversion };
  }, [filas, monedaPrimas]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tendencias del negocio y comisiones por corredor.
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(
          [
            { key: "tendencias", label: "Tendencias" },
            { key: "comisiones", label: "Comisiones" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tendencias" && (
        <div>
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
              value={monedaPrimas}
              onChange={(e) => setMonedaPrimas(e.target.value as MonedaPoliza)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-fit"
            >
              <option value="DOP">Primas en RD$</option>
              <option value="USD">Primas en US$</option>
            </select>
          </div>

          {actual && anterior && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              <StatTileDelta
                label="Pólizas vendidas"
                value={String(actual.polizas_vendidas)}
                actual={actual.polizas_vendidas}
                anterior={anterior.polizas_vendidas}
              />
              <StatTileDelta
                label="Primas (RD$)"
                value={formatMonto(actual.primas_dop, "DOP")}
                actual={actual.primas_dop}
                anterior={anterior.primas_dop}
              />
              <StatTileDelta
                label="Clientes nuevos"
                value={String(actual.clientes_nuevos)}
                actual={actual.clientes_nuevos}
                anterior={anterior.clientes_nuevos}
              />
              <StatTileDelta
                label="Conversión"
                value={`${tasaConversion(actual.oportunidades_ganadas, actual.oportunidades_perdidas).toFixed(0)}%`}
                actual={tasaConversion(actual.oportunidades_ganadas, actual.oportunidades_perdidas)}
                anterior={tasaConversion(anterior.oportunidades_ganadas, anterior.oportunidades_perdidas)}
              />
              <StatTileDelta
                label="Tareas completadas"
                value={`${actual.tareas_completadas}/${actual.tareas_totales}`}
                actual={actual.tareas_completadas}
                anterior={anterior.tareas_completadas}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Pólizas vendidas por mes
              </h2>
              <BarChart data={charts.polizas} color="#2a78d6" formatValue={(v) => String(v)} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Primas por mes</h2>
              <BarChart
                data={charts.primas}
                color="#1baf7a"
                formatValue={(v) => formatMonto(v, monedaPrimas)}
              />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Clientes nuevos por mes
              </h2>
              <BarChart data={charts.clientes} color="#eda100" formatValue={(v) => String(v)} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Tasa de conversión por mes
              </h2>
              <BarChart
                data={charts.conversion}
                color="#4a3aa7"
                formatValue={(v) => `${v}%`}
              />
            </div>
          </div>
        </div>
      )}

      {tab === "comisiones" && (
        <ComisionesView initialPolizas={initialPolizasComision} propietarios={propietarios} />
      )}
    </div>
  );
}
