export const T = {
  bg: "#edf0ef",
  surface: "#fbfcfb",
  surface2: "#f2f5f3",
  ink: "#212725",
  inkSoft: "#4e5853",
  inkFaint: "#828d87",
  primary: "#2f5d3a",
  primarySoft: "#4e7b58",
  primaryWash: "#e1e9e3",
  line: "#dce2df",
  warn: "#9a7b3b",
  font: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
};

// Uma cor só: sobre o tile verde o neutro do dois-tons não teria contraste. O translate
// em y centra a tinta da marca, cujo centro é 21.375 e não 24.
const LOGO = `<svg viewBox="0 0 48 48" width="22" height="22" style="display:block">
  <g transform="translate(0 2.625)" fill="${T.surface}">
    <g fill="none" stroke="${T.surface}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 11H6v26h5"/>
      <path d="M37 11h5v26h-5"/>
    </g>
    <rect x="14.5" y="26" width="5" height="7" rx="2.5"/>
    <rect x="21.5" y="21" width="5" height="12" rx="2.5"/>
    <rect x="28.5" y="4" width="5" height="29" rx="2.5"/>
  </g>
</svg>`;

export function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0">
    <tr><td style="border-radius:11px;background:${T.primary}">
      <a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${T.font};font-size:15px;font-weight:700;color:${T.surface};text-decoration:none;border-radius:11px">${label}</a>
    </td></tr>
  </table>`;
}

export function fallbackLink(href: string) {
  return `<p style="margin:0;font-family:${T.font};font-size:13px;line-height:1.6;color:${T.inkFaint}">
    Se o botão não funcionar, copie e cole este endereço no navegador:<br>
    <span style="font-family:${T.mono};font-size:12px;color:${T.primarySoft};word-break:break-all">${href}</span>
  </p>`;
}

export function note(text: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0">
    <tr><td style="background:${T.primaryWash};border-radius:11px;padding:14px 16px;font-family:${T.font};font-size:13.5px;line-height:1.6;color:${T.inkSoft}">${text}</td></tr>
  </table>`;
}

export function features(items: { title: string; body: string }[]) {
  const rows = items
    .map(
      (f) => `<tr><td style="padding:0 0 18px">
        <div style="font-family:${T.font};font-size:15px;font-weight:700;color:${T.ink};margin:0 0 3px">${f.title}</div>
        <div style="font-family:${T.font};font-size:14px;line-height:1.6;color:${T.inkSoft}">${f.body}</div>
      </td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 0">${rows}</table>`;
}

export function shell({
  preheader,
  title,
  body,
}: {
  preheader: string;
  title: string;
  body: string;
}) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${T.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${T.bg};padding:32px 16px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
      <tr><td style="padding:0 4px 18px">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:36px;height:36px;background:${T.primary};border-radius:10px;text-align:center;vertical-align:middle">
              <div style="padding:7px">${LOGO}</div>
            </td>
            <td style="padding-left:11px;font-family:${T.font};font-size:18px;font-weight:700;letter-spacing:-0.01em;color:${T.ink}">Leilão Index</td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="background:${T.surface};border:1px solid ${T.line};border-radius:16px;padding:34px 32px">
        <h1 style="margin:0 0 12px;font-family:${T.font};font-size:23px;line-height:1.3;font-weight:700;letter-spacing:-0.02em;color:${T.ink}">${title}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:20px 8px 0;font-family:${T.font};font-size:12px;line-height:1.7;color:${T.inkFaint}">
        Leilão Index · leilões de imóveis com dados de editais públicos<br>
        Você recebeu este e-mail porque tem uma conta no Leilão Index.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function p(text: string, extra = "") {
  return `<p style="margin:0 0 14px;font-family:${T.font};font-size:15px;line-height:1.65;color:${T.inkSoft};${extra}">${text}</p>`;
}
