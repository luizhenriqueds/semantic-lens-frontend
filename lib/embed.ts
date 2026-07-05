import { createDeepInfra } from "@ai-sdk/deepinfra";
import { embed, generateText } from "ai";

export const EMBEDDING_MODEL = "qwen3-embedding:0.6b";
const CHAT_MODEL = "google/gemma-2-9b-it";

function provider() {
  return createDeepInfra({ apiKey: process.env.DEEPINFRA_API_KEY });
}

export async function embedQuery(text: string, instruction?: string): Promise<number[]> {
  const value = instruction ? `Instruct: ${instruction}\nQuery: ${text}` : text;
  const { embedding } = await embed({
    model: provider().textEmbeddingModel("Qwen/Qwen3-Embedding-0.6B"),
    value,
  });
  return embedding;
}

const RERANK_MODEL = "Qwen/Qwen3-Reranker-0.6B";

export async function rerank(
  query: string,
  docs: string[],
  instruction: string,
): Promise<number[]> {
  if (!docs.length) return [];
  const q = `Instruct: ${instruction}\nQuery: ${query}`;
  const r = await fetch(`https://api.deepinfra.com/v1/inference/${RERANK_MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPINFRA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ queries: docs.map(() => q), documents: docs }),
  });
  if (!r.ok) throw new Error(`rerank failed: ${r.status}`);
  const j = (await r.json()) as { scores?: number[] };
  return j.scores ?? docs.map(() => 0);
}

export type DeedVerdict = { index: number; matches: boolean; relevance: number; reason: string };

async function analyzeDeed(
  di: ReturnType<typeof provider>,
  query: string,
  doc: string,
  index: number,
): Promise<DeedVerdict> {
  const prompt = `Você é um analista jurídico de matrículas imobiliárias. Consulta do usuário: "${query}".
Documento de matrícula:
${doc.slice(0, 900)}
A condição jurídica descrita na consulta REALMENTE se aplica ao imóvel? Considere negações, baixas e cancelamentos ("não consta", "livre e desembaraçado", "cancelada", "baixada" indicam que NÃO se aplica). Não decida apenas pela presença do termo.
Responda SOMENTE com JSON: {"matches": true|false, "relevance": 0-100, "reason": "motivo em até 10 palavras"}.`;
  try {
    const { text } = await generateText({
      model: di(CHAT_MODEL),
      prompt,
      temperature: 0,
      maxOutputTokens: 120,
    });
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { index, matches: true, relevance: 50, reason: "" };
    const j = JSON.parse(m[0]);
    return {
      index,
      matches: j.matches !== false,
      relevance: Number(j.relevance) || 50,
      reason: String(j.reason ?? ""),
    };
  } catch {
    return { index, matches: true, relevance: 50, reason: "" };
  }
}

export async function analyzeDeeds(query: string, docs: string[]): Promise<DeedVerdict[]> {
  const di = provider();
  return Promise.all(docs.map((doc, i) => analyzeDeed(di, query, doc, i)));
}
