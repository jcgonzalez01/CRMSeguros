"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/polizas", label: "Pólizas" },
  { href: "/aseguradoras", label: "Aseguradoras" },
  { href: "/oportunidades", label: "Oportunidades" },
  { href: "/tareas", label: "Tareas" },
  { href: "/equipo", label: "Equipo" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-gray-200 md:bg-white md:px-3 md:py-4">
        <div className="px-2 pb-4 text-lg font-semibold">CRM Seguros</div>
        <NavLinks />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="md:hidden flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <span className="text-lg font-semibold">CRM Seguros</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="rounded-md p-2 hover:bg-gray-100"
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
              <span className="text-lg font-semibold">CRM Seguros</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-md p-2 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
