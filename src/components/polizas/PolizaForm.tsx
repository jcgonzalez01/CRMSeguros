"use client";

import { useState, useId } from "react";
import type { PolizaInput } from "@/lib/actions/polizas";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/fields";

export interface Option {
  id: string;
  nombre?: string;
  full_name?: string;
}

const PLAN_PAGO_LABELS: Record<PolizaInput["plan_pago"], string> = {
  unico: "Único",
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const ESTADO_LABELS: Record<PolizaInput["estado"], string> = {
  activa: "Activa",
  vencida: "Vencida",
  cancelada: "Cancelada",
};

const MONEDA_LABELS: Record<PolizaInput["moneda"], string> = {
  DOP: "RD$",
  USD: "US$",
};

export function PolizaForm({
  defaultValues,
  clientes,
  aseguradoras,
  propietarios,
  oportunidades = [],
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  defaultValues?: Partial<PolizaInput>;
  clientes: Option[];
  aseguradoras: Option[];
  propietarios: Option[];
  oportunidades?: { id: string; titulo: string }[];
  onSubmit: (input: PolizaInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const uid = useId();
  const [form, setForm] = useState<PolizaInput>({
    cliente_id: defaultValues?.cliente_id ?? "",
    aseguradora_id: defaultValues?.aseguradora_id ?? "",
    producto: defaultValues?.producto ?? "",
    numero_poliza: defaultValues?.numero_poliza ?? "",
    fecha_emision: defaultValues?.fecha_emision ?? "",
    fecha_vencimiento: defaultValues?.fecha_vencimiento ?? "",
    monto: defaultValues?.monto ?? 0,
    moneda: defaultValues?.moneda ?? "DOP",
    suma_asegurada: defaultValues?.suma_asegurada ?? null,
    deducible: defaultValues?.deducible ?? null,
    plan_pago: defaultValues?.plan_pago ?? "mensual",
    estado: defaultValues?.estado ?? "activa",
    propietario_id: defaultValues?.propietario_id ?? "",
    oportunidad_id: defaultValues?.oportunidad_id ?? "",
    beneficiarios: defaultValues?.beneficiarios ?? "",
    notas: defaultValues?.notas ?? "",
    comision_tipo: defaultValues?.comision_tipo ?? "",
    comision_valor: defaultValues?.comision_valor ?? null,
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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      <div>
        <FieldLabel htmlFor={`${uid}-1`}>Cliente *</FieldLabel>
        <Select
          id={`${uid}-1`}
          required
          value={form.cliente_id}
          onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-2`}>Aseguradora *</FieldLabel>
        <Select
          id={`${uid}-2`}
          required
          value={form.aseguradora_id}
          onChange={(e) => setForm({ ...form, aseguradora_id: e.target.value })}
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {aseguradoras.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-3`}>Producto *</FieldLabel>
        <Input
          id={`${uid}-3`}
          required
          value={form.producto}
          onChange={(e) => setForm({ ...form, producto: e.target.value })}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-4`}>Número de póliza *</FieldLabel>
        <Input
          id={`${uid}-4`}
          required
          value={form.numero_poliza}
          onChange={(e) => setForm({ ...form, numero_poliza: e.target.value })}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-5`}>Fecha de emisión *</FieldLabel>
        <Input
          id={`${uid}-5`}
          type="date"
          required
          value={form.fecha_emision}
          onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-6`}>Fecha de vencimiento *</FieldLabel>
        <Input
          id={`${uid}-6`}
          type="date"
          required
          value={form.fecha_vencimiento}
          onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-7`}>Monto *</FieldLabel>
        <Input
          id={`${uid}-7`}
          type="number"
          min="0"
          step="0.01"
          required
          value={form.monto}
          onChange={(e) => setForm({ ...form, monto: Number(e.target.value) })}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-8`}>Moneda *</FieldLabel>
        <Select
          id={`${uid}-8`}
          value={form.moneda}
          onChange={(e) =>
            setForm({ ...form, moneda: e.target.value as PolizaInput["moneda"] })
          }
        >
          {Object.entries(MONEDA_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-9`}>Plan de pago *</FieldLabel>
        <Select
          id={`${uid}-9`}
          value={form.plan_pago}
          onChange={(e) =>
            setForm({ ...form, plan_pago: e.target.value as PolizaInput["plan_pago"] })
          }
        >
          {Object.entries(PLAN_PAGO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-10`}>Suma asegurada</FieldLabel>
        <Input
          id={`${uid}-10`}
          type="number"
          min="0"
          step="0.01"
          value={form.suma_asegurada ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              suma_asegurada: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-11`}>Deducible</FieldLabel>
        <Input
          id={`${uid}-11`}
          type="number"
          min="0"
          step="0.01"
          value={form.deducible ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              deducible: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-12`}>Estado *</FieldLabel>
        <Select
          id={`${uid}-12`}
          value={form.estado}
          onChange={(e) =>
            setForm({ ...form, estado: e.target.value as PolizaInput["estado"] })
          }
        >
          {Object.entries(ESTADO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-13`}>Propietario</FieldLabel>
        <Select
          id={`${uid}-13`}
          value={form.propietario_id}
          onChange={(e) => setForm({ ...form, propietario_id: e.target.value })}
        >
          <option value="">Sin asignar</option>
          {propietarios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-14`}>Oportunidad de origen</FieldLabel>
        <Select
          id={`${uid}-14`}
          value={form.oportunidad_id}
          onChange={(e) => setForm({ ...form, oportunidad_id: e.target.value })}
        >
          <option value="">Sin oportunidad</option>
          {oportunidades.map((o) => (
            <option key={o.id} value={o.id}>
              {o.titulo}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <FieldLabel htmlFor={`${uid}-15`}>Comisión</FieldLabel>
        <Select
          id={`${uid}-15`}
          value={form.comision_tipo}
          onChange={(e) =>
            setForm({
              ...form,
              comision_tipo: e.target.value as PolizaInput["comision_tipo"],
              comision_valor: e.target.value ? form.comision_valor : null,
            })
          }
        >
          <option value="">Sin comisión</option>
          <option value="monto">Monto fijo</option>
          <option value="porcentaje">Porcentaje</option>
        </Select>
      </div>

      {form.comision_tipo && (
        <div>
          <FieldLabel htmlFor={`${uid}-16`}>
            {form.comision_tipo === "porcentaje" ? "Porcentaje (%)" : "Monto de comisión"}
          </FieldLabel>
          <Input
            id={`${uid}-16`}
            type="number"
            min="0"
            step={form.comision_tipo === "porcentaje" ? "0.1" : "0.01"}
            required
            value={form.comision_valor ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                comision_valor: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </div>
      )}

      <div
        className={
          form.comision_tipo ? "sm:col-span-2" : "sm:col-span-2 md:col-span-3"
        }
      >
        <FieldLabel htmlFor={`${uid}-17`}>Beneficiarios</FieldLabel>
        <Input
          id={`${uid}-17`}
          value={form.beneficiarios}
          onChange={(e) => setForm({ ...form, beneficiarios: e.target.value })}
        />
      </div>

      <div className="sm:col-span-2 md:col-span-3">
        <FieldLabel htmlFor={`${uid}-18`}>Notas</FieldLabel>
        <Textarea
          id={`${uid}-18`}
          value={form.notas}
          onChange={(e) => setForm({ ...form, notas: e.target.value })}
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-danger-700 sm:col-span-2 md:col-span-3">{error}</p>}

      <div className="flex justify-end gap-3 pt-2 sm:col-span-2 md:col-span-3">
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
