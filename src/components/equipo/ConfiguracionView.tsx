"use client";

import { useState, useId } from "react";
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
import { PermisosPanel, type PermisoModuloRow } from "./PermisosPanel";
import { EmpresaPanel } from "./EmpresaPanel";
import type { EmpresaPerfil } from "@/lib/queries/empresa";
import type { UserRole } from "@/lib/types/database.types";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { FieldLabel } from "@/components/ui/fields";

export interface Miembro {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  bloqueado: boolean;
  role: UserRole;
}

const ROL_TONE: Partial<Record<UserRole, BadgeTone>> = {
  Admin: "violet",
  Gerente: "blue",
  Corredor: "neutral",
};

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es").format(new Date(fecha));
}

export function ConfiguracionView({
  miembros,
  currentUserId,
  permisos,
  perfil,
  logoUrl,
}: {
  miembros: Miembro[];
  currentUserId: string;
  permisos: PermisoModuloRow[];
  perfil: EmpresaPerfil | null;
  logoUrl: string | null;
}) {
  const uid = useId();
  const [tab, setTab] = useState<"miembros" | "permisos" | "empresa">("miembros");
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configuración"
        description="Equipo, permisos y datos de tu empresa."
        actions={
          tab === "miembros" ? (
            <Button onClick={() => setInviting(true)}>Invitar miembro</Button>
          ) : undefined
        }
      />

      <Tabs
        label="Secciones de configuración"
        items={[
          { value: "miembros", label: "Miembros" },
          { value: "permisos", label: "Permisos" },
          { value: "empresa", label: "Empresa" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "permisos" && <PermisosPanel permisos={permisos} />}

      {tab === "empresa" && <EmpresaPanel perfil={perfil} logoUrl={logoUrl} />}

      {tab === "miembros" && (
        <section
          aria-label="Miembros del equipo"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {miembros.map((m) => {
            const esUnoMismo = m.id === currentUserId;
            const cargando = actionLoading === m.id;
            const rolId = `${uid}-rol-${m.id}`;
            return (
              <Card key={m.id} className="flex flex-col gap-4 px-[22px] py-5">
                <div className="flex items-start gap-3.5">
                  <Avatar name={m.full_name} size="lg" />
                  <div className="flex min-w-0 grow flex-col gap-0.5">
                    <h2 className="text-[15px] font-semibold text-gray-900">
                      {m.full_name}
                      {esUnoMismo && (
                        <span className="font-normal text-gray-600"> (tú)</span>
                      )}
                    </h2>
                    <span className="truncate text-[13px] text-gray-600">{m.email}</span>
                  </div>
                  <Badge tone={ROL_TONE[m.role] ?? "neutral"} className="shrink-0">
                    {m.role}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-2 text-[13px] text-gray-600">
                  <span>En el equipo desde {formatFecha(m.created_at)}</span>
                  {m.bloqueado && <Badge tone="red">Bloqueado</Badge>}
                </div>

                {feedback?.id === m.id && (
                  <p className="text-[13px] text-success-700">{feedback.texto}</p>
                )}
                {error?.id === m.id && (
                  <p className="text-[13px] text-danger-700">{error.texto}</p>
                )}

                {!esUnoMismo && (
                  <div className="flex flex-col gap-3 border-t border-gray-100 pt-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <FieldLabel htmlFor={rolId} className="mb-0 text-[13px]">
                        Rol
                      </FieldLabel>
                      <select
                        id={rolId}
                        value={m.role}
                        onChange={(e) => handleChangeRole(m, e.target.value as UserRole)}
                        disabled={cargando}
                        className="h-9 w-[150px] rounded-lg border border-gray-300 bg-white px-2.5 text-[13px] text-gray-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:opacity-60"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Gerente">Gerente</option>
                        <option value="Corredor">Corredor</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold">
                      <button
                        type="button"
                        onClick={() => handleResetPassword(m)}
                        disabled={cargando}
                        className="text-blue-700 hover:underline disabled:opacity-50"
                      >
                        Restablecer contraseña
                      </button>
                      {m.bloqueado ? (
                        <button
                          type="button"
                          onClick={() => handleUnblock(m)}
                          disabled={cargando}
                          className="text-warning-700 hover:underline disabled:opacity-50"
                        >
                          Desbloquear
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBlocking(m)}
                          disabled={cargando}
                          className="text-warning-700 hover:underline disabled:opacity-50"
                        >
                          Bloquear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleting(m)}
                        disabled={cargando}
                        className="text-danger-700 hover:underline disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </section>
      )}

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
