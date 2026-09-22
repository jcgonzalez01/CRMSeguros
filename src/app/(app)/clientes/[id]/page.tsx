import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCliente, getClienteRelated } from "@/lib/queries/clientes";
import type { MonedaPoliza } from "@/lib/types/database.types";

const MONEDA_LOCALE: Record<MonedaPoliza, string> = { DOP: "es-DO", USD: "en-US" };

function formatMonto(monto: number | null, moneda: MonedaPoliza = "DOP") {
  if (monto === null) return "—";
  return new Intl.NumberFormat(MONEDA_LOCALE[moneda], {
    style: "currency",
    currency: moneda,
  }).format(monto);
}

function formatFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es").format(new Date(fecha));
}

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  let cliente;
  try {
    cliente = await getCliente(supabase, id);
  } catch {
    notFound();
  }

  const { polizas, oportunidades, tareas } = await getClienteRelated(
    supabase,
    id
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/clientes" className="text-sm text-blue-600 hover:underline">
          ← Clientes
        </Link>
        <h1 className="text-2xl font-semibold mt-1">{cliente.nombre}</h1>
        <p className="text-sm text-gray-500">
          {cliente.correo ?? "Sin correo"} · {cliente.telefono ?? "Sin teléfono"}
          {cliente.propietario ? ` · Propietario: ${cliente.propietario.full_name}` : ""}
        </p>
        {cliente.notas && (
          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{cliente.notas}</p>
        )}
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-2">Pólizas</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Número</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Producto</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Aseguradora</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Vencimiento</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Monto</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {polizas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-400">
                    Sin pólizas registradas.
                  </td>
                </tr>
              )}
              {polizas.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2">
                    <Link
                      href={`/polizas/${p.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {p.numero_poliza}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{p.producto}</td>
                  <td className="px-4 py-2">{p.aseguradora?.nombre ?? "—"}</td>
                  <td className="px-4 py-2">{formatFecha(p.fecha_vencimiento)}</td>
                  <td className="px-4 py-2">{formatMonto(p.monto, p.moneda)}</td>
                  <td className="px-4 py-2 capitalize">{p.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Oportunidades</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Título</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Monto estimado</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {oportunidades.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-400">
                    Sin oportunidades registradas.
                  </td>
                </tr>
              )}
              {oportunidades.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-2">{o.titulo}</td>
                  <td className="px-4 py-2">{formatMonto(o.monto_estimado)}</td>
                  <td className="px-4 py-2 capitalize">{o.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Tareas</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Título</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Fecha límite</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tareas.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-400">
                    Sin tareas registradas.
                  </td>
                </tr>
              )}
              {tareas.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2">{t.titulo}</td>
                  <td className="px-4 py-2">{formatFecha(t.fecha_limite)}</td>
                  <td className="px-4 py-2 capitalize">{t.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
