"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { listOportunidades, type OportunidadesFilter } from "@/lib/queries/oportunidades";
import { useRealtimeTable } from "./useRealtimeTable";

export type OportunidadListItem = Awaited<
  ReturnType<typeof listOportunidades>
>[number];

export function useOportunidades(
  filter: OportunidadesFilter,
  initialData?: OportunidadListItem[]
) {
  useRealtimeTable("oportunidades", ["oportunidades", filter]);

  const isDefaultFilter = !filter.search && !filter.estado;

  return useQuery({
    queryKey: ["oportunidades", filter],
    queryFn: () => listOportunidades(createClient(), filter),
    initialData: isDefaultFilter ? initialData : undefined,
  });
}
