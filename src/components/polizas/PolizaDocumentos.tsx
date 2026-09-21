"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { listPolizaDocumentos } from "@/lib/queries/poliza-documentos";
import {
  deletePolizaDocumento,
  getPolizaDocumentoUrl,
  uploadPolizaDocumento,
} from "@/lib/actions/poliza-documentos";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
    <div className="border-t border-gray-100 pt-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">Documentos</p>
        <label className="text-sm text-blue-600 hover:underline cursor-pointer">
          {uploading ? "Subiendo…" : "Subir archivo"}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {isLoading && <p className="text-sm text-gray-400">Cargando…</p>}
      {!isLoading && documentos?.length === 0 && (
        <p className="text-sm text-gray-400">Sin documentos todavía.</p>
      )}

      {documentos && documentos.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
          {documentos.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{doc.nombre_archivo}</p>
                <p className="text-xs text-gray-400">
                  {formatSize(doc.size_bytes)} · {formatFecha(doc.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 gap-3 ml-3">
                <button
                  onClick={() => handleDownload(doc.id)}
                  className="text-blue-600 hover:underline"
                >
                  Descargar
                </button>
                <button
                  onClick={() => setDeleting({ id: doc.id, nombre: doc.nombre_archivo })}
                  className="text-red-600 hover:underline"
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
    </div>
  );
}
