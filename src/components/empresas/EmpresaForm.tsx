"use client";

import { useState, useId } from "react";
import type { EmpresaInput } from "@/lib/actions/empresas";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input } from "@/components/ui/fields";

export function EmpresaForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: EmpresaInput) => Promise<void>;
  onCancel: () => void;
}) {
  const uid = useId();
  const [form, setForm] = useState<EmpresaInput>({
    nombre: "",
    adminEmail: "",
    adminFullName: "",
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
          Empresa &quot;{form.nombre}&quot; creada. Se envió una invitación a{" "}
          {form.adminEmail} para que cree su contraseña y entre como Admin.
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
        <FieldLabel htmlFor={`${uid}-1`}>Nombre de la empresa *</FieldLabel>
        <Input
          id={`${uid}-1`}
          required
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="mb-3 text-[13px] font-medium text-gray-600">
          Primer administrador de la empresa
        </p>
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor={`${uid}-2`}>Nombre completo *</FieldLabel>
            <Input
              id={`${uid}-2`}
              required
              value={form.adminFullName}
              onChange={(e) => setForm({ ...form, adminFullName: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${uid}-3`}>Correo *</FieldLabel>
            <Input
              id={`${uid}-3`}
              type="email"
              required
              value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
            />
          </div>
        </div>
      </div>

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
          {loading ? "Creando…" : "Crear empresa"}
        </Button>
      </div>
    </form>
  );
}
