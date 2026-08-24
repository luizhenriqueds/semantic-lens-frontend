"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconPencil, IconTrash } from "@/lib/icons";
import { useScrollLock } from "@/lib/useScrollLock";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  icon,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Overrides the default pencil for a dialog that is not an edit. */
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  // Portalled: a hover-transformed ancestor (e.g. a lifting card) would otherwise clip this fixed backdrop.
  return createPortal(
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mico${danger ? " danger" : ""}`}>
          {icon ??
            (danger ? (
              <IconTrash width={22} height={22} strokeWidth={1.8} />
            ) : (
              <IconPencil width={22} height={22} strokeWidth={1.8} />
            ))}
        </div>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="mrow">
          <button className="btn ghost" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className={`btn ${danger ? "danger" : "solid"}`}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
