"use client";

import { useMemo, useState } from "react";
import { useReportes } from "@/lib/hooks/useReportes";
import type { ComisionPoliza } from "@/lib/hooks/useComisiones";
import type { MonedaPoliza } from "@/lib/types/database.types";
import { BarChart, type BarChartDatum } from "./BarChart";
import { StatTileDelta } from "./StatTileDelta";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented, Tabs } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/fields";
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

  const grafica = (
    titulo: string,
    data: BarChartDatum[],
    color: string,
    formatValue: (v: number) => string
  ) => {
    const ultimo = data[data.length - 1];
    return (
      <Card className="flex flex-col gap-3.5 px-[22px] pb-4 pt-[18px]">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-gray-900">{titulo}</h2>
          {ultimo && (
            <span className="text-xs text-gray-600">
              Último mes: {formatValue(ultimo.value)}
            </span>
          )}
        </div>
        <BarChart data={data} color={color} formatValue={formatValue} />
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reportes"
        description="Tendencias del negocio y comisiones por corredor."
      />

      <Tabs
        label="Secciones de reportes"
        items={[
          { value: "tendencias", label: "Tendencias" },
          { value: "comisiones", label: "Comisiones" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "tendencias" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Segmented
              label="Periodo"
              items={RANGOS.map((r) => ({ value: r.meses, label: r.label }))}
              value={meses}
              onChange={setMeses}
            />
            <Select
              aria-label="Moneda de las primas"
              value={monedaPrimas}
              onChange={(e) => setMonedaPrimas(e.target.value as MonedaPoliza)}
              fullWidth={false}
            >
              <option value="DOP">Primas en RD$</option>
              <option value="USD">Primas en US$</option>
            </Select>
          </div>

          {actual && anterior && (
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {grafica("Pólizas vendidas por mes", charts.polizas, "#2a78d6", (v) => String(v))}
            {grafica("Primas por mes", charts.primas, "#1baf7a", (v) => formatMonto(v, monedaPrimas))}
            {grafica("Clientes nuevos por mes", charts.clientes, "#eda100", (v) => String(v))}
            {grafica("Tasa de conversión por mes", charts.conversion, "#4a3aa7", (v) => `${v}%`)}
          </div>
        </div>
      )}

      {tab === "comisiones" && (
        <ComisionesView initialPolizas={initialPolizasComision} propietarios={propietarios} />
      )}
    </div>
  );
}
