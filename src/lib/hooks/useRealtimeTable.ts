"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// Invalidates `queryKey` whenever any row in `table` changes, so every
// connected team member sees writes from anyone else without a manual
// refresh.
export function useRealtimeTable(table: string, queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();
  const queryKeyJson = JSON.stringify(queryKey);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:${table}:${queryKeyJson}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          queryClient.invalidateQueries({ queryKey: JSON.parse(queryKeyJson) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryKeyJson, queryClient]);
}
