"use client";

import { useState, useId } from "react";
import type { InviteInput } from "@/lib/actions/equipo";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input, Select } from "@/components/ui/fields";

export function InviteForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: InviteInput) => Promise<void>;
  onCancel: () => void;
}) {
  const uid = useId();
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
        <p className="text-sm text-success-700">
          Invitación enviada a {form.email}. Recibirá un correo para crear su
          contraseña.
        </p>
        <div className="flex justify-end">
          <Button type="button" onClick={onCancel}>
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${uid}-1`}>Nombre completo *</FieldLabel>
        <Input
          id={`${uid}-1`}
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-2`}>Correo *</FieldLabel>
        <Input
          id={`${uid}-2`}
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-3`}>Rol *</FieldLabel>
        <Select
          id={`${uid}-3`}
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value as InviteInput["role"] })
          }
        >
          <option value="Corredor">Corredor</option>
          <option value="Gerente">Gerente</option>
          <option value="Admin">Admin</option>
        </Select>
      </div>

      <p className="rounded-[10px] border border-gray-100 bg-gray-50 p-3 text-[13px] text-gray-600">
        Corredor: ve solo sus propias oportunidades, tareas y pólizas.
        Admin y Gerente ven y asignan todo; solo Admin gestiona el
        equipo.
      </p>

      {error && <p className="text-sm text-danger-700">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? "Enviando…" : "Enviar invitación"}
        </Button>
      </div>
    </form>
  );
}
