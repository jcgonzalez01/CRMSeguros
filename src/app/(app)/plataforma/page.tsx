import { createClient } from "@/lib/supabase/server";
import { listEmpresas } from "@/lib/queries/empresas";
import { EmpresasView } from "@/components/empresas/EmpresasView";

export default async function PlataformaPage() {
  const supabase = await createClient();
  const empresas = await listEmpresas(supabase);

  return <EmpresasView empresas={empresas} />;
}
