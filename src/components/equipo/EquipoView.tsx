"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteTeamMember,
  inviteTeamMember,
  resetTeamMemberPassword,
  setTeamMemberBloqueado,
  setTeamMemberRole,
  type InviteInput,
} from "@/lib/actions/equipo";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { InviteForm } from "./InviteForm";
import type { UserRole } from "@/lib/types/database.types";

export interface Miembro {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  bloqueado: boolean;
  role: UserRole;
}

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es").format(new Date(fecha));
}

export function EquipoView({
  miembros,
  currentUserId,
}: {
  miembros: Miembro[];
  currentUserId: string;
}) {
  const [inviting, setInviting] = useState(false);
  const [blocking, setBlocking] = useState<Miembro | null>(null);
  const [deleting, setDeleting] = useState<Miembro | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; texto: string } | null>(null);
  const [error, setError] = useState<{ id: string; texto: string } | null>(null);
  const router = useRouter();

  async function handleInvite(input: InviteInput) {
    await inviteTeamMember(input);
    router.refresh();
  }

  async function handleResetPassword(m: Miembro) {
    setActionLoading(m.id);
    setError(null);
    try {
      await resetTeamMemberPassword(m.id);
      setFeedback({ id: m.id, texto: "Correo de restablecimiento enviado." });
    } catch (err) {
      setError({
        id: m.id,
        texto: err instanceof Error ? err.message : "No se pudo enviar el correo",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleChangeRole(m: Miembro, role: UserRole) {
    setActionLoading(m.id);
    setError(null);
    try {
      await setTeamMemberRole(m.id, role);
      router.refresh();
    } catch (err) {
      setError({
        id: m.id,
        texto: err instanceof Error ? err.message : "No se pudo cambiar el rol",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnblock(m: Miembro) {
    setActionLoading(m.id);
    setError(null);
    try {
      await setTeamMemberBloqueado(m.id, false);
      router.refresh();
    } catch (err) {
      setError({
        id: m.id,
        texto: err instanceof Error ? err.message : "No se pudo desbloquear",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmBlock() {
    if (!blocking) return;
    setActionLoading(blocking.id);
    try {
      await setTeamMemberBloqueado(blocking.id, true);
      setBlocking(null);
      router.refresh();
    } catch (err) {
      setError({
        id: blocking.id,
        texto: err instanceof Error ? err.message : "No se pudo bloquear",
      });
      setBlocking(null);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleting) return;
    setActionLoading(deleting.id);
    try {
      await deleteTeamMember(deleting.id);
      setDeleting(null);
      router.refresh();
    } catch (err) {
      setError({
        id: deleting.id,
        texto: err instanceof Error ? err.message : "No se pudo eliminar",
      });
      setDeleting(null);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Equipo</h1>
        <button
          onClick={() => setInviting(true)}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Invitar miembro
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {miembros.map((m) => {
          const esUnoMismo = m.id === currentUserId;
          const cargando = actionLoading === m.id;
          return (
            <div key={m.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {m.full_name}
                    {esUnoMismo && <span className="text-gray-400 font-normal"> (tú)</span>}
                  </p>
                  <p className="text-sm text-gray-500">{m.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {m.role}
                  </span>
                  {m.bloqueado && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Bloqueado
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                En el equipo desde {formatFecha(m.created_at)}
              </p>

              {feedback?.id === m.id && (
                <p className="text-xs text-green-700 mt-2">{feedback.texto}</p>
              )}
              {error?.id === m.id && (
                <p className="text-xs text-red-600 mt-2">{error.texto}</p>
              )}

              {!esUnoMismo && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Rol
                  </label>
                  <select
                    value={m.role}
                    onChange={(e) => handleChangeRole(m, e.target.value as UserRole)}
                    disabled={cargando}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Corredor">Corredor</option>
                  </select>
                </div>
              )}

              {!esUnoMismo && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-sm">
                  <button
                    onClick={() => handleResetPassword(m)}
                    disabled={cargando}
                    className="text-blue-600 hover:underline disabled:opacity-50"
                  >
                    Restablecer contraseña
                  </button>
                  {m.bloqueado ? (
                    <button
                      onClick={() => handleUnblock(m)}
                      disabled={cargando}
                      className="text-gray-600 hover:underline disabled:opacity-50"
                    >
                      Desbloquear
                    </button>
                  ) : (
                    <button
                      onClick={() => setBlocking(m)}
                      disabled={cargando}
                      className="text-amber-600 hover:underline disabled:opacity-50"
                    >
                      Bloquear
                    </button>
                  )}
                  <button
                    onClick={() => setDeleting(m)}
                    disabled={cargando}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={inviting} onClose={() => setInviting(false)} title="Invitar miembro">
        <InviteForm onSubmit={handleInvite} onCancel={() => setInviting(false)} />
      </Modal>

      <ConfirmDialog
        open={!!blocking}
        title="Bloquear miembro"
        message={`${blocking?.full_name} no podrá iniciar sesión mientras esté bloqueado. Puedes desbloquearlo cuando quieras.`}
        confirmLabel="Bloquear"
        loading={actionLoading === blocking?.id}
        onConfirm={handleConfirmBlock}
        onCancel={() => setBlocking(null)}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar miembro"
        message={`¿Seguro que quieres eliminar a "${deleting?.full_name}"? Esta acción no se puede deshacer. Sus clientes, pólizas y tareas asignadas quedarán sin propietario.`}
        loading={actionLoading === deleting?.id}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
