"use client";

import { useState, useId } from "react";
import type { AseguradoraInput } from "@/lib/actions/aseguradoras";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input, Textarea } from "@/components/ui/fields";

export function AseguradoraForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  defaultValues?: Partial<AseguradoraInput>;
  onSubmit: (input: AseguradoraInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const uid = useId();
  const [form, setForm] = useState<AseguradoraInput>({
    nombre: defaultValues?.nombre ?? "",
    notas: defaultValues?.notas ?? "",
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

      <div>
        <FieldLabel htmlFor={`${uid}-2`}>Notas</FieldLabel>
        <Textarea
          id={`${uid}-2`}
          value={form.notas}
          onChange={(e) => setForm({ ...form, notas: e.target.value })}
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-danger-700">{error}</p>}

      <div className="flex justify-end gap-3">
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
