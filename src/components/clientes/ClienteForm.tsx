"use client";

import { useState, useId } from "react";
import type { ClienteInput } from "@/lib/actions/clientes";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/fields";

export interface ProfileOption {
  id: string;
  full_name: string;
}

const SEXO_LABELS: Record<string, string> = { M: "Masculino", F: "Femenino" };

const ESTADO_CIVIL_LABELS: Record<string, string> = {
  soltero: "Soltero/a",
  casado: "Casado/a",
  divorciado: "Divorciado/a",
  viudo: "Viudo/a",
  union_libre: "Unión libre",
};

export function ClienteForm({
  defaultValues,
  profiles,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  defaultValues?: Partial<ClienteInput>;
  profiles: ProfileOption[];
  onSubmit: (input: ClienteInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const uid = useId();
  const [form, setForm] = useState<ClienteInput>({
    nombre: defaultValues?.nombre ?? "",
    telefono: defaultValues?.telefono ?? "",
    correo: defaultValues?.correo ?? "",
    cedula: defaultValues?.cedula ?? "",
    fecha_nacimiento: defaultValues?.fecha_nacimiento ?? "",
    direccion: defaultValues?.direccion ?? "",
    sexo: defaultValues?.sexo ?? "",
    estado_civil: defaultValues?.estado_civil ?? "",
    ocupacion: defaultValues?.ocupacion ?? "",
    notas: defaultValues?.notas ?? "",
    propietario_id: defaultValues?.propietario_id ?? "",
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
          <FieldLabel htmlFor={`${uid}-2`}>Teléfono</FieldLabel>
          <Input
            id={`${uid}-2`}
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${uid}-3`}>Correo</FieldLabel>
          <Input
            id={`${uid}-3`}
            type="email"
            value={form.correo}
            onChange={(e) => setForm({ ...form, correo: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor={`${uid}-4`}>Cédula/RNC</FieldLabel>
          <Input
            id={`${uid}-4`}
            value={form.cedula}
            onChange={(e) => setForm({ ...form, cedula: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${uid}-5`}>Fecha de nacimiento</FieldLabel>
          <Input
            id={`${uid}-5`}
            type="date"
            value={form.fecha_nacimiento}
            onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
          />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-6`}>Dirección</FieldLabel>
        <Input
          id={`${uid}-6`}
          value={form.direccion}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <FieldLabel htmlFor={`${uid}-7`}>Sexo</FieldLabel>
          <Select
            id={`${uid}-7`}
            value={form.sexo}
            onChange={(e) =>
              setForm({ ...form, sexo: e.target.value as ClienteInput["sexo"] })
            }
          >
            <option value="">Sin especificar</option>
            {Object.entries(SEXO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor={`${uid}-8`}>Estado civil</FieldLabel>
          <Select
            id={`${uid}-8`}
            value={form.estado_civil}
            onChange={(e) =>
              setForm({
                ...form,
                estado_civil: e.target.value as ClienteInput["estado_civil"],
              })
            }
          >
            <option value="">Sin especificar</option>
            {Object.entries(ESTADO_CIVIL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor={`${uid}-9`}>Ocupación</FieldLabel>
          <Input
            id={`${uid}-9`}
            value={form.ocupacion}
            onChange={(e) => setForm({ ...form, ocupacion: e.target.value })}
          />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-10`}>Propietario</FieldLabel>
        <Select
          id={`${uid}-10`}
          value={form.propietario_id}
          onChange={(e) =>
            setForm({ ...form, propietario_id: e.target.value })
          }
        >
          <option value="">Sin asignar</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-11`}>Notas</FieldLabel>
        <Textarea
          id={`${uid}-11`}
          value={form.notas}
          onChange={(e) => setForm({ ...form, notas: e.target.value })}
          rows={3}
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
