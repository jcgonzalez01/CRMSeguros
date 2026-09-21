"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { listClientes, type ClientesFilter } from "@/lib/queries/clientes";
import { useRealtimeTable } from "./useRealtimeTable";

export type ClienteListItem = Awaited<ReturnType<typeof listClientes>>[number];

export function useClientes(
  filter: ClientesFilter,
  initialData?: ClienteListItem[]
) {
  useRealtimeTable("clientes", ["clientes", filter]);

  const isDefaultFilter = !filter.search && !filter.propietarioId;

  return useQuery({
    queryKey: ["clientes", filter],
    queryFn: () => listClientes(createClient(), filter),
    initialData: isDefaultFilter ? initialData : undefined,
  });
}
