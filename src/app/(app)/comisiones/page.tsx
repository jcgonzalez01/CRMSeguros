import { redirect } from "next/navigation";

// Comisiones vive ahora como pestaña dentro de Reportes.
export default function ComisionesPage() {
  redirect("/reportes");
}
