"use client";

import { useState } from "react";
import { IconEye, IconEyeOff } from "@/lib/icons";

export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete = "current-password",
  minLength = 6,
  className,
}: {
  /** Needs a sibling <label htmlFor>: wrapping would pull the show/hide button into the name. */
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: "current-password" | "new-password";
  minLength?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="au-pwd">
      <input
        id={id}
        className={className}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="au-pwd-toggle"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={shown}
        title={shown ? "Ocultar senha" : "Mostrar senha"}
      >
        {shown ? (
          <IconEyeOff width={18} height={18} strokeWidth={1.7} />
        ) : (
          <IconEye width={18} height={18} strokeWidth={1.7} />
        )}
      </button>
    </div>
  );
}
