"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import AuthAlert from "@/components/auth/AuthAlert";
import GoogleButton from "@/components/auth/GoogleButton";
import PasswordInput from "@/components/auth/PasswordInput";
import { CONFIRM_ERRORS, signInError } from "@/lib/auth/messages";
import { safeRedirect } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));

  // Prefilled when the sign-up form bounces an address that already has an account.
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  // /auth/confirm has already redirected away, so this is the only account of what went wrong.
  const [error, setError] = useState(CONFIRM_ERRORS[params.get("error") ?? ""] ?? "");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError(signInError(error));
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

      <GoogleButton next={redirect} onError={setError} />

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
      <div className="au-field">
        <div className="au-fieldrow">
          <label htmlFor="password">Senha</label>
          <button type="button" className="au-minilink" onClick={resetPassword}>
            Esqueci minha senha
          </button>
        </div>
        <PasswordInput id="password" value={password} onChange={setPassword} />
      </div>

      <button className="btn solid au-submit" type="submit" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </button>
      <p className="au-swap">
        Não tem conta? <a href="/register">Criar agora</a>
      </p>
    </form>
  );
}
