"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getReporteMensual } from "@/lib/queries/reportes";
import { useRealtimeTable } from "./useRealtimeTable";

export type ReporteMensualRow = Awaited<ReturnType<typeof getReporteMensual>>[number];

export function useReportes(meses: number, initialData?: ReporteMensualRow[]) {
  useRealtimeTable("polizas", ["reporte-mensual", meses]);
  useRealtimeTable("clientes", ["reporte-mensual", meses]);
  useRealtimeTable("oportunidades", ["reporte-mensual", meses]);
  useRealtimeTable("tareas", ["reporte-mensual", meses]);

  return useQuery({
    queryKey: ["reporte-mensual", meses],
    queryFn: () => getReporteMensual(createClient(), meses),
    initialData,
  });
}
