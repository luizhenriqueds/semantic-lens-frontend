import { PROFILE_SHORT, SCORE_LABEL } from "@/lib/format";
import { csvBool, csvCell, csvDate, csvInt, csvNumber, toCsv, type CsvColumn } from "./csv";
import type { Property } from "@/lib/types";

// Explicit and ordered, so a test can pin the header row against drift.
//
// Absent on purpose: `description`/`visualNote` are always null on list rows (mapListRow keeps the
// heavy text out of the MV); `nearestPoi` has variable keys and would ragged the rows;
// `priceRank`/`sizeRank`/`clusterLabel` are internal and meaningless outside the corpus.
export function propertyColumns(opts: { origin?: string } = {}): CsvColumn<Property>[] {
  const cols: CsvColumn<Property>[] = [
    { header: "Matrícula", value: (p) => csvCell(p.id) },
    { header: "Título", value: (p) => csvCell(p.title) },
    { header: "Tipo", value: (p) => csvCell(p.propertyType) },
    { header: "UF", value: (p) => csvCell(p.uf) },
    { header: "Cidade", value: (p) => csvCell(p.city) },
    { header: "Bairro", value: (p) => csvCell(p.neighborhood) },
    { header: "Endereço", value: (p) => csvCell(p.rawAddress) },
    { header: "Área (m²)", value: (p) => csvNumber(p.area, 1) },
    { header: "Quartos", value: (p) => csvInt(p.bedrooms) },
    { header: "Vagas", value: (p) => csvInt(p.parkingSpots) },
    { header: "Ano de construção", value: (p) => csvInt(p.yearBuilt) },
    { header: "Ocupação", value: (p) => csvCell(p.occupancyStatus) },
    { header: "Valor de avaliação (R$)", value: (p) => csvNumber(p.appraisedValue) },
    { header: "Valor de venda (R$)", value: (p) => csvNumber(p.saleValue) },
    { header: "Desconto (%)", value: (p) => csvNumber(p.discount, 1) },
    { header: "Preço por m² (R$)", value: (p) => csvNumber(pricePerM2(p)) },
    { header: "Modalidade", value: (p) => csvCell(p.modality) },
    { header: "Data do leilão", value: (p) => csvDate(p.auctionDate) },
    { header: "Aceita financiamento", value: (p) => csvBool(p.acceptsFinancing) },
    { header: "Aceita FGTS", value: (p) => csvBool(p.acceptsFgts) },
    { header: "Situação do anúncio", value: (p) => (p.inactive ? "Inativo" : "Ativo") },
    { header: "Condomínio (regra)", value: (p) => csvCell(p.condoPaymentRule) },
    { header: "IPTU e tributos (regra)", value: (p) => csvCell(p.taxPaymentRule) },
    { header: `Nota ${SCORE_LABEL.investment}`, value: (p) => csvInt(p.scores.investment) },
    { header: `Nota ${SCORE_LABEL.flip}`, value: (p) => csvInt(p.scores.flip) },
    { header: `Nota ${SCORE_LABEL.liquidity}`, value: (p) => csvInt(p.scores.liquidity) },
    { header: `Nota ${SCORE_LABEL.airbnb}`, value: (p) => csvInt(p.scores.airbnb) },
    { header: `Nota ${SCORE_LABEL.student}`, value: (p) => csvInt(p.scores.student) },
    { header: `Nota ${SCORE_LABEL.family}`, value: (p) => csvInt(p.scores.family) },
    { header: `Nota ${SCORE_LABEL.commercial}`, value: (p) => csvInt(p.scores.commercial) },
    { header: `Nota ${SCORE_LABEL.convenience}`, value: (p) => csvInt(p.scores.convenience) },
    { header: "Melhor uso", value: (p) => csvCell(p.profile ? PROFILE_SHORT[p.profile] : null) },
    { header: "Nota do melhor uso", value: (p) => csvInt(p.profileScore) },
    { header: "Nota da fachada", value: (p) => csvInt(p.visualScore) },
    { header: "Distância do centro (m)", value: (p) => csvInt(p.centerProximity) },
    { header: "Região (H3)", value: (p) => csvCell(p.h3) },
    { header: "Latitude", value: (p) => csvNumber(p.lat, 6) },
    { header: "Longitude", value: (p) => csvNumber(p.lon, 6) },
    { header: "Link do anúncio", value: (p) => csvCell(p.link) },
  ];

  // Passed in, not read from process.env, so the module stays pure.
  if (opts.origin) {
    const origin = opts.origin.replace(/\/$/, "");
    cols.push({ header: "Ficha no Lavra", value: (p) => csvCell(`${origin}/property/${p.id}`) });
  }
  return cols;
}

function pricePerM2(p: Property): number | null {
  if (p.saleValue == null || !p.area) return null;
  return p.saleValue / p.area;
}

export function propertiesToCsv(rows: readonly Property[], opts: { origin?: string } = {}): string {
  return toCsv(rows, propertyColumns(opts));
}
