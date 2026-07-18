"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError("Não foi possível atualizar a senha. Peça um novo link.");
      setBusy(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form className="au-form" onSubmit={submit}>
      <h1>Criar nova senha</h1>
      <p className="sub">Escolha uma senha para voltar a acessar sua conta.</p>

      {error && <p className="au-err">{error}</p>}

      <label className="au-field">
        <span>Nova senha</span>
        <input
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <small className="au-hint">Mínimo de 6 caracteres.</small>
      </label>

      <button className="btn solid au-submit" type="submit" disabled={busy}>
        {busy ? "Salvando…" : "Salvar senha"}
      </button>
    </form>
  );
}
