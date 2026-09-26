"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTareas, type TareaListItem } from "@/lib/hooks/useTareas";
import {
  createTarea,
  deleteTarea,
  setTareaEstado,
  updateTarea,
  type TareaInput,
} from "@/lib/actions/tareas";
import type { TaskStatus } from "@/lib/types/database.types";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TareaForm } from "./TareaForm";
import type { Option } from "@/components/polizas/PolizaForm";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/fields";
import { badgeClasses, type BadgeTone } from "@/components/ui/Badge";
import { Icon, IconButton } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableMessage,
  TableRow,
} from "@/components/ui/Table";

const ESTADO_LABEL: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  en_espera: "En espera",
  vencida: "Vencida",
  completada: "Completada",
  cancelada: "Cancelada",
};

const ESTADO_TONE: Record<TaskStatus, BadgeTone> = {
  pendiente: "neutral",
  en_progreso: "blue",
  en_espera: "amber",
  vencida: "red",
  completada: "green",
  cancelada: "neutral",
};

const COLS =
  "grid-cols-[minmax(0,2.4fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_110px_150px_84px]";

const ESTADOS_FINALES: TaskStatus[] = ["completada", "cancelada"];

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es").format(new Date(fecha));
}

function isAtrasada(tarea: TareaListItem) {
  if (ESTADOS_FINALES.includes(tarea.estado)) return false;
  return new Date(tarea.fecha_limite) < new Date(new Date().toDateString());
}

function esEstaSemana(tarea: TareaListItem) {
  if (ESTADOS_FINALES.includes(tarea.estado) || isAtrasada(tarea)) return false;
  const hoy = new Date(new Date().toDateString()).getTime();
  const limite = new Date(tarea.fecha_limite).getTime();
  return limite >= hoy && limite < hoy + 7 * 24 * 60 * 60 * 1000;
}

