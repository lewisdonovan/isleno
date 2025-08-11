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
import { ChevronsUpDown, Eye, Check } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


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
    x_studio_accounting_code?: [number, string]; // [id, display_name] from Odoo
}

interface Project {
    id: number;
    name: string;
    code?: string;
}

interface SpendCategory {
    id: number;
    name: string;
    code: string;
}

export default function InvoiceClientPage() {
  const t = useTranslations('invoices');
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [spendCategories, setSpendCategories] = useState<SpendCategory[]>([]);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvingInvoiceId, setApprovingInvoiceId] = useState<number | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<Invoice | null>(null);
  const [openCombobox, setOpenCombobox] = useState<Record<number, boolean>>({});
  const [openProjectCombobox, setOpenProjectCombobox] = useState<Record<number, boolean>>({});
  const [openCategoryCombobox, setOpenCategoryCombobox] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [hasExternalBasicPermission, setHasExternalBasicPermission] = useState(false);
  const [invoiceProjects, setInvoiceProjects] = useState<Record<number, Project>>({});
  const [invoiceCategories, setInvoiceCategories] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchInvoices();
    fetchSuppliers();
    fetchProjects();
    fetchSpendCategories();
    checkPermissions();
  }, []);

  // Monitor projects state for debugging
  useEffect(() => {
    if (projects.length > 0) {
      console.log('Projects state updated:', projects.length, 'projects');
      const uniqueIds = new Set(projects.map(p => p.id));
      const uniqueNames = new Set(projects.map(p => p.name));
      console.log('Projects state - unique IDs:', uniqueIds.size, 'unique names:', uniqueNames.size);
      
      if (uniqueNames.size !== projects.length) {
        console.error('Projects state contains duplicate names!');
        console.log('Duplicate projects in state:', projects);
      }
    }
  }, [projects]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/invoices");
      const data = await response.json();
      
      console.log('API response:', data);
      console.log('Response type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      // Check if the response has an error
      if (data.error) {
        console.error("API error:", data.error);
        setInvoices([]);
        return;
      }
      
      // The API returns invoices directly, not wrapped in an 'invoices' property
      const invoices = Array.isArray(data) ? data : [];
      
      if (invoices.length > 0) {
        // Set invoices immediately so users can see data
        setInvoices(invoices);
        console.log(`Loaded ${invoices.length} invoices`);
          
        try {
            // Fetch the refreshed data
            const refreshedResponse = await fetch("/api/invoices");
            const refreshedData = await refreshedResponse.json();
            
            if (Array.isArray(refreshedData)) {
                setInvoices(refreshedData);
            }
            } catch (error) {
            console.warn('Failed to fetch refreshed data:', error);
            // Keep existing data if refresh fetch fails
        }
      } else {
        console.log('No invoices found');
        setInvoices([]);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    const response = await fetch("/api/odoo/suppliers");
    const data = await response.json();
    setSuppliers(data);
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/odoo/projects");
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Raw projects data:', data);
      console.log('Projects count before deduplication:', data.length);
      
      // Validate data structure
      if (!Array.isArray(data)) {
        console.error('Projects data is not an array:', data);
        setProjects([]);
        return;
      }
      
      // Deduplication using Map for better performance
      const uniqueProjectsMap = new Map<string, Project>();
      
      data.forEach((project: any) => {
        if (project.name && typeof project.name === 'string') {
          // Use name as key to ensure uniqueness
          if (!uniqueProjectsMap.has(project.name)) {
            uniqueProjectsMap.set(project.name, project);
          } else {
            console.log('Duplicate project by name found (Map method):', project);
          }
        }
      });
      
      const uniqueProjects = Array.from(uniqueProjectsMap.values());
      console.log('Projects count after Map deduplication:', uniqueProjects.length);
      
      setProjects(uniqueProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjects([]);
    }
  };

  const fetchSpendCategories = async () => {
    try {
      const response = await fetch("/api/odoo/spend-categories");
      if (!response.ok) {
        throw new Error(`Failed to fetch spend categories: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Spend categories fetched:', data);
      setSpendCategories(data);
    } catch (error) {
      console.error("Failed to fetch spend categories:", error);
      setSpendCategories([]);
    }
  };

  const checkPermissions = async () => {
    try {
      const response = await fetch("/api/auth/check-external-basic");
      const data = await response.json();
      setHasExternalBasicPermission(data.hasPermission);
    } catch (error) {
      console.error("Failed to check permissions:", error);
      setHasExternalBasicPermission(false);
    }
  };

  const handleShowPdf = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setSelectedInvoiceForPdf(invoice);
    setIsPdfModalOpen(true);
  };

  const handleApprove = async (invoiceId: number) => {
    const selectedProjectForInvoice = invoiceProjects[invoiceId];
    if (hasExternalBasicPermission || selectedProjectForInvoice || invoiceCategories[invoiceId]) {
      // Show approval dialog for detailed approval
      setApprovingInvoiceId(invoiceId);
      setIsApprovalDialogOpen(true);
    } else {
      // Simple approval without additional details
      await fetch(`/api/invoices/${invoiceId}/approve`, { method: "POST" });
      fetchInvoices();
    }
  };

  const handleDetailedApproval = async () => {
    if (!approvingInvoiceId) return;

    const selectedProjectForInvoice = invoiceProjects[approvingInvoiceId];
    
    // If user has external_basic permission, project selection is required
    if (hasExternalBasicPermission && !selectedProjectForInvoice) {
      alert('Please select a project before approving this invoice.');
      return;
    }

    try {
      const payload: any = {};
      
      if (selectedProjectForInvoice) {
        payload.projectId = selectedProjectForInvoice.id;
      }
      
      // Determine the accounting code to use
      let accountingCode = '';
      
      // First check if supplier already has an accounting code
      const invoice = invoices.find(inv => inv.id === approvingInvoiceId);
      if (invoice?.partner_id && invoice.partner_id[0]) {
        const supplier = suppliers.find(s => s.id === invoice.partner_id[0]);
        if (supplier?.x_studio_accounting_code) {
          // Use supplier's existing accounting code ID (first element of array)
          accountingCode = supplier.x_studio_accounting_code[0].toString();
        } else if (invoiceCategories[approvingInvoiceId]) {
          // Use user-selected category from dropdown
          accountingCode = invoiceCategories[approvingInvoiceId];
        }
      }
      
      if (accountingCode) {
        payload.accountingCode = accountingCode;
        console.log('Using accounting code for approval:', accountingCode);
      }

      const response = await fetch(`/api/invoices/${approvingInvoiceId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Reset state
        setSelectedProject(null);
        setInvoiceCategories(prev => {
          const newState = { ...prev };
          delete newState[approvingInvoiceId];
          return newState;
        });
        setApprovingInvoiceId(null);
        setIsApprovalDialogOpen(false);
        
        // Refresh invoices to show updated status
        fetchInvoices();
      } else {
        const error = await response.json();
        console.error("Failed to approve invoice:", error);
      }
    } catch (error) {
      console.error("Error approving invoice:", error);
    }
  };

  const handleSupplierChange = async (invoiceId: number, newSupplierId: number) => {
    await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
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
        <div className="col-span-3">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{t('title')}</h2>
            </div>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>{t('supplier')}</TableHead>
                    <TableHead>{t('project')}</TableHead>
                    <TableHead>{t('category')}</TableHead>
                    <TableHead>{t('invoiceDate')}</TableHead>
                    <TableHead>{t('dueDate')}</TableHead>
                    <TableHead>{t('subtotal')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                    <TableCell>
                    <Popover open={openCombobox[invoice.id]} onOpenChange={(open) => setOpenCombobox({ ...openCombobox, [invoice.id]: open })}>
                        <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openCombobox[invoice.id]}
                              className="flex items-center justify-between h-10 px-3"
                              onClick={() => {
                                  setOpenCombobox({ ...openCombobox, [invoice.id]: true });
                              }}
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
                                                handleSupplierChange(invoice.id, supplier.id);
                                                setOpenCombobox({ ...openCombobox, [invoice.id]: false });
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
                    <TableCell>
                        {/* Project Selection Dropdown - Only show if user has external_basic permission */}
                        {hasExternalBasicPermission ? (
                            <Popover open={openProjectCombobox[invoice.id]} onOpenChange={(open) => setOpenProjectCombobox({ ...openProjectCombobox, [invoice.id]: open })}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openProjectCombobox[invoice.id]}
                                        className="w-full justify-between"
                                        onClick={() => {
                                            setApprovingInvoiceId(invoice.id);
                                        }}
                                    >
                                        {invoiceProjects[invoice.id]?.name || (
                                            <span className="text-muted-foreground">
                                                {t('selectProject')} *
                                            </span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder={t('selectProject')} />
                                        <CommandList>
                                            <CommandEmpty>{t('noProjectFound')}</CommandEmpty>
                                            <CommandGroup>
                                                {projects.map((project) => (
                                                    <CommandItem
                                                        key={project.id}
                                                        value={project.name}
                                                        onSelect={() => {
                                                            setInvoiceProjects(prev => ({
                                                                ...prev,
                                                                [invoice.id]: project
                                                            }));
                                                            setOpenProjectCombobox({ ...openProjectCombobox, [invoice.id]: false });
                                                        }}
                                                    >
                                                        {project.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        ) : (
                            <div className="text-muted-foreground text-sm">{t('notApplicable')}</div>
                        )}
                    </TableCell>
                    <TableCell>
                        {/* Category Display/Selection - Show existing code or dropdown */}
                        {(() => {
                          // Find the supplier for this invoice
                          const supplier = suppliers.find(s => s.id === invoice.partner_id[0]);
                          
                          if (supplier?.x_studio_accounting_code) {
                            // Supplier already has an accounting code - display it
                            return (
                              <div className="text-sm text-muted-foreground">
                                {supplier.x_studio_accounting_code[1]}
                              </div>
                            );
                          } else if (hasExternalBasicPermission) {
                            // Show dropdown for users with external_basic permission
                            return (
                              <Popover open={openCategoryCombobox} onOpenChange={setOpenCategoryCombobox}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCategoryCombobox}
                                    className="w-full justify-between"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent row click
                                    }}
                                  >
                                    {invoiceCategories[invoice.id] || t('selectCategory')}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                  <Command>
                                    <CommandInput placeholder={t('selectCategory')} />
                                    <CommandList>
                                      <CommandEmpty>{t('noCategoryFound')}</CommandEmpty>
                                      <CommandGroup>
                                        <CommandItem
                                          value=""
                                          onSelect={() => {
                                            setInvoiceCategories(prev => ({
                                              ...prev,
                                              [invoice.id]: ''
                                            }));
                                            setOpenCategoryCombobox(false);
                                          }}
                                        >
                                          {t('selectCategory')}
                                        </CommandItem>
                                        {/* Dynamic spend categories from Odoo */}
                                        {spendCategories.map((category) => (
                                          <CommandItem
                                            key={category.id}
                                            value={category.name}
                                            onSelect={() => {
                                              setInvoiceCategories(prev => ({
                                                ...prev,
                                                [invoice.id]: category.name
                                              }));
                                              setOpenCategoryCombobox(false);
                                            }}
                                          >
                                            {category.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            );
                          } else {
                            // User doesn't have permission - show dash
                            return <div className="text-muted-foreground text-sm">-</div>;
                          }
                        })()}
                    </TableCell>
                    <TableCell>{invoice.invoice_date}</TableCell>
                    <TableCell>{invoice.invoice_date_due}</TableCell>
                    <TableCell>
                        <div className="font-semibold">
                          <CurrencySymbol currencyId={invoice.currency_id[1]} />
                          {invoice.amount_untaxed.toFixed(2)}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        onClick={(e) => handleShowPdf(invoice, e)}
                                        variant="outline" 
                                        size="sm"
                                        className="text-xs"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Show invoice PDF</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => handleApprove(invoice.id)} disabled={loading} className="font-semibold">
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Approve invoice</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>

            {/* Detailed Approval Dialog */}
            <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('approveWithDetails')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Project selection is now handled in the table */}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">{t('cancel')}</Button>
                        </DialogClose>
                        <Button onClick={handleDetailedApproval}>{t('approve')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        {/* PDF Modal */}
        <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>
                        {selectedInvoiceForPdf?.attachments?.[0]?.name || 'Invoice PDF'}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    {selectedInvoiceForPdf?.attachments?.[0] && (
                        <iframe 
                            src={`data:${selectedInvoiceForPdf.attachments[0].mimetype};base64,${selectedInvoiceForPdf.attachments[0].datas}`} 
                            width="100%"
                            height="600px"
                            className="border-0"
                        />
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
} 