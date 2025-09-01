import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText, Download } from "lucide-react";

import { useTranslations } from "next-intl";

interface Invoice {
  id: number;
  name: string;
  partner_id: [number, string];
  invoice_date: string;
  invoice_date_due: string;
  amount_untaxed: number;
  currency_id: [number, string];
  x_studio_project_manager_review_status: string;
  state: string;
  x_studio_is_over_budget: boolean;
  x_studio_amount_over_budget: number;
  x_studio_cfo_sign_off: boolean;
  x_studio_ceo_sign_off: boolean;
  attachments?: any[];
}

interface InvoiceCardProps {
  invoice: Invoice;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onClick?: () => void;
}

export function InvoiceCard({ invoice, isRefreshing = false, onRefresh, onClick }: InvoiceCardProps) {
  const t = useTranslations('invoices');

  const getStatusBadge = () => {
    const status = invoice.x_studio_project_manager_review_status;
    const state = invoice.state;
    
    if (status === 'pending') {
      return <Badge variant="destructive">{t('status.pending')}</Badge>;
    } else if (status === 'approved' && invoice.x_studio_is_over_budget) {
      return <Badge variant="secondary">{t('status.awaitingApproval')}</Badge>;
    } else if (state === 'posted') {
      return <Badge variant="secondary">{t('status.sentForPayment')}</Badge>;
    } else if (state === 'paid') {
      return <Badge variant="default">{t('status.paid')}</Badge>;
    } else {
      return <Badge variant="outline">{t('status.other')}</Badge>;
    }
  };

  const getAmountDisplay = () => {
    const amount = invoice.amount_untaxed;
    const isZero = !amount || amount === 0;
    
    return (
      <div className="flex items-center gap-2">
        <span className={`text-lg font-semibold ${isZero ? 'text-muted-foreground' : ''}`}>
          {isZero ? t('amount.zero') : `${invoice.currency_id[1]} ${amount.toFixed(2)}`}
        </span>
        {isRefreshing && (
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
        )}
      </div>
    );
  };

  return (
    <Card 
      className={`transition-all duration-200 ${isRefreshing ? 'ring-2 ring-blue-200 bg-blue-50/50' : ''} ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {invoice.name}
            </CardTitle>
            <p className="text-lg font-semibold mt-1">
              {invoice.partner_id[1]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('amount.label')}</span>
            {getAmountDisplay()}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('date.invoice')}</span>
            <span className="text-sm">
              {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : '-'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('date.due')}</span>
            <span className="text-sm">
              {invoice.invoice_date_due ? new Date(invoice.invoice_date_due).toLocaleDateString() : '-'}
            </span>
          </div>
          
          {invoice.attachments && invoice.attachments.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t('attachmentCount', { count: invoice.attachments.length })}
              </span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                <Download className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
