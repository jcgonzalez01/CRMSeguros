"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useClientes, type ClienteListItem } from "@/lib/hooks/useClientes";
import { createCliente, deleteCliente, updateCliente } from "@/lib/actions/clientes";
import type { ClienteInput } from "@/lib/actions/clientes";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ClienteForm, type ProfileOption } from "./ClienteForm";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Icon";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableMessage,
  TableRow,
} from "@/components/ui/Table";

const COLS = "grid-cols-[minmax(0,2fr)_150px_minmax(0,1.6fr)_minmax(0,1.1fr)_92px]";

export function ClientesView({
  initialClientes,
  profiles,
  puedeEditar,
}: {
  initialClientes: ClienteListItem[];
  profiles: ProfileOption[];
  puedeEditar: boolean;
}) {
  const [search, setSearch] = useState("");
  const [propietarioId, setPropietarioId] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ClienteListItem | null>(null);
  const [deleting, setDeleting] = useState<ClienteListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const queryClient = useQueryClient();
  const filter = { search: search || undefined, propietarioId: propietarioId || undefined };
  const { data: clientes, isLoading } = useClientes(filter, initialClientes);

  async function handleCreate(input: ClienteInput) {
    await createCliente(input);
    setCreating(false);
    queryClient.invalidateQueries({ queryKey: ["clientes"] });
  }

  async function handleUpdate(input: ClienteInput) {
    if (!editing) return;
    await updateCliente(editing.id, input);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["clientes"] });
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteCliente(deleting.id);
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    } finally {
      setDeleteLoading(false);
    }
  }

  const total = clientes?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description={`${total} ${total === 1 ? "cliente" : "clientes"}`}
        actions={puedeEditar && <Button onClick={() => setCreating(true)}>Nuevo cliente</Button>}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          aria-label="Buscar por nombre, correo o teléfono"
          placeholder="Buscar por nombre, correo o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth={false}
          className="flex-1"
        />
        <Select
          aria-label="Todos los propietarios"
          value={propietarioId}
          onChange={(e) => setPropietarioId(e.target.value)}
          fullWidth={false}
        >
          <option value="">Todos los propietarios</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>
      </div>

      <Table label="Clientes" minWidth="min-w-[900px]">
        <TableHeader cols={COLS}>
          <TableHead>Nombre</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Propietario</TableHead>
          <TableHead srOnly>Acciones</TableHead>
        </TableHeader>
        {isLoading && <TableMessage>Cargando…</TableMessage>}
        {!isLoading && clientes?.length === 0 && (
          <TableMessage>No se encontraron clientes.</TableMessage>
        )}
        {clientes?.map((cliente) => (
          <TableRow key={cliente.id} cols={COLS}>
            <TableCell className="flex items-center gap-3">
              <Avatar name={cliente.nombre} />
              <div className="flex min-w-0 flex-col">
                <Link
                  href={`/clientes/${cliente.id}`}
                  className="truncate font-semibold text-blue-700 hover:underline"
                >
                  {cliente.nombre}
                </Link>
                {cliente.cedula && (
                  <span className="truncate text-xs text-gray-600">{cliente.cedula}</span>
                )}
              </div>
            </TableCell>
            <TableCell className="tabular-nums text-gray-700">{cliente.telefono ?? "—"}</TableCell>
            <TableCell className="truncate text-gray-700">{cliente.correo ?? "—"}</TableCell>
            <TableCell className="truncate text-gray-600">
              {cliente.propietario?.full_name ?? "—"}
            </TableCell>
            <TableCell className="flex items-center justify-end gap-1">
              {puedeEditar && (
                <>
                  <IconButton
                    icon="pencil"
                    label={`Editar ${cliente.nombre}`}
                    onClick={() => setEditing(cliente)}
                  />
                  <IconButton
                    icon="trash"
                    tone="danger"
                    label={`Eliminar ${cliente.nombre}`}
                    onClick={() => setDeleting(cliente)}
                  />
                </>
              )}
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo cliente" size="lg">
        <ClienteForm
          profiles={profiles}
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Crear"
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar cliente" size="lg">
        {editing && (
          <ClienteForm
            profiles={profiles}
            defaultValues={{
              nombre: editing.nombre,
              telefono: editing.telefono ?? "",
              correo: editing.correo ?? "",
              cedula: editing.cedula ?? "",
              fecha_nacimiento: editing.fecha_nacimiento ?? "",
              direccion: editing.direccion ?? "",
              sexo: (editing.sexo as ClienteInput["sexo"]) ?? "",
              estado_civil: (editing.estado_civil as ClienteInput["estado_civil"]) ?? "",
              ocupacion: editing.ocupacion ?? "",
              notas: editing.notas ?? "",
              propietario_id: editing.propietario_id ?? "",
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar cliente"
        message={`¿Seguro que quieres eliminar a "${deleting?.nombre}"? También se eliminarán sus pólizas y oportunidades asociadas.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
