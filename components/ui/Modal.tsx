"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "@/lib/icons";

/** Backdrop, Escape, scroll lock and the close button, in one place. */
export default function Modal({
  label,
  className = "",
  role = "dialog",
  onClose,
  children,
}: {
  label: string;
  className?: string;
  role?: "dialog" | "alertdialog";
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Without this the keyboard and screen reader stay on the trigger behind the backdrop.
    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, [onClose]);

  // Portalled: otherwise an ancestor's scoped CSS or transform could leak into or clip the dialog.
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`modal ${className}`.trim()}
        role={role}
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-x" type="button" aria-label="Fechar" onClick={onClose}>
          <IconClose width={18} height={18} strokeWidth={2} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
