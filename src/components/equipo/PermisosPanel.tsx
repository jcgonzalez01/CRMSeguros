"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPermisoModulo } from "@/lib/actions/permisos";
import { MODULOS, type ModuloKey, type NivelPermiso } from "@/lib/permisos/server";

const ROLES = ["Gerente", "Corredor"] as const;

const MODULO_LABEL: Record<ModuloKey, string> = {
  clientes: "Clientes",
  polizas: "Pólizas",
  aseguradoras: "Aseguradoras",
  oportunidades: "Oportunidades",
  tareas: "Tareas",
  reportes: "Reportes",
};

const NIVEL_LABEL: Record<NivelPermiso, string> = {
  bloqueado: "Bloqueado",
  ver: "Ver",
  editar: "Editar",
};

export interface PermisoModuloRow {
  role: string;
  modulo: string;
  nivel: string;
}

function cellKey(role: string, modulo: string) {
  return `${role}:${modulo}`;
}

export function PermisosPanel({ permisos }: { permisos: PermisoModuloRow[] }) {
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; texto: string } | null>(null);
  const router = useRouter();

  function nivelDe(role: (typeof ROLES)[number], modulo: ModuloKey): NivelPermiso {
    return (
      (permisos.find((p) => p.role === role && p.modulo === modulo)
        ?.nivel as NivelPermiso | undefined) ?? "bloqueado"
    );
  }

  async function handleChange(
    role: (typeof ROLES)[number],
    modulo: ModuloKey,
    nivel: NivelPermiso
  ) {
    const id = cellKey(role, modulo);
    setGuardando(id);
    setError(null);
    try {
      await guardarPermisoModulo(role, modulo, nivel);
      router.refresh();
    } catch (err) {
      setError({
        id,
        texto: err instanceof Error ? err.message : "No se pudo guardar el permiso",
      });
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Controla qué módulos puede ver y editar cada rol. Admin siempre tiene
        acceso total.
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Módulo</th>
              {ROLES.map((role) => (
                <th key={role} className="px-4 py-2 text-left font-medium text-gray-500">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MODULOS.map((modulo) => (
              <tr key={modulo}>
                <td className="px-4 py-2 font-medium">{MODULO_LABEL[modulo]}</td>
                {ROLES.map((role) => {
                  const id = cellKey(role, modulo);
                  const cargando = guardando === id;
                  return (
                    <td key={id} className="px-4 py-2">
                      <select
                        value={nivelDe(role, modulo)}
                        onChange={(e) =>
                          handleChange(role, modulo, e.target.value as NivelPermiso)
                        }
                        disabled={cargando}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {(["bloqueado", "ver", "editar"] as const).map((nivel) => (
                          <option key={nivel} value={nivel}>
                            {NIVEL_LABEL[nivel]}
                          </option>
                        ))}
                      </select>
                      {error?.id === id && (
                        <p className="text-xs text-red-600 mt-1">{error.texto}</p>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
