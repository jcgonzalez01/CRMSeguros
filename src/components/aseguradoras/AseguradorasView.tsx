"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAseguradoras,
  type AseguradoraListItem,
} from "@/lib/hooks/useAseguradoras";
import {
  createAseguradora,
  deleteAseguradora,
  updateAseguradora,
  type AseguradoraInput,
} from "@/lib/actions/aseguradoras";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AseguradoraForm } from "./AseguradoraForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/fields";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableMessage,
  TableRow,
} from "@/components/ui/Table";
import { IconButton } from "@/components/ui/Icon";
import { initialsOf } from "@/components/ui/Avatar";

const COLS = "grid-cols-[minmax(0,2fr)_minmax(0,2fr)_92px]";

export function AseguradorasView({
  initialAseguradoras,
  puedeEditar,
}: {
  initialAseguradoras: AseguradoraListItem[];
  puedeEditar: boolean;
}) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AseguradoraListItem | null>(null);
  const [deleting, setDeleting] = useState<AseguradoraListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const filter = { search: search || undefined };
  const { data: aseguradoras, isLoading } = useAseguradoras(
    filter,
    initialAseguradoras
  );

  async function handleCreate(input: AseguradoraInput) {
    await createAseguradora(input);
    setCreating(false);
    queryClient.invalidateQueries({ queryKey: ["aseguradoras"] });
  }

  async function handleUpdate(input: AseguradoraInput) {
    if (!editing) return;
    await updateAseguradora(editing.id, input);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["aseguradoras"] });
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteAseguradora(deleting.id);
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["aseguradoras"] });
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la aseguradora."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  const lista = aseguradoras ?? [];
  const maxActivas = Math.max(0, ...lista.map((a) => a.polizas_activas));
  const totalActivas = lista.reduce((acc, a) => acc + a.polizas_activas, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Aseguradoras"
        description={
          aseguradoras
            ? `${lista.length} ${lista.length === 1 ? "aseguradora" : "aseguradoras"} · ${totalActivas} ${totalActivas === 1 ? "póliza activa" : "pólizas activas"}`
            : undefined
        }
        actions={
          puedeEditar && (
            <Button onClick={() => setCreating(true)}>Nueva aseguradora</Button>
          )
        }
      />

      <Input
        aria-label="Buscar por nombre"
        placeholder="Buscar por nombre…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth={false}
        className="w-full sm:w-80"
      />

      <Table label="Aseguradoras" minWidth="min-w-[560px]">
        <TableHeader cols={COLS}>
          <TableHead>Nombre</TableHead>
          <TableHead>Pólizas activas</TableHead>
          <TableHead srOnly>Acciones</TableHead>
        </TableHeader>
        {isLoading && <TableMessage>Cargando…</TableMessage>}
        {!isLoading && lista.length === 0 && (
          <TableMessage>No se encontraron aseguradoras.</TableMessage>
        )}
        {lista.map((a) => (
          <TableRow key={a.id} cols={COLS}>
            <TableCell className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-[13px] font-bold text-blue-700"
              >
                {initialsOf(a.nombre)}
              </span>
              <span className="truncate font-semibold text-gray-900">{a.nombre}</span>
            </TableCell>
            <TableCell className="flex items-center gap-3.5">
              <span className="w-[34px] font-semibold tabular-nums text-gray-900">
                {a.polizas_activas}
              </span>
              <span
                aria-hidden="true"
                className="h-2 max-w-[320px] flex-1 overflow-hidden rounded bg-gray-200"
              >
                <span
                  className="block h-full bg-blue-600"
                  style={{
                    width: `${maxActivas > 0 ? Math.round((a.polizas_activas / maxActivas) * 100) : 0}%`,
                  }}
                />
              </span>
            </TableCell>
            <TableCell className="flex items-center justify-end gap-1">
              {puedeEditar && (
                <>
                  <IconButton
                    icon="pencil"
                    label={`Editar ${a.nombre}`}
                    onClick={() => setEditing(a)}
                  />
                  <IconButton
                    icon="trash"
                    tone="danger"
                    label={`Eliminar ${a.nombre}`}
                    onClick={() => setDeleting(a)}
                  />
                </>
              )}
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva aseguradora">
        <AseguradoraForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Crear"
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar aseguradora">
        {editing && (
          <AseguradoraForm
            defaultValues={{ nombre: editing.nombre, notas: editing.notas ?? "" }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar aseguradora"
        message={
          deleteError ??
          `¿Seguro que quieres eliminar "${deleting?.nombre}"? No se puede eliminar si tiene pólizas asociadas.`
        }
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleting(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
