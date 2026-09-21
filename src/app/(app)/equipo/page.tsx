import { createClient } from "@/lib/supabase/server";
import { EquipoView } from "@/components/equipo/EquipoView";

export default async function EquipoPage() {
  const supabase = await createClient();
  const { data: miembros, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at")
    .order("full_name");

  if (error) throw error;

  return <EquipoView miembros={miembros} />;
}
