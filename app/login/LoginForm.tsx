"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import AuthAlert from "@/components/auth/AuthAlert";
import PasswordInput from "@/components/auth/PasswordInput";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";

  // Prefilled when the sign-up form bounces an address that already has an account.
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError("E-mail ou senha inválidos.");
      setBusy(false);
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  async function resetPassword() {
    if (!email) {
      setError("Informe seu e-mail para redefinir a senha.");
      return;
    }
    setError("");
    await requestPasswordReset(email);
    setNotice("Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.");
  }

  return (
    <form className="au-form" onSubmit={submit}>
      <h1>Entrar</h1>
      <p className="sub">Acompanhe leilões, salve imóveis e receba alertas.</p>

      {error && <AuthAlert kind="bad" message={error} />}
      {notice && <AuthAlert kind="good" message={notice} />}

      <label className="au-field">
        <span>E-mail</span>
        <input
          type="email"
          placeholder="voce@exemplo.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="au-field">
        <div className="au-fieldrow">
          <span>Senha</span>
          <button type="button" className="au-minilink" onClick={resetPassword}>
            Esqueci minha senha
          </button>
        </div>
        <PasswordInput value={password} onChange={setPassword} />
      </label>

      <button className="btn solid au-submit" type="submit" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </button>
      <p className="au-swap">
        Não tem conta? <a href="/register">Criar agora</a>
      </p>
    </form>
  );
}
