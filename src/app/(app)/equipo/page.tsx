import { redirect } from "next/navigation";

// Equipo vive ahora dentro del módulo de Configuración.
export default function EquipoPage() {
  redirect("/configuracion");
}
