"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { omitEmpresaId } from "@/lib/supabase/insert-helpers";
import type { Database } from "@/lib/types/database.types";
import { assertAdmin, type ModuloKey, type NivelPermiso } from "@/lib/permisos/server";

export async function guardarPermisoModulo(
  role: "Gerente" | "Corredor",
  modulo: ModuloKey,
  nivel: NivelPermiso
) {
  const supabase = await createClient();
  await assertAdmin(supabase);

  const { error } = await supabase.from("permisos_modulo").upsert(
    omitEmpresaId<Database["public"]["Tables"]["permisos_modulo"]["Insert"]>({
      role,
      modulo,
      nivel,
      updated_at: new Date().toISOString(),
    }),
    { onConflict: "empresa_id,role,modulo" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/equipo");
}
