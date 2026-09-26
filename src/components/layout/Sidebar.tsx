"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/lib/types/database.types";
import type { ModuloKey } from "@/lib/permisos/server";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SignOutButton } from "./SignOutButton";

const MANAGER_NAV_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/plataforma", label: "Empresas", icon: "building" },
];

const NAV_ITEMS: {
  href: string;
  label: string;
  module?: ModuloKey;
  icon: IconName;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/oportunidades", label: "Oportunidades", module: "oportunidades", icon: "trend" },
  { href: "/clientes", label: "Clientes", module: "clientes", icon: "users" },
  { href: "/polizas", label: "Pólizas", module: "polizas", icon: "shield" },
  { href: "/aseguradoras", label: "Aseguradoras", module: "aseguradoras", icon: "building" },
  { href: "/tareas", label: "Tareas", module: "tareas", icon: "tasks" },
  { href: "/reportes", label: "Reportes", module: "reportes", icon: "chart" },
  { href: "/configuracion", label: "Configuración", icon: "sliders" },
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
          if (!("module" in item) || !item.module) return true; // Dashboard: siempre visible
          if (role === "Admin") return true; // Admin nunca consulta la matriz
          const permiso = permisos.find(
            (p) => p.role === role && p.modulo === item.module
          );
          return (permiso?.nivel ?? "bloqueado") !== "bloqueado";
        });

  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
              active
                ? "bg-blue-50 font-semibold text-blue-700"
                : "font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon name={item.icon} size={18} />
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
  subtitle,
  compact = false,
}: {
  logoUrl?: string | null;
  nombreComercial?: string | null;
  subtitle?: string | null;
  compact?: boolean;
}) {
  const boxSize = compact ? "h-8 w-8" : "h-[34px] w-[34px]";
  return (
    <div className="flex items-center gap-2.5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={nombreComercial ?? "Logo"}
          className={`${boxSize} rounded-[9px] object-contain`}
        />
      ) : (
        <div
          className={`flex ${boxSize} items-center justify-center rounded-[9px] bg-blue-600 text-sm font-bold text-white`}
        >
          CS
        </div>
      )}
      <div className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold tracking-tight text-gray-900">
          {nombreComercial || "CRM Seguros"}
        </span>
        {subtitle && !compact && (
          <span className="text-xs text-gray-600">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

function UserBlock({
  displayName,
  roleLabel,
}: {
  displayName: string;
  roleLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-3">
        <Avatar name={displayName} size="md" />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[13px] font-semibold text-gray-900">
            {displayName}
          </span>
          <span className="text-xs text-gray-600">{roleLabel}</span>
        </div>
      </div>
      <SignOutButton />
    </div>
  );
}

export function Sidebar({
  role,
  permisos = [],
  logoUrl,
  nombreComercial,
  displayName,
  empresaNombre,
}: {
  role: UserRole;
  permisos?: PermisoRow[];
  logoUrl?: string | null;
  nombreComercial?: string | null;
  displayName: string;
  empresaNombre?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const subtitle = role === "Manager" ? "Plataforma" : empresaNombre;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-[248px] md:shrink-0 md:flex-col md:justify-between md:gap-7 md:border-r md:border-gray-200 md:bg-white md:px-4 md:py-6">
        <div className="flex flex-col gap-7">
          <div className="px-2">
            <BrandMark
              logoUrl={logoUrl}
              nombreComercial={nombreComercial}
              subtitle={subtitle}
            />
          </div>
          <NavLinks role={role} permisos={permisos} />
        </div>
        <UserBlock displayName={displayName} roleLabel={role} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="flex h-[60px] items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
        <BrandMark logoUrl={logoUrl} nombreComercial={nombreComercial} compact />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-[10px] text-gray-700 hover:bg-gray-100"
        >
          <Icon name="menu" size={22} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-gray-900/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal"
            className="relative z-10 flex w-[304px] max-w-[85vw] flex-col justify-between gap-6 bg-white px-4 pb-5 pt-4 shadow-2xl"
          >
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between px-1">
                <BrandMark
                  logoUrl={logoUrl}
                  nombreComercial={nombreComercial}
                  subtitle={subtitle}
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
                  className="flex h-11 w-11 items-center justify-center rounded-[10px] text-gray-600 hover:bg-gray-100"
                >
                  <Icon name="x" size={20} strokeWidth={2} />
                </button>
              </div>
              <NavLinks
                role={role}
                permisos={permisos}
                onNavigate={() => setOpen(false)}
              />
            </div>
            <UserBlock displayName={displayName} roleLabel={role} />
          </div>
        </div>
      )}
    </>
  );
}
