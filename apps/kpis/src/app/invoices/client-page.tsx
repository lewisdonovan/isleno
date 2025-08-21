"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, RefreshCw } from "lucide-react";
import { useTranslations } from 'next-intl';
import { InvoiceCard } from "@/components/InvoiceCard";

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
  x_studio_project_manager_review_status?: string;
  x_studio_is_over_budget?: boolean;
  x_studio_amount_over_budget?: number;
  x_studio_cfo_sign_off?: boolean;
  x_studio_ceo_sign_off?: boolean;
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

export default function InvoiceClientPage() {
  const t = useTranslations('invoices');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionRequiredInvoices, setActionRequiredInvoices] = useState<Invoice[]>([]);
  const [awaitingApprovalInvoices, setAwaitingApprovalInvoices] = useState<Invoice[]>([]);
  const [sentForPaymentInvoices, setSentForPaymentInvoices] = useState<Invoice[]>([]);
  const [paidInvoices, setPaidInvoices] = useState<Invoice[]>([]);
  const [otherInvoices, setOtherInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    fetchInvoices();
    fetchSuppliers();
  }, []);

  const fetchInvoices = async () => {
    try {
      // For now, we'll use the existing endpoint and do client-side grouping
      // until we create the separate API routes
      const response = await fetch("/api/invoices");
      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }
      const invoices = await response.json();
      
      // Group invoices by status on the client side for now
      const actionRequired = invoices.filter((inv: Invoice) => inv.x_studio_project_manager_review_status === 'pending');
      const awaitingApproval = invoices.filter((inv: Invoice) => 
        inv.x_studio_project_manager_review_status === 'approved' && 
        inv.x_studio_is_over_budget === true
      );
      const sentForPayment = invoices.filter((inv: Invoice) => inv.state === 'posted');
      const paid = invoices.filter((inv: Invoice) => inv.state === 'paid');
      const other = invoices.filter((inv: Invoice) => 
        inv.x_studio_project_manager_review_status !== 'pending' && 
        inv.x_studio_project_manager_review_status !== 'approved' && 
        inv.state !== 'posted' && 
        inv.state !== 'paid'
      );

      setActionRequiredInvoices(actionRequired);
      setAwaitingApprovalInvoices(awaitingApproval);
      setSentForPaymentInvoices(sentForPayment);
      setPaidInvoices(paid);
      setOtherInvoices(other);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setActionRequiredInvoices([]);
      setAwaitingApprovalInvoices([]);
      setSentForPaymentInvoices([]);
      setPaidInvoices([]);
      setOtherInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
    const response = await fetch("/api/odoo/suppliers");
      if (!response.ok) {
        throw new Error(`Failed to fetch suppliers: ${response.status}`);
      }
    const data = await response.json();
    setSuppliers(data);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      setSuppliers([]);
  }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('loadingInvoices')}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalInvoices = actionRequiredInvoices.length + awaitingApprovalInvoices.length + sentForPaymentInvoices.length + paidInvoices.length + otherInvoices.length;
  const actionRequiredCount = actionRequiredInvoices.length;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {totalInvoices} {t('totalInvoices')} • {actionRequiredCount} {t('requireAction')}
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? t('refreshing') : t('refresh')}
        </Button>
      </div>

      {/* Invoice Groups */}
      <Accordion type="single" defaultValue="action_required" className="space-y-4">
        {/* Action Required */}
        <AccordionItem value="action_required" className="border rounded-lg">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Badge variant="destructive" className="text-sm">
                {actionRequiredInvoices.length}
              </Badge>
              <span className="font-semibold text-lg">{t('actionRequired')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            {actionRequiredInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('allCaughtUp')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actionRequiredInvoices.map((invoice: Invoice) => (
                  <InvoiceCard 
                    key={invoice.id} 
                    invoice={invoice} 
                    suppliers={suppliers}
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                  />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Awaiting Approval */}
        <AccordionItem value="awaiting_approval" className="border rounded-lg">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {awaitingApprovalInvoices.length}
              </Badge>
              <span className="font-semibold text-lg">{t('awaitingApproval')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            {awaitingApprovalInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('noInvoicesAwaitingApproval')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {awaitingApprovalInvoices.map((invoice: Invoice) => (
                  <InvoiceCard 
                    key={invoice.id} 
                    invoice={invoice} 
                    suppliers={suppliers}
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                  />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Sent for Payment */}
        <AccordionItem value="sent_for_payment" className="border rounded-lg">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="text-sm">
                {sentForPaymentInvoices.length}
              </Badge>
              <span className="font-semibold text-lg">{t('sentForPayment')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            {sentForPaymentInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('noInvoicesSentForPayment')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentForPaymentInvoices.map((invoice: Invoice) => (
                  <InvoiceCard 
                    key={invoice.id} 
                    invoice={invoice} 
                    suppliers={suppliers}
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                  />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Paid */}
        <AccordionItem value="paid" className="border rounded-lg">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="text-sm">
                {paidInvoices.length}
              </Badge>
              <span className="font-semibold text-lg">{t('paid')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            {paidInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('noPaidInvoices')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paidInvoices.map((invoice: Invoice) => (
                  <InvoiceCard 
                    key={invoice.id} 
                    invoice={invoice} 
                    suppliers={suppliers}
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                  />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
