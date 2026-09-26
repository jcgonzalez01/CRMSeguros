"use client";

import { useState, useId } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { listDependientes } from "@/lib/queries/dependientes";
import {
  createDependiente,
  deleteDependiente,
  updateDependiente,
  type DependienteInput,
} from "@/lib/actions/dependientes";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input, Select } from "@/components/ui/fields";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/Icon";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

const COLS = "grid-cols-[minmax(0,1.4fr)_110px_130px_130px_80px]";

type Dependiente = Awaited<ReturnType<typeof listDependientes>>[number];

const PARENTESCO_LABELS: Record<string, string> = {
  conyuge: "Cónyuge",
  hijo: "Hijo",
  hija: "Hija",
  padre: "Padre",
  madre: "Madre",
  hermano: "Hermano",
  hermana: "Hermana",
  otro: "Otro",
};

function formatFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es").format(new Date(fecha + "T00:00:00"));
}

function DependienteForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  defaultValues?: Partial<DependienteInput>;
  onSubmit: (input: DependienteInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const uid = useId();
  const [form, setForm] = useState<DependienteInput>({
    nombre: defaultValues?.nombre ?? "",
    parentesco: defaultValues?.parentesco ?? "",
    fecha_nacimiento: defaultValues?.fecha_nacimiento ?? "",
    cedula: defaultValues?.cedula ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${uid}-1`}>Nombre *</FieldLabel>
        <Input
          id={`${uid}-1`}
          required
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor={`${uid}-2`}>Parentesco</FieldLabel>
          <Select
            id={`${uid}-2`}
            value={form.parentesco}
            onChange={(e) =>
              setForm({
                ...form,
                parentesco: e.target.value as DependienteInput["parentesco"],
              })
            }
          >
            <option value="">Sin especificar</option>
            {Object.entries(PARENTESCO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor={`${uid}-3`}>Fecha de nacimiento</FieldLabel>
          <Input
            id={`${uid}-3`}
            type="date"
            value={form.fecha_nacimiento}
            onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
          />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-4`}>Cédula</FieldLabel>
        <Input
          id={`${uid}-4`}
          value={form.cedula}
          onChange={(e) => setForm({ ...form, cedula: e.target.value })}
        />
      </div>

      {error && <p className="text-sm text-danger-700">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          onClick={onCancel} variant="ghost"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function DependientesPanel({
  clienteId,
  initialDependientes,
  puedeEditar,
}: {
  clienteId: string;
  initialDependientes: Dependiente[];
  puedeEditar: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Dependiente | null>(null);
  const [deleting, setDeleting] = useState<Dependiente | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const uid = useId();
  const queryClient = useQueryClient();

  const { data: dependientes } = useQuery({
    queryKey: ["dependientes", clienteId],
    queryFn: () => listDependientes(createClient(), clienteId),
    initialData: initialDependientes,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["dependientes", clienteId] });
  }

  async function handleCreate(input: DependienteInput) {
    await createDependiente(clienteId, input);
    setCreating(false);
    invalidate();
  }

  async function handleUpdate(input: DependienteInput) {
    if (!editing) return;
    await updateDependiente(editing.id, clienteId, input);
    setEditing(null);
    invalidate();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteDependiente(deleting.id, clienteId);
      setDeleting(null);
      invalidate();
    } finally {
      setDeleteLoading(false);
    }
  }

  const total = dependientes?.length ?? 0;

  return (
    <Card aria-labelledby={`${uid}-titulo`} className="overflow-hidden">
      <div
        className={`flex items-center justify-between gap-3 px-5 py-3.5 ${
          expanded ? "border-b border-gray-100" : ""
        }`}
      >
        <h2 id={`${uid}-titulo`} className="text-[15px] font-semibold text-gray-900">
          Dependientes ({total})
        </h2>
        <div className="flex items-center gap-3">
          {expanded && puedeEditar && (
            <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
              Agregar dependiente
            </Button>
          )}
          <IconButton
            icon={expanded ? "chevronUp" : "chevronDown"}
            label={expanded ? "Contraer dependientes" : "Expandir dependientes"}
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          />
        </div>
      </div>

      {expanded && total === 0 && (
        <p className="px-5 py-5 text-sm text-gray-600">Sin dependientes registrados.</p>
      )}

      {expanded && dependientes && dependientes.length > 0 && (
        <div className="overflow-x-auto">
          <div role="table" aria-label="Dependientes" className="min-w-[640px]">
            <TableHeader cols={COLS}>
              <TableHead>Nombre</TableHead>
              <TableHead>Parentesco</TableHead>
              <TableHead>Nacimiento</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead srOnly>Acciones</TableHead>
            </TableHeader>
            {dependientes.map((d) => (
              <TableRow key={d.id} cols={COLS}>
                <TableCell className="truncate font-medium text-gray-900">{d.nombre}</TableCell>
                <TableCell className="text-gray-600">
                  {d.parentesco ? (PARENTESCO_LABELS[d.parentesco] ?? d.parentesco) : "—"}
                </TableCell>
                <TableCell className="tabular-nums">{formatFecha(d.fecha_nacimiento)}</TableCell>
                <TableCell className="truncate tabular-nums text-gray-600">
                  {d.cedula ?? "—"}
                </TableCell>
                <TableCell className="flex items-center justify-end gap-1">
                  {puedeEditar && (
                    <>
                      <IconButton
                        icon="pencil"
                        label={`Editar ${d.nombre}`}
                        onClick={() => setEditing(d)}
                      />
                      <IconButton
                        icon="trash"
                        tone="danger"
                        label={`Eliminar ${d.nombre}`}
                        onClick={() => setDeleting(d)}
                      />
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </div>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Agregar dependiente">
        <DependienteForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Agregar"
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar dependiente">
        {editing && (
          <DependienteForm
            defaultValues={{
              nombre: editing.nombre,
              parentesco: (editing.parentesco as DependienteInput["parentesco"]) ?? "",
              fecha_nacimiento: editing.fecha_nacimiento ?? "",
              cedula: editing.cedula ?? "",
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar dependiente"
        message={`¿Seguro que quieres eliminar a "${deleting?.nombre}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Card>
  );
}