export function TareasView({
  initialTareas,
  clientes,
  miembros,
  oportunidades = [],
  puedeEditar,
}: {
  initialTareas: TareaListItem[];
  clientes: Option[];
  miembros: Option[];
  oportunidades?: { id: string; titulo: string }[];
  puedeEditar: boolean;
}) {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<TaskStatus | "">("");
  const [asignadoA, setAsignadoA] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TareaListItem | null>(null);
  const [deleting, setDeleting] = useState<TareaListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const queryClient = useQueryClient();
  const filter = {
    search: search || undefined,
    estado: estado || undefined,
    asignadoA: asignadoA || undefined,
  };
  const { data: tareas, isLoading } = useTareas(filter, initialTareas);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["tareas"] });
  }

  async function handleCreate(input: TareaInput) {
    await createTarea(input);
    setCreating(false);
    invalidate();
  }

  async function handleUpdate(input: TareaInput) {
    if (!editing) return;
    await updateTarea(editing.id, input);
    setEditing(null);
    invalidate();
  }

  async function handleEstadoChange(tarea: TareaListItem, next: TaskStatus) {
    await setTareaEstado(tarea.id, next);
    invalidate();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteTarea(deleting.id, deleting.cliente_id);
      setDeleting(null);
      invalidate();
    } finally {
      setDeleteLoading(false);
    }
  }

  const atrasadas = tareas?.filter(isAtrasada).length ?? 0;
  const estaSemana = tareas?.filter(esEstaSemana).length ?? 0;
  const descripcion = tareas
    ? `${atrasadas} ${atrasadas === 1 ? "atrasada" : "atrasadas"} · ${estaSemana} con fecha límite esta semana`
    : "Seguimiento de las tareas de tu equipo";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tareas"
        description={descripcion}
        actions={
          puedeEditar && (
            <Button type="button" onClick={() => setCreating(true)}>
              Nueva tarea
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Buscar por título"
          placeholder="Buscar por título…"
          value={search}
          onChange={(e) => setSearch(e.target.value)} fullWidth={false} className="min-w-0 flex-1"
        />
        <Select
          aria-label="Todos los estados"
          value={estado}
          onChange={(e) => setEstado(e.target.value as TaskStatus | "")} fullWidth={false}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_progreso">En progreso</option>
          <option value="en_espera">En espera</option>
          <option value="vencida">Vencida</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
        </Select>
        <Select
          aria-label="Todos los asignados"
          value={asignadoA}
          onChange={(e) => setAsignadoA(e.target.value)} fullWidth={false}
        >
          <option value="">Todos los asignados</option>
          {miembros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </Select>
      </div>

      <Table label="Tareas" minWidth="min-w-[940px]">
        <TableHeader cols={COLS}>
          <TableHead>Título</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Asignado</TableHead>
          <TableHead>Fecha límite</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead srOnly>Acciones</TableHead>
        </TableHeader>
        {isLoading && <TableMessage>Cargando…</TableMessage>}
        {!isLoading && tareas?.length === 0 && (
          <TableMessage>No se encontraron tareas.</TableMessage>
        )}
        {tareas?.map((t) => (
          <TableRow
            key={t.id}
            cols={COLS}
            className={ESTADOS_FINALES.includes(t.estado) ? "opacity-60" : undefined}
          >
            <TableCell>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span
                  className={`font-semibold ${t.estado === "completada" ? "line-through" : ""}`}
                >
                  {t.titulo}
                </span>
                {t.oportunidad && (
                  <span className="text-xs text-gray-600">De: {t.oportunidad.titulo}</span>
                )}
              </div>
            </TableCell>
            <TableCell className="truncate">{t.cliente?.nombre ?? "—"}</TableCell>
            <TableCell className="truncate text-gray-600">
              {t.asignado?.full_name ?? "—"}
            </TableCell>
            <TableCell
              className={`tabular-nums ${isAtrasada(t) ? "font-semibold text-danger-700" : "text-gray-900"}`}
            >
              {formatFecha(t.fecha_limite)}
            </TableCell>
            <TableCell>
              <div className="relative inline-flex">
                <select
                  aria-label={`Estado de la tarea ${t.titulo}`}
                  value={t.estado}
                  onChange={(e) => handleEstadoChange(t, e.target.value as TaskStatus)}
                  disabled={!puedeEditar}
                  className={badgeClasses(
                    ESTADO_TONE[t.estado],
                    `appearance-none ${puedeEditar ? "cursor-pointer pr-7!" : "cursor-default"} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40`
                  )}
                >
                  {(Object.keys(ESTADO_LABEL) as TaskStatus[]).map((estadoOption) => (
                    <option key={estadoOption} value={estadoOption}>
                      {ESTADO_LABEL[estadoOption]}
                    </option>
                  ))}
                </select>
                {puedeEditar && (
                  <Icon
                    name="chevronDown"
                    size={12}
                    className="pointer-events-none absolute right-2.5 text-gray-600 top-1/2 -translate-y-1/2"
                  />
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                {puedeEditar && (
                  <>
                    <IconButton icon="pencil" label="Editar tarea" onClick={() => setEditing(t)} />
                    <IconButton
                      icon="trash"
                      tone="danger"
                      label="Eliminar tarea"
                      onClick={() => setDeleting(t)}
                    />
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva tarea">
        <TareaForm
          clientes={clientes}
          miembros={miembros}
          oportunidades={oportunidades}
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Crear"
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar tarea">
        {editing && (
          <TareaForm
            clientes={clientes}
            miembros={miembros}
            oportunidades={oportunidades}
            defaultValues={{
              titulo: editing.titulo,
              descripcion: editing.descripcion ?? "",
              cliente_id: editing.cliente_id ?? "",
              asignado_a: editing.asignado_a ?? "",
              oportunidad_id: editing.oportunidad_id ?? "",
              fecha_limite: editing.fecha_limite,
              estado: editing.estado,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar tarea"
        message={`¿Seguro que quieres eliminar "${deleting?.titulo}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
