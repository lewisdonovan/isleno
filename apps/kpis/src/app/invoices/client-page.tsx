"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from "@/components/ui/command"
import { ChevronsUpDown } from "lucide-react";
import { useTranslations } from 'next-intl';


interface Invoice {
  id: number;
  partner_id: [number, string];
  invoice_date: string;
  invoice_date_due: string;
  amount_untaxed: number;
  currency_id: [number, string];
  attachments: Attachment[];
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
}

export default function InvoiceClientPage() {
  const t = useTranslations('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubtotalDialogOpen, setIsSubtotalDialogOpen] = useState(false);
  const [newSubtotal, setNewSubtotal] = useState<number>(0);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false)

  useEffect(() => {
    fetchInvoices();
    fetchSuppliers();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    const response = await fetch("/api/invoices");
    const data = await response.json();
    setInvoices(data);
    setLoading(false);
  };

  const fetchSuppliers = async () => {
    const response = await fetch("/api/odoo/suppliers");
    const data = await response.json();
    setSuppliers(data);
  }

  const handleRowClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleApprove = async (invoiceId: number) => {
    await fetch(`/api/invoices/${invoiceId}/approve`, { method: "POST" });
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice(null);
    }
    fetchInvoices();
  };

  const handleSubtotalChange = (invoiceId: number) => {
    setEditingInvoiceId(invoiceId);
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        setNewSubtotal(invoice.amount_untaxed);
        setIsSubtotalDialogOpen(true);
    }
  };

  const handleSubtotalSave = async () => {
    if (editingInvoiceId) {
      await fetch(`/api/invoices/${editingInvoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_untaxed: newSubtotal }),
      });
      setIsSubtotalDialogOpen(false);
      setEditingInvoiceId(null);
      fetchInvoices();
    }
  };

  const handleSupplierChange = async (invoiceId: number, newSupplierId: number) => {
    await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_id: newSupplierId }),
      });
      fetchInvoices();
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
  }

  if (loading) {
    return <div>{t('loadingInvoices')}</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>{t('supplier')}</TableHead>
                    <TableHead>{t('invoiceDate')}</TableHead>
                    <TableHead>{t('dueDate')}</TableHead>
                    <TableHead>{t('subtotal')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {invoices.map((invoice) => (
                    <TableRow key={invoice.id} onClick={() => handleRowClick(invoice)}>
                    <TableCell>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openCombobox}
                              className="flex items-center justify-between h-10 px-3"
                            >
                              {invoice.partner_id[1]}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                            <Command>
                                <CommandInput placeholder={t('searchSupplier')} />
                                <CommandList>
                                    <CommandEmpty>{t('noSupplierFound')}</CommandEmpty>
                                    <CommandGroup>
                                        {suppliers.map((supplier) => (
                                        <CommandItem
                                            key={supplier.id}
                                            value={supplier.name}
                                            onSelect={() => {
                                                handleSupplierChange(invoice.id, supplier.id)
                                                setOpenCombobox(false)
                                            }}
                                        >
                                            {supplier.name}
                                        </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    </TableCell>
                    <TableCell>{invoice.invoice_date}</TableCell>
                    <TableCell>{invoice.invoice_date_due}</TableCell>
                    <TableCell onClick={() => handleSubtotalChange(invoice.id)} className="cursor-pointer">
                        <div className="bg-muted rounded-lg p-2 text-muted-foreground border-muted-foreground border-2 font-semibold text-center">
                          <CurrencySymbol currencyId={invoice.currency_id[1]} />
                          {invoice.amount_untaxed.toFixed(2)}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Button onClick={() => handleApprove(invoice.id)} disabled={loading} className="font-semibold">
                        {t('approve')}
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            <Dialog open={isSubtotalDialogOpen} onOpenChange={setIsSubtotalDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>{t('editSubtotal')}</DialogTitle>
                    </DialogHeader>
                    <div>
                        <p className="mb-4">{t('subtotalDescription')}</p>
                        <Input 
                            type="number"
                            value={newSubtotal}
                            onChange={(e) => setNewSubtotal(parseFloat(e.target.value))}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">{t('cancel')}</Button>
                        </DialogClose>
                        <Button onClick={handleSubtotalSave}>{t('save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <div className="col-span-1">
            {selectedInvoice && selectedInvoice.attachments && selectedInvoice.attachments.length > 0 ? (
                <div className="sticky top-4">
                    <h3 className="font-bold mb-2">{selectedInvoice.attachments[0].name}</h3>
                    <iframe 
                        src={`data:${selectedInvoice.attachments[0].mimetype};base64,${selectedInvoice.attachments[0].datas}`} 
                        width="100%"
                        height="800px"
                    />
                </div>
            ) : (
                <div className="sticky top-4 flex items-center justify-center h-full bg-muted rounded-md">
                    <p className="text-muted-foreground">{t('selectInvoiceToView')}</p>
                </div>
            )}
        </div>
    </div>
  );
} 