import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCliente, getClienteRelated } from "@/lib/queries/clientes";
import { listDependientes } from "@/lib/queries/dependientes";
import { getAccesoModulo } from "@/lib/permisos/server";
import { DependientesPanel } from "@/components/clientes/DependientesPanel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import {
  TableCell,
  TableHead,
  TableHeader,
  TableMessage,
  TableRow,
} from "@/components/ui/Table";
import type {
  MonedaPoliza,
  TaskStatus,
} from "@/lib/types/database.types";

const POLIZAS_COLS = "grid-cols-[120px_minmax(0,1.3fr)_minmax(0,1.2fr)_100px_120px_100px]";

const POLIZA_TONE: Record<string, BadgeTone> = {
  activa: "green",
  vencida: "amber",
  cancelada: "neutral",
};

const OPORTUNIDAD_TONE: Record<string, BadgeTone> = {
  abierta: "blue",
  ganada: "green",
  perdida: "red",
};

const TAREA_LABEL: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  en_espera: "En espera",
  vencida: "Vencida",
  completada: "Completada",
  cancelada: "Cancelada",
};

const TAREA_TONE: Record<TaskStatus, BadgeTone> = {
  pendiente: "neutral",
  en_progreso: "blue",
  en_espera: "amber",
  vencida: "red",
  completada: "green",
  cancelada: "neutral",
};

const MONEDA_LOCALE: Record<MonedaPoliza, string> = { DOP: "es-DO", USD: "en-US" };

const SEXO_LABELS: Record<string, string> = { M: "Masculino", F: "Femenino" };

const ESTADO_CIVIL_LABELS: Record<string, string> = {
  soltero: "Soltero/a",
  casado: "Casado/a",
  divorciado: "Divorciado/a",
  viudo: "Viudo/a",
  union_libre: "Unión libre",
};

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-gray-600">{label}</dt>
      <dd className="m-0 text-sm font-medium text-gray-900">{children}</dd>
    </div>
  );
}

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

  const [{ polizas, oportunidades, tareas }, dependientes, nivel] = await Promise.all([
    getClienteRelated(supabase, id),
    listDependientes(supabase, id),
    getAccesoModulo(supabase, "clientes"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3.5">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-blue-700 hover:underline"
        >
          <Icon name="arrowLeft" size={14} strokeWidth={2.25} />
          Clientes
        </Link>
        <div className="flex items-center gap-[18px]">
          <Avatar name={cliente.nombre} size="xl" />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-gray-900">
              {cliente.nombre}
            </h1>
            <p className="text-sm text-gray-600">
              {cliente.correo ?? "Sin correo"} · {cliente.telefono ?? "Sin teléfono"}
              {cliente.propietario ? ` · Propietario: ${cliente.propietario.full_name}` : ""}
            </p>
          </div>
        </div>
        {cliente.notas && (
          <p className="max-w-[760px] whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {cliente.notas}
          </p>
        )}
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card aria-labelledby="cliente-datos">
            <CardHeader id="cliente-datos" title="Datos del cliente" />
            <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-5 sm:grid-cols-3">
              <Campo label="Cédula/RNC">{cliente.cedula ?? "—"}</Campo>
              <Campo label="Fecha de nacimiento">{formatFecha(cliente.fecha_nacimiento)}</Campo>
              <Campo label="Dirección">{cliente.direccion ?? "—"}</Campo>
              <Campo label="Sexo">
                {cliente.sexo ? (SEXO_LABELS[cliente.sexo] ?? cliente.sexo) : "—"}
              </Campo>
              <Campo label="Estado civil">
                {cliente.estado_civil
                  ? (ESTADO_CIVIL_LABELS[cliente.estado_civil] ?? cliente.estado_civil)
                  : "—"}
              </Campo>
              <Campo label="Ocupación">{cliente.ocupacion ?? "—"}</Campo>
            </dl>
          </Card>

          <Card aria-labelledby="cliente-polizas" className="overflow-hidden">
            <CardHeader id="cliente-polizas" title="Pólizas" />
            <div className="overflow-x-auto">
              <div role="table" aria-label="Pólizas del cliente" className="min-w-[720px]">
                <TableHeader cols={POLIZAS_COLS}>
                  <TableHead>Número</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Aseguradora</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableHeader>
                {polizas.length === 0 && <TableMessage>Sin pólizas registradas.</TableMessage>}
                {polizas.map((p) => (
                  <TableRow key={p.id} cols={POLIZAS_COLS}>
                    <TableCell>
                      <Link
                        href={`/polizas/${p.id}`}
                        className="font-mono text-[13px] font-medium text-blue-700 hover:underline"
                      >
                        {p.numero_poliza}
                      </Link>
                    </TableCell>
                    <TableCell className="truncate font-medium">{p.producto}</TableCell>
                    <TableCell className="truncate text-gray-600">
                      {p.aseguradora?.nombre ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatFecha(p.fecha_vencimiento)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatMonto(p.monto, p.moneda)}
                    </TableCell>
                    <TableCell>
                      <Badge tone={POLIZA_TONE[p.estado] ?? "neutral"} className="capitalize">
                        {p.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </div>
            </div>
          </Card>

          <DependientesPanel
            clienteId={id}
            initialDependientes={dependientes}
            puedeEditar={nivel === "editar"}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card aria-labelledby="cliente-oportunidades">
            <CardHeader id="cliente-oportunidades" title="Oportunidades" />
            {oportunidades.length === 0 ? (
              <p className="px-5 py-5 text-sm text-gray-600">Sin oportunidades registradas.</p>
            ) : (
              <ul className="m-0 list-none px-5 pb-2 pt-1">
                {oportunidades.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-3 border-t border-gray-100 py-3 first:border-t-0"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-900">{o.titulo}</span>
                      <span className="text-[13px] tabular-nums text-gray-600">
                        {formatMonto(o.monto_estimado)}
                      </span>
                    </div>
                    <Badge tone={OPORTUNIDAD_TONE[o.estado] ?? "neutral"} className="capitalize">
                      {o.estado}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card aria-labelledby="cliente-tareas">
            <CardHeader id="cliente-tareas" title="Tareas" />
            {tareas.length === 0 ? (
              <p className="px-5 py-5 text-sm text-gray-600">Sin tareas registradas.</p>
            ) : (
              <ul className="m-0 list-none px-5 pb-2 pt-1">
                {tareas.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 border-t border-gray-100 py-3 first:border-t-0"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-900">{t.titulo}</span>
                      <span className="text-[13px] tabular-nums text-gray-600">
                        Vence {formatFecha(t.fecha_limite)}
                      </span>
                    </div>
                    <Badge tone={TAREA_TONE[t.estado] ?? "neutral"}>
                      {TAREA_LABEL[t.estado] ?? t.estado}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
