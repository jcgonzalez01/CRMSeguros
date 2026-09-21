"use client";

import { useMemo, useState } from "react";
import { useComisiones, type ComisionPoliza } from "@/lib/hooks/useComisiones";
import type { MonedaPoliza } from "@/lib/types/database.types";

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

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Comisiones</h1>
        <p className="text-sm text-gray-500 mt-1">
          Seguimiento de qué pólizas vende cada corredor y su comisión.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Emitidas desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Corredor</label>
          <select
            value={propietarioId}
            onChange={(e) => setPropietarioId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los corredores</option>
            {propietarios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm mb-6">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Corredor</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Pólizas</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Comisión total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resumen.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Sin comisiones registradas en este periodo.
                </td>
              </tr>
            )}
            {resumen.map((fila) => (
              <tr key={`${fila.corredor}-${fila.moneda}`}>
                <td className="px-4 py-2 font-medium">{fila.corredor}</td>
                <td className="px-4 py-2">{fila.cantidad}</td>
                <td className="px-4 py-2 font-medium">
                  {formatMonto(fila.total, fila.moneda)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold mb-2">Detalle por póliza</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Corredor</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden sm:table-cell">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden md:table-cell">Póliza</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Emisión</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden sm:table-cell">Monto póliza</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Comisión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && polizas?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No se encontraron pólizas en este periodo.
                </td>
              </tr>
            )}
            {polizas?.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">{p.propietario?.full_name ?? "Sin asignar"}</td>
                <td className="px-4 py-2 hidden sm:table-cell">{p.cliente?.nombre ?? "—"}</td>
                <td className="px-4 py-2 hidden md:table-cell">
                  {p.numero_poliza} · {p.aseguradora?.nombre ?? "—"}
                </td>
                <td className="px-4 py-2">{formatFecha(p.fecha_emision)}</td>
                <td className="px-4 py-2 hidden sm:table-cell">
                  {formatMonto(p.monto, p.moneda)}
                </td>
                <td className="px-4 py-2">
                  {p.comision_monto === null ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <>
                      {formatMonto(p.comision_monto, p.moneda)}
                      <span className="text-gray-400">
                        {" "}
                        ({p.comision_tipo === "porcentaje" ? `${p.comision_valor}%` : "fijo"})
                      </span>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
