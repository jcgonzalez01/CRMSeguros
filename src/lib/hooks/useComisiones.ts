"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { listPolizasComision, type ComisionesFilter } from "@/lib/queries/comisiones";
import { useRealtimeTable } from "./useRealtimeTable";

export type ComisionPoliza = Awaited<ReturnType<typeof listPolizasComision>>[number];

export function useComisiones(
  filter: ComisionesFilter,
  initialData?: ComisionPoliza[]
) {
  useRealtimeTable("polizas", ["comisiones", filter]);

  const isDefaultFilter = !filter.desde && !filter.hasta && !filter.propietarioId;

  return useQuery({
    queryKey: ["comisiones", filter],
    queryFn: () => listPolizasComision(createClient(), filter),
    initialData: isDefaultFilter ? initialData : undefined,
  });
}
