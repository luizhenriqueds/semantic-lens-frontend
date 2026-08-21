"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { setCuratedState, updateUserSettings } from "@/app/actions/settings";
import PasswordInput from "@/components/auth/PasswordInput";
import PlansPanel from "./PlansPanel";
import ThemeChoice from "./ThemeChoice";
import PlanBadge from "@/components/plan/PlanBadge";
import { usePlan } from "@/components/plan/PlanProvider";
import { useToast } from "@/components/ui/Toaster";
import { PLAN_TAB } from "@/lib/billing/checkoutFlag";
import { CURATED_ALERTS } from "@/lib/alerts/curated";
import { fmtPhone, phoneDigits } from "@/lib/format";
import { IconArrow, IconBell } from "@/lib/icons";
import { createClient } from "@/lib/supabase/client";
import type { Subscription } from "@/lib/data/billing";
import type { CuratedSlug, CuratedStates, NotificationChannel, UserSettings } from "@/lib/types";

const INVOICES_TAB = "faturas";

type Tab = "conta" | typeof PLAN_TAB | typeof INVOICES_TAB | "notificacoes" | "seguranca";

const TABS: { key: Tab; label: string }[] = [
  { key: "conta", label: "Conta" },
  { key: PLAN_TAB, label: "Plano" },
  { key: INVOICES_TAB, label: "Faturas" },
  { key: "notificacoes", label: "Notificações" },
  { key: "seguranca", label: "Segurança" },
];

const CHANNEL_COPY: { key: NotificationChannel; label: string; hint: string; soon?: boolean }[] = [
  { key: "email", label: "E-mail", hint: "Os resumos chegam no e-mail da conta." },
  {
    key: "whatsapp",
    label: "WhatsApp",
    hint: "Guardamos sua preferência; o envio por WhatsApp ainda não está no ar.",
    soon: true,
  },
];

