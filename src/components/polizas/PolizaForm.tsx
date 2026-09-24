"use client";

import { useState } from "react";
import type { PolizaInput } from "@/lib/actions/polizas";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cliente *</label>
          <select
            required
            value={form.cliente_id}
            onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Aseguradora *</label>
          <select
            required
            value={form.aseguradora_id}
            onChange={(e) => setForm({ ...form, aseguradora_id: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {aseguradoras.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Producto *</label>
          <input
            required
            value={form.producto}
            onChange={(e) => setForm({ ...form, producto: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Número de póliza *</label>
          <input
            required
            value={form.numero_poliza}
            onChange={(e) => setForm({ ...form, numero_poliza: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fecha de emisión *</label>
          <input
            type="date"
            required
            value={form.fecha_emision}
            onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha de vencimiento *</label>
          <input
            type="date"
            required
            value={form.fecha_vencimiento}
            onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Monto *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: Number(e.target.value) })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Moneda *</label>
          <select
            value={form.moneda}
            onChange={(e) =>
              setForm({ ...form, moneda: e.target.value as PolizaInput["moneda"] })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(MONEDA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Plan de pago *</label>
          <select
            value={form.plan_pago}
            onChange={(e) =>
              setForm({ ...form, plan_pago: e.target.value as PolizaInput["plan_pago"] })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(PLAN_PAGO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Suma asegurada</label>
          <input
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Deducible</label>
          <input
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Estado *</label>
          <select
            value={form.estado}
            onChange={(e) =>
              setForm({ ...form, estado: e.target.value as PolizaInput["estado"] })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(ESTADO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Propietario</label>
          <select
            value={form.propietario_id}
            onChange={(e) => setForm({ ...form, propietario_id: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin asignar</option>
            {propietarios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Oportunidad de origen</label>
        <select
          value={form.oportunidad_id}
          onChange={(e) => setForm({ ...form, oportunidad_id: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sin oportunidad</option>
          {oportunidades.map((o) => (
            <option key={o.id} value={o.id}>
              {o.titulo}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Comisión</label>
          <select
            value={form.comision_tipo}
            onChange={(e) =>
              setForm({
                ...form,
                comision_tipo: e.target.value as PolizaInput["comision_tipo"],
                comision_valor: e.target.value ? form.comision_valor : null,
              })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin comisión</option>
            <option value="monto">Monto fijo</option>
            <option value="porcentaje">Porcentaje</option>
          </select>
        </div>
        {form.comision_tipo && (
          <div>
            <label className="block text-sm font-medium mb-1">
              {form.comision_tipo === "porcentaje" ? "Porcentaje (%)" : "Monto de comisión"}
            </label>
            <input
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Beneficiarios</label>
        <input
          value={form.beneficiarios}
          onChange={(e) => setForm({ ...form, beneficiarios: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notas</label>
        <textarea
          value={form.notas}
          onChange={(e) => setForm({ ...form, notas: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          {loading ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
