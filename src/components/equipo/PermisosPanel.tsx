"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPermisoModulo } from "@/lib/actions/permisos";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { MODULOS, type ModuloKey, type NivelPermiso } from "@/lib/permisos/server";

const COLS = "grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]";

const NIVEL_CLASS: Record<NivelPermiso, string> = {
  editar: "border-blue-200 bg-blue-50 text-blue-700",
  ver: "border-gray-300 bg-gray-50 text-gray-700",
  bloqueado: "border-danger-200 bg-danger-50 text-danger-700",
};

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
    <div className="flex flex-col gap-6">
      <p className="max-w-[720px] text-sm leading-relaxed text-gray-600">
        Controla qué módulos puede ver y editar cada rol. Admin siempre tiene
        acceso total. Los cambios se guardan al instante.
      </p>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Table label="Matriz de permisos" minWidth="min-w-[480px]">
          <TableHeader cols={COLS}>
            <TableHead>Módulo</TableHead>
            {ROLES.map((role) => (
              <TableHead key={role}>{role}</TableHead>
            ))}
          </TableHeader>
          {MODULOS.map((modulo) => (
            <TableRow key={modulo} cols={COLS} className="py-3.5">
              <TableCell className="font-semibold text-gray-900">
                {MODULO_LABEL[modulo]}
              </TableCell>
              {ROLES.map((role) => {
                const id = cellKey(role, modulo);
                const cargando = guardando === id;
                const nivel = nivelDe(role, modulo);
                return (
                  <TableCell key={id}>
                    <select
                      aria-label={`Permiso de ${role} en ${modulo}`}
                      value={nivel}
                      onChange={(e) =>
                        handleChange(role, modulo, e.target.value as NivelPermiso)
                      }
                      disabled={cargando}
                      className={`h-[38px] w-full max-w-[190px] rounded-[10px] border px-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-50 ${NIVEL_CLASS[nivel]}`}
                    >
                      {(["bloqueado", "ver", "editar"] as const).map((n) => (
                        <option key={n} value={n}>
                          {NIVEL_LABEL[n]}
                        </option>
                      ))}
                    </select>
                    {error?.id === id && (
                      <p className="mt-1 text-[13px] text-danger-700">{error.texto}</p>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </Table>

        <Card
          aria-labelledby="niveles-acceso"
          className="flex flex-col gap-4 px-[22px] py-5"
        >
          <h2 id="niveles-acceso" className="text-[15px] font-semibold text-gray-900">
            Niveles de acceso
          </h2>
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-blue-700">Editar</span>
            <span className="text-[13px] leading-normal text-gray-600">
              Ve el módulo y puede crear, modificar y eliminar registros.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-gray-700">Ver</span>
            <span className="text-[13px] leading-normal text-gray-600">
              Solo lectura: se ocultan los botones de crear, editar y eliminar.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-danger-700">Bloqueado</span>
            <span className="text-[13px] leading-normal text-gray-600">
              El módulo desaparece del menú y su ruta redirige al Dashboard.
            </span>
          </div>
          <p className="border-t border-gray-100 pt-3.5 text-[13px] leading-normal text-gray-600">
            Un Corredor solo ve sus propias oportunidades, tareas y pólizas.
          </p>
        </Card>
      </div>
    </div>
  );
}
