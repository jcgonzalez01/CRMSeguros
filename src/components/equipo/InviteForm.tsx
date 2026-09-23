"use client";

import { useState } from "react";
import type { InviteInput } from "@/lib/actions/equipo";

export function InviteForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: InviteInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<InviteInput>({
    email: "",
    fullName: "",
    role: "Corredor",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(form);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-green-700">
          Invitación enviada a {form.email}. Recibirá un correo para crear su
          contraseña.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre completo *</label>
        <input
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Correo *</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Rol *</label>
        <select
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value as InviteInput["role"] })
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Corredor">Corredor</option>
          <option value="Gerente">Gerente</option>
          <option value="Admin">Admin</option>
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Corredor: ve solo sus propias oportunidades, tareas y pólizas.
          Admin y Gerente ven y asignan todo; solo Admin gestiona el
          equipo.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Enviar invitación"}
        </button>
      </div>
    </form>
  );
}
