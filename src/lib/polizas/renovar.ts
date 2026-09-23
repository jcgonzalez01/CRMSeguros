import type { PolizaInput } from "@/lib/actions/polizas";
import type { PolizaListItem } from "@/lib/hooks/usePolizas";

const MS_POR_DIA = 86400000;

// Preserves the original term length (e.g. ~365 days) starting from the
// old expiration date, instead of hardcoding "one year" — a semiannual or
// quarterly policy renews for the same length it had.
export function calcularRenovacion(p: PolizaListItem): Partial<PolizaInput> {
  const emisionAnterior = new Date(p.fecha_emision + "T00:00:00");
  const vencimientoAnterior = new Date(p.fecha_vencimiento + "T00:00:00");
  const terminoDias = Math.max(
    1,
    Math.round((vencimientoAnterior.getTime() - emisionAnterior.getTime()) / MS_POR_DIA)
  );

  const nuevaEmision = vencimientoAnterior;
  const nuevoVencimiento = new Date(nuevaEmision.getTime() + terminoDias * MS_POR_DIA);

  return {
    cliente_id: p.cliente_id,
    aseguradora_id: p.aseguradora_id,
    producto: p.producto,
    numero_poliza: "",
    fecha_emision: nuevaEmision.toISOString().slice(0, 10),
    fecha_vencimiento: nuevoVencimiento.toISOString().slice(0, 10),
    monto: p.monto,
    moneda: p.moneda,
    suma_asegurada: p.suma_asegurada,
    deducible: p.deducible,
    plan_pago: p.plan_pago,
    estado: "activa",
    propietario_id: p.propietario_id ?? "",
    beneficiarios: p.beneficiarios ?? "",
    notas: "",
    comision_tipo: p.comision_tipo ?? "",
    comision_valor: p.comision_valor,
  };
}
