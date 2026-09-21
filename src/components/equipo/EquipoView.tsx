"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteTeamMember, type InviteInput } from "@/lib/actions/equipo";
import { Modal } from "@/components/ui/Modal";
import { InviteForm } from "./InviteForm";

export interface Miembro {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es").format(new Date(fecha));
}

export function EquipoView({ miembros }: { miembros: Miembro[] }) {
  const [inviting, setInviting] = useState(false);
  const router = useRouter();

  async function handleInvite(input: InviteInput) {
    await inviteTeamMember(input);
    router.refresh();
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
        {miembros.map((m) => (
          <div key={m.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="font-medium">{m.full_name}</p>
            <p className="text-sm text-gray-500">{m.email}</p>
            <p className="text-xs text-gray-400 mt-2">
              En el equipo desde {formatFecha(m.created_at)}
            </p>
          </div>
        ))}
      </div>

      <Modal open={inviting} onClose={() => setInviting(false)} title="Invitar miembro">
        <InviteForm onSubmit={handleInvite} onCancel={() => setInviting(false)} />
      </Modal>
    </div>
  );
}
