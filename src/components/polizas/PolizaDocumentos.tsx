"use client";

import { useId, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { listPolizaDocumentos } from "@/lib/queries/poliza-documentos";
import {
  deletePolizaDocumento,
  getPolizaDocumentoUrl,
  uploadPolizaDocumento,
} from "@/lib/actions/poliza-documentos";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

function formatSize(bytes: number | null) {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es").format(new Date(fecha));
}

export function PolizaDocumentos({ polizaId }: { polizaId: string }) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; nombre: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data: documentos, isLoading } = useQuery({
    queryKey: ["poliza-documentos", polizaId],
    queryFn: () => listPolizaDocumentos(createClient(), polizaId),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      await uploadPolizaDocumento(polizaId, formData);
      queryClient.invalidateQueries({ queryKey: ["poliza-documentos", polizaId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el archivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(id: string) {
    try {
      const url = await getPolizaDocumentoUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el archivo");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deletePolizaDocumento(deleting.id);
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["poliza-documentos", polizaId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el archivo");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <Card aria-labelledby={titleId}>
      <CardHeader
        id={titleId}
        title="Documentos"
        action={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Subiendo…" : "Subir archivo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </>
        }
      />

      {error && <p className="px-5 pt-3 text-sm text-danger-700">{error}</p>}

      {isLoading && <p className="px-5 py-4 text-sm text-gray-600">Cargando…</p>}
      {!isLoading && documentos?.length === 0 && (
        <p className="px-5 py-4 text-sm text-gray-600">Sin documentos todavía.</p>
      )}

      {documentos && documentos.length > 0 && (
        <ul className="px-5 pb-2">
          {documentos.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 border-t border-gray-100 py-3 first:border-t-0"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-gray-900">
                  {doc.nombre_archivo}
                </span>
                <span className="text-xs text-gray-600">
                  {[formatSize(doc.size_bytes), formatFecha(doc.created_at)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownload(doc.id)}
                  aria-label={`Descargar ${doc.nombre_archivo}`}
                  className="text-[13px] font-semibold text-blue-700 hover:underline"
                >
                  Descargar
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting({ id: doc.id, nombre: doc.nombre_archivo })}
                  aria-label={`Eliminar ${doc.nombre_archivo}`}
                  className="text-[13px] font-semibold text-danger-700 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar documento"
        message={`¿Seguro que quieres eliminar "${deleting?.nombre}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Card>
  );
}
