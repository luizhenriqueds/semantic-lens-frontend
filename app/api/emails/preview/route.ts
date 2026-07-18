import { type NextRequest } from "next/server";
import { TEMPLATES, type TemplateName } from "@/lib/email/templates";

export function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const name = (request.nextUrl.searchParams.get("t") || "welcome") as TemplateName;
  const template = TEMPLATES[name];
  if (!template) {
    return new Response(`Templates: ${Object.keys(TEMPLATES).join(", ")}`, { status: 400 });
  }

  const { html } = template({ name: "Ana Souza", url: "https://lavra.app/exemplo-de-link" });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