export default function SettingsClient({
  settings,
  curated,
  subscription,
  invoices,
}: {
  settings: UserSettings;
  curated: CuratedStates;
  subscription: Subscription | null;
  /** Server-rendered, and null for an account that was never charged - which also hides the tab. */
  invoices: React.ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const { atLeast, isAdmin } = usePlan();

  const hidden: Partial<Record<Tab, boolean>> = { [PLAN_TAB]: isAdmin, [INVOICES_TAB]: !invoices };
  const tabs = TABS.filter((t) => !hidden[t.key]);

  // Seeded from the URL so the checkout return lands on the tab it promised.
  const [tab, setTab] = useState<Tab>(() => {
    const wanted = params.get("tab");
    return tabs.some((t) => t.key === wanted) ? (wanted as Tab) : "conta";
  });
  const [saving, setSaving] = useState<Tab | null>(null);

  const [name, setName] = useState(settings.fullName);
  const [phone, setPhone] = useState(fmtPhone(settings.phone));
  const [channels, setChannels] = useState<NotificationChannel[]>(settings.channels);
  const [password, setPassword] = useState("");

  const [states, setStates] = useState(curated);
  const [pending, setPending] = useState<CuratedSlug | null>(null);

  const digits = phoneDigits(phone);
  const phoneShort = digits.length > 0 && digits.length < 10;
  const emailOff = !channels.includes("email");
  const missingPhone = channels.includes("whatsapp") && digits.length < 10;

  const submit =
    (key: Tab, run: () => Promise<boolean>, ok: string, fail: string, after?: () => void) =>
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(key);
      const done = await run();
      setSaving(null);
      toast(done ? ok : fail);
      if (done) after?.();
    };

  const saveProfile = submit(
    "conta",
    () =>
      updateUserSettings({
        // Skip the auth-metadata write when the name did not change.
        fullName: name !== settings.fullName ? name : undefined,
        phone: digits,
      }),
    "Informações salvas",
    "Não foi possível salvar suas informações",
    () => router.refresh(),
  );

  const saveChannels = submit(
    "notificacoes",
    () => updateUserSettings({ channels }),
    "Canais salvos",
    "Não foi possível salvar os canais",
  );

  const savePassword = submit(
    "seguranca",
    async () => !(await createClient().auth.updateUser({ password })).error,
    "Senha atualizada",
    "Não foi possível atualizar a senha",
    () => setPassword(""),
  );

  function toggleChannel(key: NotificationChannel) {
    setChannels((cur) => (cur.includes(key) ? cur.filter((c) => c !== key) : [...cur, key]));
  }

  function toggleCurated(slug: CuratedSlug, title: string, on: boolean) {
    setStates((cur) => ({ ...cur, [slug]: on }));
    setPending(slug);
    setCuratedState(slug, title, on)
      .then((ok) => {
        if (!ok) throw new Error("rejected");
        toast(on ? `“${title}” ativado` : `“${title}” desativado`);
      })
      .catch(() => {
        setStates((cur) => ({ ...cur, [slug]: !on }));
        toast("Não foi possível salvar a preferência");
      })
      .finally(() => setPending(null));
  }

  return (
    <>
      <div className="settabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            className={tab === t.key ? "on" : ""}
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "conta" && (
        <form className="infoblock setblock" onSubmit={saveProfile}>
          <div className="setblock-head">
            <h2>Seus dados</h2>
            <p>Como chamamos você no app e onde podemos falar com você.</p>
          </div>

          <div className="afilters">
            <label className="afield">
              <span>Nome</span>
              <input
                className="selectish"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
              />
            </label>
            <label className="afield">
              <span>E-mail</span>
              <input className="selectish" value={settings.email} disabled />
              <small className="au-hint">Para trocar o e-mail, fale com o suporte.</small>
            </label>
            <label className="afield">
              <span>Celular / WhatsApp</span>
              <input
                className="selectish"
                value={phone}
                onChange={(e) => setPhone(fmtPhone(e.target.value))}
                placeholder="(11) 90000-0000"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={phoneShort}
              />
              {phoneShort ? (
                <small className="au-err">Informe o número com DDD.</small>
              ) : (
                <small className="au-hint">Usado para o envio por WhatsApp.</small>
              )}
            </label>
          </div>

          <div className="setactions">
            <button className="btn solid" type="submit" disabled={saving === "conta" || phoneShort}>
              {saving === "conta" ? "Salvando…" : "Salvar dados"}
            </button>
          </div>
        </form>
      )}

      {tab === "conta" && (
        <div className="infoblock setblock">
          <div className="setblock-head">
            <h2>Aparência</h2>
            <p>Vale só neste navegador - a preferência fica salva no aparelho.</p>
          </div>
          <ThemeChoice />
        </div>
      )}

      {tab === PLAN_TAB && !isAdmin && <PlansPanel subscription={subscription} />}

      {tab === INVOICES_TAB && invoices}

      {tab === "notificacoes" && (
        <>
          <form className="infoblock setblock" onSubmit={saveChannels}>
            <div className="setblock-head">
              <h2>Canais de envio</h2>
              <p>Por onde os avisos chegam - vale para os seus alertas e para os automáticos.</p>
            </div>

            <div className="setchannels">
              {CHANNEL_COPY.map((c) => {
                const locked = c.key === "whatsapp" && !atLeast("professional");
                const on = !locked && channels.includes(c.key);
                return (
                  <label className={`checkitem setchannel${on ? " on" : ""}`} key={c.key}>
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={locked}
                      onChange={() => toggleChannel(c.key)}
                    />
                    <div>
                      <b>
                        {c.label}
                        {c.soon && <span className="achip soon">em breve</span>}
                        {locked && <PlanBadge minRole="professional" />}
                      </b>
                      <span>{c.hint}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* WhatsApp has no sender yet, so anything but e-mail means silence. */}
            {emailOff && (
              <p className="searchnote setwarn">
                {channels.length
                  ? "Só o e-mail está em funcionamento hoje. Sem ele marcado, você não receberá avisos."
                  : "Sem nenhum canal marcado você não receberá avisos - nem dos seus alertas, nem dos automáticos."}
              </p>
            )}
            {missingPhone && (
              <p className="searchnote setwarn">
                Falta o seu celular para o envio por WhatsApp.{" "}
                <button type="button" className="setlink" onClick={() => setTab("conta")}>
                  Informar agora
                </button>
              </p>
            )}

            <div className="setactions">
              <button className="btn solid" type="submit" disabled={saving === "notificacoes"}>
                {saving === "notificacoes" ? "Salvando…" : "Salvar canais"}
              </button>
            </div>
          </form>

          <div className="infoblock setblock">
            <div className="setblock-head">
              <h2>Alertas automáticos</h2>
              <p>
                Seleções que montamos e enviamos toda semana - você não precisa criar nenhuma regra.
                Desative as que não interessam. Para alertas com seus próprios filtros, use{" "}
                <Link href="/alerts">Meus alertas</Link>.
              </p>
            </div>

            {CURATED_ALERTS.map((a) => {
              const locked = !atLeast(a.minRole);
              const on = !locked && (states[a.slug] ?? true);
              return (
                <div className="alertrow" key={a.slug}>
                  <div className="ai">
                    <IconBell width={22} height={22} strokeWidth={1.7} />
                  </div>
                  <div className="info">
                    <b>{a.title}</b>
                    {(a.perUser || locked) && (
                      <div className="achips">
                        {a.perUser && <span className="achip">usa a sua carteira</span>}
                        {locked && <PlanBadge minRole={a.minRole} />}
                      </div>
                    )}
                    <p>{a.why}</p>
                  </div>
                  <div className="aactions">
                    <Link
                      className="iconbtn"
                      href={a.href}
                      aria-label={`Ver imóveis de ${a.title}`}
                    >
                      <IconArrow width={17} height={17} strokeWidth={1.8} />
                    </Link>
                    <button
                      className={`toggle${on ? " on" : ""}`}
                      type="button"
                      disabled={locked || pending === a.slug}
                      aria-label={`Ativar ou desativar ${a.title}`}
                      aria-pressed={on}
                      onClick={() => toggleCurated(a.slug, a.title, !on)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "seguranca" && (
        <form className="infoblock setblock" onSubmit={savePassword}>
          <div className="setblock-head">
            <h2>Senha</h2>
            <p>Escolha uma nova senha de acesso.</p>
          </div>
          <div className="afield setpwd">
            <label htmlFor="new-password">Nova senha</label>
            <PasswordInput
              id="new-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              className="selectish"
            />
            <small className="au-hint">Mínimo de 6 caracteres.</small>
          </div>
          <div className="setactions">
            <button
              className="btn solid"
              type="submit"
              disabled={saving === "seguranca" || password.length < 6}
            >
              {saving === "seguranca" ? "Salvando…" : "Salvar senha"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
