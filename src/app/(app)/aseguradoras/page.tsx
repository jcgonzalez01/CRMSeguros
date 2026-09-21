import { createClient } from "@/lib/supabase/server";
import { listAseguradoras } from "@/lib/queries/aseguradoras";
import { AseguradorasView } from "@/components/aseguradoras/AseguradorasView";

export default async function AseguradorasPage() {
  const supabase = await createClient();
  const aseguradoras = await listAseguradoras(supabase);

  return <AseguradorasView initialAseguradoras={aseguradoras} />;
}
