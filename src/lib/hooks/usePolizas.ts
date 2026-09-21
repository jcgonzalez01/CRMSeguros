"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { listPolizas, type PolizasFilter } from "@/lib/queries/polizas";
import { useRealtimeTable } from "./useRealtimeTable";

export type PolizaListItem = Awaited<ReturnType<typeof listPolizas>>[number];

export function usePolizas(filter: PolizasFilter, initialData?: PolizaListItem[]) {
  useRealtimeTable("polizas", ["polizas", filter]);

  const isDefaultFilter = !filter.search && !filter.estado && !filter.aseguradoraId;

  return useQuery({
    queryKey: ["polizas", filter],
    queryFn: () => listPolizas(createClient(), filter),
    initialData: isDefaultFilter ? initialData : undefined,
  });
}
