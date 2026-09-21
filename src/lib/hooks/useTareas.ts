"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { listTareas, type TareasFilter } from "@/lib/queries/tareas";
import { useRealtimeTable } from "./useRealtimeTable";

export type TareaListItem = Awaited<ReturnType<typeof listTareas>>[number];

export function useTareas(filter: TareasFilter, initialData?: TareaListItem[]) {
  useRealtimeTable("tareas", ["tareas", filter]);

  const isDefaultFilter = !filter.search && !filter.estado && !filter.asignadoA;

  return useQuery({
    queryKey: ["tareas", filter],
    queryFn: () => listTareas(createClient(), filter),
    initialData: isDefaultFilter ? initialData : undefined,
  });
}
