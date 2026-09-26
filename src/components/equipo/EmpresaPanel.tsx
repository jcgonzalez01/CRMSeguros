"use client";

import { useRef, useState, useId } from "react";
import { useRouter } from "next/navigation";
import {
  eliminarLogoEmpresa,
  guardarEmpresaPerfil,
  subirLogoEmpresa,
  type EmpresaPerfilInput,
} from "@/lib/actions/empresa";
import type { EmpresaPerfil } from "@/lib/queries/empresa";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input } from "@/components/ui/fields";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

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
  const uid = useId();
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

  const campos = [
    { key: "nombre_comercial", label: "Nombre comercial" },
    { key: "rnc", label: "RNC" },
    { key: "direccion", label: "Dirección", wide: true },
    { key: "telefono", label: "Teléfono" },
    { key: "correo", label: "Correo", type: "email" },
    { key: "sitio_web", label: "Sitio web", wide: true },
  ] as const;

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card aria-labelledby={`${uid}-logo`} className="flex flex-col gap-[18px] p-[22px]">
        <h2 id={`${uid}-logo`} className="text-[15px] font-semibold text-gray-900">
          Logo
        </h2>
        <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-dashed border-gray-300 bg-gray-50">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo de la empresa"
              className="h-full w-full object-contain p-3"
            />
          ) : (
            <span className="text-sm text-gray-600">Sin logo</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingLogo}
          >
            {uploadingLogo ? "Subiendo…" : logoUrl ? "Reemplazar logo" : "Subir logo"}
          </Button>
          {logoUrl && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleRemoveLogo}
              disabled={removingLogo}
            >
              {removingLogo ? "Quitando…" : "Quitar logo"}
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleLogoChange}
          className="hidden"
        />
        <div>
          <p className="text-[13px] text-gray-600">PNG, JPEG o WebP. Máximo 2MB.</p>
          {logoError && <p className="mt-1 text-[13px] text-danger-700">{logoError}</p>}
        </div>
        <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
          <span className="text-xs font-medium text-gray-600">Así se verá en el menú</span>
          <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-[34px] w-[34px] rounded-[9px] object-contain"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-blue-600 text-sm font-bold text-white"
              >
                CS
              </div>
            )}
            <span className="text-[15px] font-semibold tracking-tight text-gray-900">
              {perfil?.nombre_comercial || "CRM Seguros"}
            </span>
          </div>
        </div>
      </Card>

      <Card aria-labelledby={`${uid}-datos`}>
        <CardHeader title="Datos de la empresa" id={`${uid}-datos`} />
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {campos.map((c, i) => {
              const id = `${uid}-${i + 1}`;
              return (
                <div
                  key={c.key}
                  className={"wide" in c && c.wide ? "sm:col-span-2" : undefined}
                >
                  <FieldLabel htmlFor={id}>{c.label}</FieldLabel>
                  <Input
                    id={id}
                    type={"type" in c ? c.type : undefined}
                    value={form[c.key]}
                    onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                  />
                </div>
              );
            })}
          </div>

          {error && <p className="text-sm text-danger-700">{error}</p>}

          <div className="flex items-center gap-3.5 pt-1">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
            {success && !error && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-success-700"
              >
                <Icon name="check" size={15} strokeWidth={2.5} />
                Guardado.
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
