"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  listAseguradoras,
  type AseguradorasFilter,
} from "@/lib/queries/aseguradoras";
import { useRealtimeTable } from "./useRealtimeTable";

export type AseguradoraListItem = Awaited<
  ReturnType<typeof listAseguradoras>
>[number];

export function useAseguradoras(
  filter: AseguradorasFilter,
  initialData?: AseguradoraListItem[]
) {
  // Recompute this view's counts on any change to polizas too, since
  // v_conteo_polizas_por_aseguradora aggregates across that table.
  useRealtimeTable("aseguradoras", ["aseguradoras", filter]);
  useRealtimeTable("polizas", ["aseguradoras", filter]);

  return useQuery({
    queryKey: ["aseguradoras", filter],
    queryFn: () => listAseguradoras(createClient(), filter),
    initialData: !filter.search ? initialData : undefined,
  });
}
