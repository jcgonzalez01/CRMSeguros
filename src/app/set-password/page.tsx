"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input } from "@/components/ui/fields";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-canvas px-4 py-10">
      <div className="flex w-full max-w-[440px] flex-col gap-7 rounded-[18px] border border-gray-200 bg-white p-10 shadow-[0_12px_32px_rgba(16,24,40,0.08)]">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-[19px] font-bold text-white">
            CS
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">
            Bienvenido
          </h1>
          <p className="text-sm leading-normal text-gray-600">
            Crea tu contraseña para terminar de unirte al equipo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          <div>
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              aria-describedby={error ? "set-password-error" : undefined}
              className="h-11!"
            />
          </div>

          <div>
            <FieldLabel htmlFor="confirm">Confirmar contraseña</FieldLabel>
            <Input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              aria-describedby={error ? "set-password-error" : undefined}
              className="h-11!"
            />
          </div>

          {error && (
            <p id="set-password-error" role="alert" className="text-[13px] text-danger-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="h-[46px]! w-full text-[15px]!">
            {loading ? "Guardando…" : "Crear contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
}
