"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { registerAccount } from "@/app/actions/auth";
import AuthAlert from "@/components/auth/AuthAlert";
import PasswordInput from "@/components/auth/PasswordInput";
import type { RegisterError } from "@/lib/auth/messages";

export default function RegisterForm() {
  const plan = useSearchParams().get("plan") ?? undefined;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<RegisterError | null>(null);
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSentTo("");
    const result = await registerAccount({ name, email, password, plan });
    setBusy(false);
    if (result.error) setError(result.error);
    else setSentTo(email);
  }

  return (
    <form className="au-form" onSubmit={submit}>
      <h1>Criar conta</h1>
      <p className="sub">Comece a acompanhar leilões em todo o Brasil.</p>

      {error && (
        <AuthAlert
          kind="bad"
          message={error.message}
          hint={error.hint}
          action={
            error.existing && (
              <Link href={`/login?email=${encodeURIComponent(email)}`}>
                Entrar com este e-mail →
              </Link>
            )
          }
        />
      )}
      {sentTo && (
        <AuthAlert
          kind="good"
          message={
            <>
              Enviamos um link de confirmação para <b>{sentTo}</b>.
            </>
          }
          hint="Clique nele para concluir seu cadastro. Confira também a caixa de spam."
        />
      )}

      <label className="au-field">
        <span>Nome</span>
        <input
          type="text"
          placeholder="Seu nome"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
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
        <label htmlFor="password">Senha</label>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <small className="au-hint">Mínimo de 6 caracteres.</small>
      </div>

      <button className="btn solid au-submit" type="submit" disabled={busy}>
        {busy ? "Criando…" : "Criar conta"}
      </button>
      <p className="au-terms">
        Ao criar a conta, você concorda com os <a href="#">Termos de Uso</a> e a{" "}
        <a href="#">Política de Privacidade</a>.
      </p>
      <p className="au-swap">
        Já tem conta? <a href="/login">Entrar</a>
      </p>
    </form>
  );
}
