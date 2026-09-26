"use client";

import { Button } from "./Button";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Eliminar",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm leading-6 text-gray-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Eliminando…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
