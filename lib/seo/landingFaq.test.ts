import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FAQ } from "@/app/(marketing)/_data/faq";

// The JSON-LD is built from faq.ts while the reader sees the JSX. Google requires the marked-up
// answer to be visible on the page, so the two must not drift apart.
const page = readFileSync(resolve(__dirname, "../../app/(marketing)/page.tsx"), "utf8");

describe("landing FAQ", () => {
  it("has an entry for every <details> block on the page", () => {
    const ids = [...page.matchAll(/details id="(faq-[a-z]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(FAQ.map((f) => f.id).sort()).toEqual(ids.sort());
  });

  it("uses the same question text the page renders", () => {
    for (const f of FAQ) expect(page, f.id).toContain(f.q);
  });

  it("carries a non-trivial answer for each", () => {
    for (const f of FAQ) expect(f.a.length, f.id).toBeGreaterThan(80);
  });
});
