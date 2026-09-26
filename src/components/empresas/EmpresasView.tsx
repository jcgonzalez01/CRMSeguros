"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/types/database.types";
import { createEmpresa, setEmpresaActiva, type EmpresaInput } from "@/lib/actions/empresas";
import { Modal } from "@/components/ui/Modal";
import { EmpresaForm } from "./EmpresaForm";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { initialsOf } from "@/components/ui/Avatar";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableMessage,
  TableRow,
} from "@/components/ui/Table";

type Empresa = Database["public"]["Tables"]["empresas"]["Row"];

const COLS = "grid-cols-[minmax(0,2fr)_150px_150px_120px]";

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

  const activas = empresas.filter((e) => e.activa).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Empresas"
        description={`${empresas.length} ${empresas.length === 1 ? "empresa" : "empresas"} · ${activas} ${activas === 1 ? "activa" : "activas"}`}
        actions={<Button onClick={() => setCreating(true)}>Nueva empresa</Button>}
      />

      <Table label="Empresas" minWidth="min-w-[640px]">
        <TableHeader cols={COLS}>
          <TableHead>Nombre</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Creada</TableHead>
          <TableHead srOnly>Acciones</TableHead>
        </TableHeader>
        {empresas.length === 0 && <TableMessage>No hay empresas todavía.</TableMessage>}
        {empresas.map((empresa) => (
          <TableRow key={empresa.id} cols={COLS}>
            <TableCell className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-[13px] font-bold text-blue-700"
              >
                {initialsOf(empresa.nombre)}
              </span>
              <span className="truncate font-semibold text-gray-900">{empresa.nombre}</span>
            </TableCell>
            <TableCell>
              <Badge tone={empresa.activa ? "green" : "neutral"}>
                {empresa.activa ? "Activa" : "Desactivada"}
              </Badge>
            </TableCell>
            <TableCell className="tabular-nums text-gray-600">
              {formatFecha(empresa.created_at)}
            </TableCell>
            <TableCell className="flex justify-end">
              <Button
                size="sm"
                variant={empresa.activa ? "dangerOutline" : "secondary"}
                onClick={() => handleToggleActiva(empresa)}
              >
                {empresa.activa ? "Desactivar" : "Activar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva empresa">
        <EmpresaForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
      </Modal>
    </div>
  );
}
