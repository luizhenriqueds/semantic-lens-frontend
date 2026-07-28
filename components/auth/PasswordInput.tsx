"use client";

import { useState } from "react";
import { IconEye, IconEyeOff } from "@/lib/icons";

export default function PasswordInput({
  value,
  onChange,
  autoComplete = "current-password",
  minLength = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete?: "current-password" | "new-password";
  minLength?: number;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="au-pwd">
      <input
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
