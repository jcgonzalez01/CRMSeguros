"use client";

import { useMemo, useState, useId } from "react";
import { useComisiones, type ComisionPoliza } from "@/lib/hooks/useComisiones";
import type { MonedaPoliza } from "@/lib/types/database.types";
import { Input, Select } from "@/components/ui/fields";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  TableCell,
  TableHead,
  TableHeader,
  TableMessage,
  TableRow,
} from "@/components/ui/Table";

const COLS_RESUMEN = "grid-cols-[minmax(0,2fr)_120px_180px_160px]";
const COLS_DETALLE =
  "grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.8fr)_110px_130px_180px]";

const MONEDA_LOCALE: Record<MonedaPoliza, string> = { DOP: "es-DO", USD: "en-US" };

function formatMonto(monto: number, moneda: MonedaPoliza) {
  return new Intl.NumberFormat(MONEDA_LOCALE[moneda], {
    style: "currency",
    currency: moneda,
  }).format(monto);
}

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es").format(new Date(fecha));
}

interface Propietario {
  id: string;
  full_name: string;
}

interface ResumenFila {
  corredor: string;
  moneda: MonedaPoliza;
  cantidad: number;
  total: number;
}

function agruparPorCorredor(polizas: ComisionPoliza[]): ResumenFila[] {
  const mapa = new Map<string, ResumenFila>();
  for (const p of polizas) {
    if (p.comision_monto === null) continue;
    const corredor = p.propietario?.full_name ?? "Sin asignar";
    const key = `${corredor}::${p.moneda}`;
    const fila = mapa.get(key) ?? { corredor, moneda: p.moneda, cantidad: 0, total: 0 };
    fila.cantidad += 1;
    fila.total += p.comision_monto;
    mapa.set(key, fila);
  }
  return Array.from(mapa.values()).sort((a, b) => a.corredor.localeCompare(b.corredor));
}

export function ComisionesView({
  initialPolizas,
  propietarios,
}: {
  initialPolizas: ComisionPoliza[];
  propietarios: Propietario[];
}) {
  const uid = useId();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [propietarioId, setPropietarioId] = useState("");

  const filter = {
    desde: desde || undefined,
    hasta: hasta || undefined,
    propietarioId: propietarioId || undefined,
  };
  const { data: polizas, isLoading } = useComisiones(filter, initialPolizas);

  const resumen = useMemo(() => agruparPorCorredor(polizas ?? []), [polizas]);

  const maxPorMoneda = useMemo(() => {
    const max: Partial<Record<MonedaPoliza, number>> = {};
    for (const f of resumen) max[f.moneda] = Math.max(max[f.moneda] ?? 0, f.total);
    return max;
  }, [resumen]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold text-gray-900">Comisiones</h2>
          <p className="text-sm text-gray-600">
            Seguimiento de qué pólizas vende cada corredor y su comisión.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${uid}-1`} className="text-xs font-medium text-gray-600">
              Emitidas desde
            </label>
            <Input
              id={`${uid}-1`}
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              fullWidth={false}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${uid}-2`} className="text-xs font-medium text-gray-600">
              Hasta
            </label>
            <Input
              id={`${uid}-2`}
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              fullWidth={false}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${uid}-3`} className="text-xs font-medium text-gray-600">
              Corredor
            </label>
            <Select
              id={`${uid}-3`}
              value={propietarioId}
              onChange={(e) => setPropietarioId(e.target.value)}
              fullWidth={false}
            >
              <option value="">Todos los corredores</option>
              {propietarios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Card aria-labelledby={`${uid}-resumen`} className="overflow-hidden">
        <CardHeader id={`${uid}-resumen`} title="Resumen por corredor" />
        <div className="overflow-x-auto">
          <div role="table" aria-label="Resumen por corredor" className="min-w-[720px]">
            <TableHeader cols={COLS_RESUMEN}>
              <TableHead>Corredor</TableHead>
              <TableHead className="text-right">Pólizas</TableHead>
              <TableHead className="text-right">Comisión total</TableHead>
              <TableHead>Participación</TableHead>
            </TableHeader>
            {resumen.length === 0 && (
              <TableMessage>Sin comisiones registradas en este periodo.</TableMessage>
            )}
            {resumen.map((fila) => {
              const max = maxPorMoneda[fila.moneda] ?? 0;
              const pct = max > 0 ? Math.round((fila.total / max) * 100) : 0;
              return (
                <TableRow key={`${fila.corredor}-${fila.moneda}`} cols={COLS_RESUMEN}>
                  <TableCell className="truncate font-semibold text-gray-900">
                    {fila.corredor}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fila.cantidad}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-gray-900">
                    {formatMonto(fila.total, fila.moneda)}
                  </TableCell>
                  <TableCell>
                    <span
                      aria-hidden="true"
                      className="block h-2 overflow-hidden rounded bg-gray-200"
                    >
                      <span
                        className="block h-full bg-blue-600"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </div>
        </div>
      </Card>

      <Card aria-labelledby={`${uid}-detalle`} className="overflow-hidden">
        <CardHeader id={`${uid}-detalle`} title="Detalle por póliza" />
        <div className="overflow-x-auto">
          <div role="table" aria-label="Detalle por póliza" className="min-w-[1000px]">
            <TableHeader cols={COLS_DETALLE}>
              <TableHead>Corredor</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Póliza</TableHead>
              <TableHead>Emisión</TableHead>
              <TableHead className="text-right">Monto póliza</TableHead>
              <TableHead className="text-right">Comisión</TableHead>
            </TableHeader>
            {isLoading && <TableMessage>Cargando…</TableMessage>}
            {!isLoading && polizas?.length === 0 && (
              <TableMessage>No se encontraron pólizas en este periodo.</TableMessage>
            )}
            {polizas?.map((p) => (
              <TableRow key={p.id} cols={COLS_DETALLE}>
                <TableCell className="truncate text-gray-600">
                  {p.propietario?.full_name ?? "Sin asignar"}
                </TableCell>
                <TableCell className="truncate font-medium text-gray-900">
                  {p.cliente?.nombre ?? "—"}
                </TableCell>
                <TableCell className="truncate">
                  <span className="font-mono text-[13px] text-blue-700">{p.numero_poliza}</span>
                  <span className="text-gray-600"> · {p.aseguradora?.nombre ?? "—"}</span>
                </TableCell>
                <TableCell className="tabular-nums">{formatFecha(p.fecha_emision)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMonto(p.monto, p.moneda)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {p.comision_monto === null ? (
                    <span className="text-gray-600">—</span>
                  ) : (
                    <>
                      <span className="font-semibold text-gray-900">
                        {formatMonto(p.comision_monto, p.moneda)}
                      </span>
                      <span className="text-gray-600">
                        {" "}
                        ({p.comision_tipo === "porcentaje" ? `${p.comision_valor}%` : "fijo"})
                      </span>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
