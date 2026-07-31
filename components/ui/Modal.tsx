"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
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
    </div>
  );
}
