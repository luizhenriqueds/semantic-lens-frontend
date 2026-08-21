import InvoiceList from "./InvoiceList";
import EmptyState from "@/components/ui/EmptyState";
import { listInvoices } from "@/lib/billing/stripe";
import { IconDownload } from "@/lib/icons";

export default async function InvoicesPanel({ customerId }: { customerId: string }) {
  const invoices = await listInvoices(customerId);

  return (
    <div className="infoblock setblock">
      <div className="setblock-head">
        <h2>Faturas</h2>
        <p>O histórico de cobranças da sua assinatura. Os recibos são emitidos pela Stripe.</p>
      </div>

      {!invoices ? (
        <p className="searchnote setwarn">
          Não foi possível carregar suas faturas agora. Tente de novo em alguns minutos.
        </p>
      ) : invoices.length === 0 ? (
        <EmptyState icon={<IconDownload />} title="Nenhuma fatura ainda">
          A primeira aparece aqui assim que a cobrança da assinatura é confirmada.
        </EmptyState>
      ) : (
        <InvoiceList invoices={invoices} />
      )}
    </div>
  );
}
