// Isomorphic: client components import the copy without pulling in any server code.

export const RATE_LIMIT_TITLE = "Muitas requisições em pouco tempo";

const RATE_LIMIT_PAGE =
  "Recebemos requisições demais deste dispositivo. Aguarde alguns instantes e tente novamente.";

export const RATE_LIMIT_SEARCH =
  "Muitas buscas seguidas. Aguarde alguns segundos e tente novamente.";

/** Self-contained so the 429 never renders the app layout - which is the cost being refused. */
export function tooManyRequestsHtml(retryAfterSeconds: number): string {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${RATE_LIMIT_TITLE}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.6 system-ui,sans-serif;color:#1a1a1a;background:#fafafa}main{max-width:32rem;padding:2rem;text-align:center}h1{font-size:1.25rem;margin:0 0 .5rem}p{margin:0;color:#555}</style>
</head>
<body><main><h1>${RATE_LIMIT_TITLE}</h1><p>${RATE_LIMIT_PAGE} (${retryAfterSeconds}s)</p></main></body>
</html>`;
}
