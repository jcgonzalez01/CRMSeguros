"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "forgot" | "forgot-sent";

const FEATURES = [
  "Dashboard semanal con vencimientos, tareas y resumen financiero",
  "Clientes, pólizas y aseguradoras enlazados entre sí",
  "Pipeline de oportunidades y comisiones por corredor",
  "Datos compartidos en tiempo real con todo tu equipo",
];

function KaiSoftMark() {
  return (
    <div className="flex items-center gap-3 text-[13px]">
      <span className="text-gray-600">Desarrollado por</span>
      <span aria-hidden="true" className="h-4 w-px bg-gray-300" />
      <span className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 28 14"
          className="h-4 w-8 text-[#1c3f6e]"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 13V9C2 4.58 7.16 1 14 1s12 3.58 12 8v4"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm font-semibold tracking-wide">
          <span className="text-gray-900">KAI</span>{" "}
          <span className="text-blue-600">SOFT</span>
        </span>
      </span>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
        CS
      </div>
      <span className="text-lg font-semibold text-gray-900">CRM Seguros</span>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-b from-white to-blue-50">
      <div className="relative z-10 flex flex-1 flex-col justify-center px-16 py-12">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-medium text-blue-700">
          Para corredores de seguros
        </span>
        <h2 className="mt-6 text-3xl font-semibold leading-tight max-w-md text-gray-900">
          Todo tu negocio de corredor de seguros, en un solo lugar
        </h2>
        <p className="mt-4 text-gray-500 max-w-sm">
          Cualquiera de tu equipo que abra el enlace ve exactamente lo
          mismo, al instante — sin depender del navegador ni del
          dispositivo.
        </p>

        <Image
          src="/login-illustration.jpg"
          alt=""
          width={1680}
          height={945}
          priority
          className="mt-8 w-full max-w-xl rounded-xl"
        />

        <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 max-w-xl">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0 text-blue-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              <span className="text-sm text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/set-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMode("forgot-sent");
  }

  return (
    <div className="flex flex-1 min-h-screen">
      <div className="relative flex w-full lg:w-1/2 items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <BrandMark />
          </div>

          {mode === "login" && (
            <>
              <h1 className="text-2xl font-semibold text-gray-900">
                Bienvenido de nuevo
              </h1>
              <p className="text-sm text-gray-500 mt-2 mb-8">
                Ingresa con tu cuenta de equipo para continuar.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Correo
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError(null);
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="current-password"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "Ingresando…" : "Iniciar sesión"}
                </button>
              </form>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h1 className="text-2xl font-semibold text-gray-900">
                Restablecer contraseña
              </h1>
              <p className="text-sm text-gray-500 mt-2 mb-8">
                Ingresa tu correo y te enviamos un enlace para crear una
                contraseña nueva.
              </p>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium mb-1">
                    Correo
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="email"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "Enviando…" : "Enviar enlace"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Volver a iniciar sesión
                </button>
              </form>
            </>
          )}

          {mode === "forgot-sent" && (
            <>
              <h1 className="text-2xl font-semibold text-gray-900">Revisa tu correo</h1>
              <p className="text-sm text-gray-500 mt-2 mb-8">
                Si <span className="font-medium text-gray-700">{email}</span>{" "}
                tiene una cuenta, te llegará un enlace para crear una
                contraseña nueva.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Volver a iniciar sesión
              </button>
            </>
          )}
        </div>

        <div className="absolute bottom-6 inset-x-0 flex justify-center">
          <KaiSoftMark />
        </div>
      </div>

      <BrandPanel />
    </div>
  );
}
