"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  eliminarLogoEmpresa,
  guardarEmpresaPerfil,
  subirLogoEmpresa,
  type EmpresaPerfilInput,
} from "@/lib/actions/empresa";
import type { EmpresaPerfil } from "@/lib/queries/empresa";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

function toFormInput(perfil: EmpresaPerfil | null): EmpresaPerfilInput {
  return {
    nombre_comercial: perfil?.nombre_comercial ?? "",
    rnc: perfil?.rnc ?? "",
    direccion: perfil?.direccion ?? "",
    telefono: perfil?.telefono ?? "",
    correo: perfil?.correo ?? "",
    sitio_web: perfil?.sitio_web ?? "",
  };
}

export function EmpresaPanel({
  perfil,
  logoUrl,
}: {
  perfil: EmpresaPerfil | null;
  logoUrl: string | null;
}) {
  const [form, setForm] = useState<EmpresaPerfilInput>(toFormInput(perfil));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await guardarEmpresaPerfil(form);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setLogoError(null);
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setLogoError("El logo debe ser PNG, JPEG o WebP.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("El logo no puede superar 2MB.");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      await subirLogoEmpresa(formData);
      router.refresh();
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "No se pudo subir el logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    setLogoError(null);
    setRemovingLogo(true);
    try {
      await eliminarLogoEmpresa();
      router.refresh();
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "No se pudo quitar el logo");
    } finally {
      setRemovingLogo(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Logo</h2>
        <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo de la empresa" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-gray-400">Sin logo</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {uploadingLogo ? "Subiendo…" : logoUrl ? "Reemplazar logo" : "Subir logo"}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={removingLogo}
                  className="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {removingLogo ? "Quitando…" : "Quitar logo"}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoChange}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-2">PNG, JPEG o WebP. Máximo 2MB.</p>
            {logoError && <p className="text-xs text-red-600 mt-1">{logoError}</p>}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Datos de la empresa</h2>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre comercial</label>
              <input
                value={form.nombre_comercial}
                onChange={(e) => setForm({ ...form, nombre_comercial: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RNC</label>
              <input
                value={form.rnc}
                onChange={(e) => setForm({ ...form, rnc: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Dirección</label>
              <input
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Correo</label>
              <input
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Sitio web</label>
              <input
                value={form.sitio_web}
                onChange={(e) => setForm({ ...form, sitio_web: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && !error && <p className="text-sm text-green-700">Guardado.</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
