import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/queries/dashboard";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default async function DashboardPage() {
  const supabase = await createClient();
  const data = await getDashboardData(supabase);

  return <DashboardView initialData={data} />;
}
