"use client";

import { useState } from "react";
import { registerAccount } from "@/app/actions/auth";
import PasswordInput from "@/components/auth/PasswordInput";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const result = await registerAccount({ name, email, password });
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      setNotice(
        `Enviamos um link de confirmação para ${email}. Clique nele para concluir seu cadastro.`,
      );
    }
  }

  return (
    <form className="au-form" onSubmit={submit}>
      <h1>Criar conta</h1>
      <p className="sub">Comece a acompanhar leilões em todo o Brasil.</p>

      {error && <p className="au-err">{error}</p>}
      {notice && <p className="au-notice">{notice}</p>}

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
      <label className="au-field">
        <span>Senha</span>
        <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
        <small className="au-hint">Mínimo de 6 caracteres.</small>
      </label>

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
