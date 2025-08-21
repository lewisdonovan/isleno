import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Building2 } from "lucide-react";
import { useTranslations } from 'next-intl';
import { getStatusBadge } from "@/lib/utils/invoiceUtils";

interface Invoice {
  id: number;
  partner_id: [number, string];
  invoice_date: string;
  invoice_date_due: string;
  amount_untaxed: number;
  currency_id: [number, string];
  attachments: Attachment[];
  state?: string;
  name?: string;
}

interface Attachment {
  id: number;
  name: string;
  mimetype: string;
  datas: string;
}

interface Supplier {
  id: number;
  name: string;
  x_studio_accounting_code?: [number, string];
}

interface InvoiceCardProps {
  invoice: Invoice;
  suppliers: Supplier[];
  onClick: () => void;
}

const CurrencySymbol = ({ currencyId }: { currencyId: string }) => {
  switch (currencyId) {
    case "EUR":
      return "€";
    case "USD":
      return "$";
    default:
      return currencyId;
  }
};



export function InvoiceCard({ invoice, suppliers, onClick }: InvoiceCardProps) {
  const supplier = suppliers.find(s => s.id === invoice.partner_id[0]);
  const t = useTranslations('invoices');
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary py-4"
      onClick={onClick}
    >
      <CardContent className="px-4">
        {/* Mobile: Vertical stack, left-aligned */}
        <div className="flex flex-col gap-3 text-sm sm:hidden">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-bold text-lg">{supplier?.name || invoice.partner_id[1]}</span>
            {getStatusBadge(invoice.state)}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Due:</span>
            <span className="font-medium text-xs">{new Date(invoice.invoice_date_due).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold">
              {t('subtotal')}:
              {' '}
              <CurrencySymbol currencyId={invoice.currency_id[1]} />
              {invoice.amount_untaxed.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Desktop: Horizontal layout with centered due date */}
        <div className="hidden sm:flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm truncate">{supplier?.name || invoice.partner_id[1]}</span>
            {getStatusBadge(invoice.state)}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mx-auto">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Due:</span>
            <span className="font-medium">{new Date(invoice.invoice_date_due).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-right flex-shrink-0">
            <div className="text-lg font-bold">
              {t('subtotal')}:
              {' '}
              <CurrencySymbol currencyId={invoice.currency_id[1]} />
              {invoice.amount_untaxed.toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
