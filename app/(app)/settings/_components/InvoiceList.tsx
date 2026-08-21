"use client";

import { useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { fmtDay, moneyCents } from "@/lib/format";
import { IconDownload } from "@/lib/icons";
import type { Invoice } from "@/lib/billing/stripe";

const PAGE_SIZE = 10;

const STATUS: Record<Invoice["status"], { label: string; chip: string }> = {
  paid: { label: "Pago", chip: "chip on" },
  open: { label: "Em aberto", chip: "chip hot" },
  uncollectible: { label: "Não pago", chip: "chip hot" },
  void: { label: "Cancelada", chip: "chip" },
};

export default function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const [page, setPage] = useState(1);
  const start = (page - 1) * PAGE_SIZE;

  return (
    <>
      <ul className="invlist">
        {invoices.slice(start, start + PAGE_SIZE).map((invoice) => {
          const day = fmtDay(invoice.issuedAt);
          const status = STATUS[invoice.status];
          return (
            <li className="invrow" key={invoice.id}>
              <div className="invmain">
                <b>{day}</b>
                <span>{invoice.number ?? "Assinatura"}</span>
              </div>
              <span className={status.chip}>{status.label}</span>
              <div className="invamount">{moneyCents(invoice.amountCents)}</div>
              {invoice.fileUrl && (
                <a
                  className="iconbtn"
                  href={invoice.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Baixar a fatura de ${day}`}
                >
                  <IconDownload width={18} height={18} strokeWidth={1.8} />
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <Pagination page={page} total={invoices.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </>
  );
}
