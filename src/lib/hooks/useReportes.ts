"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { listPolizasParaTendencias } from "@/lib/queries/reportes";
import { useRealtimeTable } from "./useRealtimeTable";

export type PolizaTendenciaRow = Awaited<
  ReturnType<typeof listPolizasParaTendencias>
>[number];

export function useReportes(desde: string, initialData?: PolizaTendenciaRow[]) {
  useRealtimeTable("polizas", ["reportes-tendencias", desde]);

  return useQuery({
    queryKey: ["reportes-tendencias", desde],
    queryFn: () => listPolizasParaTendencias(createClient(), desde),
    initialData,
  });
}
