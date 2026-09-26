"use client";

import Link from "next/link";
import { useDashboard } from "@/lib/hooks/useDashboard";
import type { DashboardData } from "@/lib/queries/dashboard";
import type { MonedaPoliza } from "@/lib/types/database.types";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "./StatCard";

const MONEDA_LOCALE: Record<MonedaPoliza, string> = {
  DOP: "es-DO",
  USD: "en-US",
};

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

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

function pluralDias(n: number) {
  return `${n} ${n === 1 ? "día" : "días"}`;
}

function startOfLocalDay(fecha: string | null) {
  if (!fecha) return null;
  const [y, m, d] = fecha.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Días transcurridos desde `fecha` hasta hoy (negativo si es futura), en zona local. */
function diasDesde(fecha: string | null) {
  const target = startOfLocalDay(fecha);
  if (!target) return null;
  const now = new Date();
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((hoy.getTime() - target.getTime()) / 86_400_000);
}

function rangoSemana() {
  const now = new Date();
  const lunes = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const inicio =
    lunes.getMonth() === domingo.getMonth()
      ? `${lunes.getDate()}`
      : `${lunes.getDate()} de ${MESES[lunes.getMonth()]}`;
  return `Semana del ${inicio} al ${domingo.getDate()} de ${MESES[domingo.getMonth()]}`;
}

function haceDias(fecha: string | null) {
  const n = diasDesde(fecha);
  if (n === null) return null;
  if (n <= 0) return "hoy";
  return `hace ${pluralDias(n)}`;
}

function diasDeAtraso(fecha: string | null) {
  const n = diasDesde(fecha);
  if (n === null) return null;
  if (n <= 0) return "hoy";
  return `${pluralDias(n)} de atraso`;
}

function venceEn(fecha: string | null) {
  const n = diasDesde(fecha);
  if (n === null) return null;
  const restan = -n;
  if (restan <= 0) return "Vence hoy";
  if (restan === 1) return "Vence mañana";
  return `En ${restan} días`;
}

const FILA =
  "flex items-center justify-between gap-4 border-t border-gray-100 py-3";
const CHIP_ROJO =
  "whitespace-nowrap rounded-full border border-danger-200 bg-danger-50 px-2.5 py-[3px] text-xs font-semibold text-danger-700";

function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-4 text-sm text-gray-600">{children}</p>;
}

