import { createDeepInfra } from "@ai-sdk/deepinfra";
import { embed } from "ai";
import { cached } from "./data/client";

export const EMBEDDING_MODEL = "qwen3-embedding:0.6b";

function provider() {
  return createDeepInfra({ apiKey: process.env.DEEPINFRA_API_KEY });
}

async function loadEmbedding(value: string): Promise<number[]> {
  const { embedding } = await embed({
    model: provider().embeddingModel("Qwen/Qwen3-Embedding-0.6B"),
    value,
  });
  return embedding;
}

// Deterministic per model, so it outlives the search cache by a long way.
const cachedEmbedding = cached(loadEmbedding, "embed-query", 86_400);

export function embedQuery(text: string, instruction?: string): Promise<number[]> {
  return cachedEmbedding(instruction ? `Instruct: ${instruction}\nQuery: ${text}` : text);
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
