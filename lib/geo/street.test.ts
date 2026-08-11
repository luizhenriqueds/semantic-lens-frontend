import { describe, expect, it } from "vitest";
import { addressLine } from "./street";

describe("addressLine", () => {
  it("stops at the CEP, dropping the city and state the page already shows", () => {
    expect(
      addressLine("RUA DA DIVISAO,N. 975 CS 1028, JARDIM PARATI - CEP: 79081-650, CAMPO GRANDE"),
    ).toBe("Rua da Divisao,n. 975 cs 1028, Jardim Parati - CEP: 79081-650");
  });

  it("keeps CEP upper-cased through the title casing", () => {
    expect(addressLine("RUA X,N. 1, CENTRO - CEP: 58065-120, JOAO PESSOA - PARAIBA")).toContain(
      "CEP: 58065-120",
    );
  });

  it("returns null without an address", () => {
    expect(addressLine(null)).toBeNull();
    expect(addressLine("")).toBeNull();
  });
});
