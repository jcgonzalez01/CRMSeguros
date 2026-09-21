"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getDashboardData, type DashboardData } from "@/lib/queries/dashboard";
import { useRealtimeTable } from "./useRealtimeTable";

export function useDashboard(initialData: DashboardData) {
  useRealtimeTable("polizas", ["dashboard"]);
  useRealtimeTable("tareas", ["dashboard"]);
  useRealtimeTable("oportunidades", ["dashboard"]);

  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(createClient()),
    initialData,
  });
}
