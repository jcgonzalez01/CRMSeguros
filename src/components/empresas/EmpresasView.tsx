"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/types/database.types";
import { createEmpresa, setEmpresaActiva, type EmpresaInput } from "@/lib/actions/empresas";
import { Modal } from "@/components/ui/Modal";
import { EmpresaForm } from "./EmpresaForm";

type Empresa = Database["public"]["Tables"]["empresas"]["Row"];

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es").format(new Date(fecha));
}

export function EmpresasView({ empresas }: { empresas: Empresa[] }) {
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleCreate(input: EmpresaInput) {
    await createEmpresa(input);
    router.refresh();
  }

  async function handleToggleActiva(empresa: Empresa) {
    await setEmpresaActiva(empresa.id, !empresa.activa);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Empresas</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nueva empresa
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500 hidden sm:table-cell">Creada</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empresas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  No hay empresas todavía.
                </td>
              </tr>
            )}
            {empresas.map((empresa) => (
              <tr key={empresa.id}>
                <td className="px-4 py-2 font-medium">{empresa.nombre}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      empresa.activa
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {empresa.activa ? "Activa" : "Desactivada"}
                  </span>
                </td>
                <td className="px-4 py-2 hidden sm:table-cell">
                  {formatFecha(empresa.created_at)}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleToggleActiva(empresa)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {empresa.activa ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva empresa">
        <EmpresaForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
      </Modal>
    </div>
  );
}
