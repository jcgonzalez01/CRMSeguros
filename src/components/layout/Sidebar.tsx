"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/lib/types/database.types";
import type { ModuloKey } from "@/lib/permisos/server";

const MANAGER_NAV_ITEMS = [
  {
    href: "/plataforma",
    label: "Empresas",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"
      />
    ),
  },
];

const NAV_ITEMS: {
  href: string;
  label: string;
  module?: ModuloKey;
  icon: React.ReactNode;
}[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
      />
    ),
  },
  {
    href: "/clientes",
    label: "Clientes",
    module: "clientes",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    ),
  },
  {
    href: "/polizas",
    label: "Pólizas",
    module: "polizas",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  {
    href: "/aseguradoras",
    label: "Aseguradoras",
    module: "aseguradoras",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"
      />
    ),
  },
  {
    href: "/oportunidades",
    label: "Oportunidades",
    module: "oportunidades",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
      />
    ),
  },
  {
    href: "/tareas",
    label: "Tareas",
    module: "tareas",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286Z"
      />
    ),
  },
  {
    href: "/reportes",
    label: "Reportes",
    module: "reportes",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22M4.5 4.5v15h15"
      />
    ),
  },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
      />
    ),
  },
];

type PermisoRow = { role: string; modulo: string; nivel: string };

function NavLinks({
  role,
  permisos,
  onNavigate,
}: {
  role: UserRole;
  permisos: PermisoRow[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items =
    role === "Manager"
      ? MANAGER_NAV_ITEMS
      : NAV_ITEMS.filter((item) => {
          if (item.href === "/configuracion") return role === "Admin";
          if (!item.module) return true; // Dashboard: siempre visible
          if (role === "Admin") return true; // Admin nunca consulta la matriz
          const permiso = permisos.find(
            (p) => p.role === role && p.modulo === item.module
          );
          return (permiso?.nivel ?? "bloqueado") !== "bloqueado";
        });

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
            >
              {item.icon}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandMark({
  logoUrl,
  nombreComercial,
  compact = false,
}: {
  logoUrl?: string | null;
  nombreComercial?: string | null;
  compact?: boolean;
}) {
  const boxSize = compact ? "h-7 w-7" : "h-8 w-8";
  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "px-2 pb-6"}`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={nombreComercial ?? "Logo"}
          className={`${boxSize} rounded-md object-contain`}
        />
      ) : (
        <div
          className={`flex ${boxSize} items-center justify-center rounded-md bg-blue-600 font-bold text-white ${compact ? "text-xs" : "text-sm"}`}
        >
          CS
        </div>
      )}
      <span className={`${compact ? "text-base" : "text-lg"} font-semibold text-gray-900`}>
        {nombreComercial || "CRM Seguros"}
      </span>
    </div>
  );
}

export function Sidebar({
  role,
  permisos = [],
  logoUrl,
  nombreComercial,
}: {
  role: UserRole;
  permisos?: PermisoRow[];
  logoUrl?: string | null;
  nombreComercial?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-gray-200 md:bg-white md:px-3 md:py-5">
        <BrandMark logoUrl={logoUrl} nombreComercial={nombreComercial} />
        <NavLinks role={role} permisos={permisos} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="md:hidden flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <BrandMark logoUrl={logoUrl} nombreComercial={nombreComercial} compact />
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-64 bg-white px-3 py-4 shadow-xl">
            <div className="flex items-center justify-between px-2 pb-4">
              <BrandMark logoUrl={logoUrl} nombreComercial={nombreComercial} compact />
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <NavLinks role={role} permisos={permisos} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