function PolizasVencenList({
  polizas,
}: {
  polizas: DashboardData["polizasVencenSemana"];
}) {
  if (polizas.length === 0) return <Vacio>Sin pólizas.</Vacio>;
  return (
    <ul className="px-5 pb-2 pt-1">
      {polizas.map((p) => (
        <li key={p.id} className={FILA}>
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={`/clientes/${p.cliente_id}`}
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              {p.cliente?.nombre ?? "—"}
            </Link>
            <span className="text-[13px] text-gray-600">
              {p.producto} · {p.aseguradora?.nombre ?? "—"}
            </span>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="text-[13px] font-semibold tabular-nums text-gray-900">
              {formatFecha(p.fecha_vencimiento)}
            </span>
            <span className="text-xs text-gray-600">
              {venceEn(p.fecha_vencimiento)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PolizasVencidasList({
  polizas,
}: {
  polizas: DashboardData["polizasVencidas"];
}) {
  return (
    <ul>
      {polizas.map((p) => (
        <li key={p.id} className={FILA}>
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={`/clientes/${p.cliente_id}`}
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              {p.cliente?.nombre ?? "—"}
            </Link>
            <span className="text-[13px] text-gray-600">
              {p.producto} · {p.aseguradora?.nombre ?? "—"}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
            <span className={CHIP_ROJO}>{haceDias(p.fecha_vencimiento)}</span>
            <Link
              href={`/polizas/${p.id}`}
              className={buttonClasses("secondary", "sm")}
            >
              Renovar
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TareasAtrasadasList({
  tareas,
}: {
  tareas: DashboardData["tareasAtrasadas"];
}) {
  return (
    <ul>
      {tareas.map((t) => (
        <li key={t.id} className={FILA}>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold text-gray-900">
              {t.titulo}
            </span>
            <span className="text-[13px] text-gray-600">
              {t.asignado?.full_name ?? "Sin asignar"}
              {t.cliente ? ` · ${t.cliente.nombre}` : ""}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
            <span className={CHIP_ROJO}>{diasDeAtraso(t.fecha_limite)}</span>
            <Link href="/tareas" className={buttonClasses("secondary", "sm")}>
              Ver tarea
            </Link>
          </div>
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
  if (oportunidades.length === 0)
    return <Vacio>Sin movimientos esta semana.</Vacio>;
  return (
    <ul className="px-5 pb-2 pt-1">
      {oportunidades.map((o) => (
        <li key={o.id} className={FILA}>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold text-gray-900">
              {o.titulo}
            </span>
            <span className="text-[13px] text-gray-600">
              {o.cliente?.nombre ?? "—"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm font-semibold tabular-nums text-gray-900">
              {formatMonto(o.monto_estimado ?? 0)}
            </span>
            <Badge
              tone={o.estado === "ganada" ? "green" : "red"}
              className="w-[72px] justify-center"
            >
              {o.estado === "ganada" ? "Ganada" : "Perdida"}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DashboardView({ initialData }: { initialData: DashboardData }) {
  const { data } = useDashboard(initialData);

  const requierenAtencion =
    data.polizasVencidas.length + data.tareasAtrasadas.length;
  const descripcion =
    requierenAtencion > 0
      ? `${rangoSemana()} · ${requierenAtencion} ${
          requierenAtencion === 1 ? "elemento requiere" : "elementos requieren"
        } atención hoy`
      : rangoSemana();

  // moneda is NOT NULL in the DB (group by on a non-null enum
  // column); the view's generated type is just conservative.
  const filas = data.primaActivaPorMoneda.filter(
    (p): p is typeof p & { moneda: MonedaPoliza } => p.moneda !== null,
  );
  const principal = filas.find((p) => p.moneda === "DOP");
  const otras = filas.filter((p) => p.moneda !== "DOP");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description={descripcion} />

      <section
        aria-label="Resumen"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <StatCard
          label="Prima total activa"
          value={formatMonto(principal?.prima_total_activa ?? 0)}
        >
          {otras.map((p) => (
            <p
              key={p.moneda}
              className="text-[13px] tabular-nums text-gray-600"
            >
              y {formatMonto(p.prima_total_activa, p.moneda)} en pólizas en
              dólares
            </p>
          ))}
        </StatCard>
        <StatCard
          label="Monto ganado"
          value={formatMonto(data.montoGanado)}
          tone="success"
        />
        <StatCard
          label="Tareas de la semana"
          value={data.tareasSemana.length}
        />
      </section>

      {requierenAtencion > 0 && (
        <Card
          aria-labelledby="atencion"
          className="overflow-hidden border-danger-200"
        >
          <div className="flex items-center gap-2.5 border-b border-danger-200 bg-danger-50 px-5 py-4">
            <span className="text-danger-700">
              <Icon name="alert" size={18} />
            </span>
            <h2
              id="atencion"
              className="text-[15px] font-semibold text-danger-700"
            >
              Requiere atención hoy
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="px-5 pb-3 pt-2 md:border-r md:border-gray-100">
              <h3 className="mb-1 mt-3 text-xs font-semibold uppercase tracking-[0.06em] text-gray-600">
                Pólizas vencidas · {data.polizasVencidas.length}
              </h3>
              {data.polizasVencidas.length === 0 ? (
                <p className="border-t border-gray-100 py-3 text-sm text-gray-600">
                  Sin pólizas.
                </p>
              ) : (
                <PolizasVencidasList polizas={data.polizasVencidas} />
              )}
            </div>
            <div className="px-5 pb-3 pt-2">
              <h3 className="mb-1 mt-3 text-xs font-semibold uppercase tracking-[0.06em] text-gray-600">
                Tareas atrasadas · {data.tareasAtrasadas.length}
              </h3>
              {data.tareasAtrasadas.length === 0 ? (
                <p className="border-t border-gray-100 py-3 text-sm text-gray-600">
                  Sin tareas.
                </p>
              ) : (
                <TareasAtrasadasList tareas={data.tareasAtrasadas} />
              )}
            </div>
          </div>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Vencen esta semana"
            action={
              <Badge tone="amber">
                {data.polizasVencenSemana.length}{" "}
                {data.polizasVencenSemana.length === 1 ? "póliza" : "pólizas"}
              </Badge>
            }
          />
          <PolizasVencenList polizas={data.polizasVencenSemana} />
        </Card>

        <Card>
          <CardHeader
            title="Oportunidades de la semana"
            action={
              <Link
                href="/oportunidades"
                className="text-[13px] font-semibold text-blue-700 hover:underline"
              >
                Ver todas
              </Link>
            }
          />
          <OportunidadList oportunidades={data.oportunidadesSemana} />
        </Card>
      </section>
    </div>
  );
}
