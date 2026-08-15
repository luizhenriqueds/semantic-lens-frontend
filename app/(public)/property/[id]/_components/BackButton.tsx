"use client";

import { useRouter } from "next/navigation";
import { IconBack } from "@/lib/icons";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="backbtn"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/properties");
      }}
    >
      <IconBack width={18} height={18} strokeWidth={2} /> Voltar
    </button>
  );
}
