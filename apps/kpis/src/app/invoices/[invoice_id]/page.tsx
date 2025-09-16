"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Eye, Check, Calendar, DollarSign, Building2, Tag } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getStatusBadgeInfo } from '@/lib/utils/invoiceUtils';
import { OdooInvoice, OdooInvoiceAttachment } from '@isleno/types/odoo';
import { OdooSupplier, OdooProject, OdooSpendCategory } from '@isleno/types/odoo';



export default function InvoiceDetailPage() {
  const t = useTranslations('invoices');
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoice_id as string;
  const { profile, isLoading: userLoading } = useCurrentUser();
  const DEPARTMENT_IDENTIFIERS = ["Department","Departmento"];
  const PROJECT_IDENTIFIERS = ["Project","Proyecto"];
  const CONSTRUCTION_DEPT_ID = 17;
  
  const [invoice, setInvoice] = useState<OdooInvoice | null>(null);
  const [suppliers, setSuppliers] = useState<OdooSupplier[]>([]);
  const [projects, setProjects] = useState<OdooProject[]>([]);
  const [spendCategories, setSpendCategory] = useState<OdooSpendCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<OdooProject | null>(null);
  const [selectedProject, setSelectedProject] = useState<OdooProject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [hasExternalBasicPermission, setHasExternalBasicPermission] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const hasAttemptedPopulate = useRef(false);

  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<{ planned_amount: number; practical_amount: number } | null>(null);

  const getSessionPendingKey = (analyticId: number) => `budget_pending_${analyticId}`;
  const getSessionPendingAmount = (analyticId: number): number => {
    if (typeof window === 'undefined') return 0;
    const raw = window.sessionStorage.getItem(getSessionPendingKey(analyticId));
    return raw ? parseFloat(raw) || 0 : 0;
  };
  const addToSessionPendingAmount = (analyticId: number, amount: number) => {
    if (typeof window === 'undefined') return;
    const current = getSessionPendingAmount(analyticId);
    const next = current + amount;
    window.sessionStorage.setItem(getSessionPendingKey(analyticId), String(next));
  };

  const fetchBudget = async (analyticId: number) => {
    try {
      setBudgetLoading(true);
      setBudgetError(null);
      const res = await fetch(`/api/odoo/budgets?analytic_id=${analyticId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch budget ${res.status}`);
      }
      const data = await res.json();
      setBudgetSummary({ planned_amount: data.planned_amount || 0, practical_amount: data.practical_amount || 0 });
    } catch (e: any) {
      setBudgetError(e.message || 'Failed to fetch budget');
      setBudgetSummary(null);
    } finally {
      setBudgetLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
      fetchSuppliers();
      fetchProjects();
      fetchSpendCategories();
      checkPermissions();
    }
  }, [invoiceId]);

  // Pre-populate department based on invoice alias
  useEffect(() => {
    const prePopulateDepartment = async () => {
      // Only run if we have invoice data, projects loaded, and haven't attempted yet
      if (invoice?.x_studio_project_manager_1 && projects.length > 0 && !selectedDepartment) {
        hasAttemptedPopulate.current = true;
        try {
          // Fetch user by invoice alias
          const response = await fetch(`/api/users/by-alias?alias=${encodeURIComponent(invoice.x_studio_project_manager_1)}`);
          if (response.ok) {
            const userData = await response.json();
            if (userData.user?.department_id) {
              // Find the department project
              const userDeptProject = projects.find(p => 
                p.id === userData.user.department_id &&
                (DEPARTMENT_IDENTIFIERS.includes(p.plan_id[1]))
              );
              if (userDeptProject) {
                setSelectedDepartment(userDeptProject);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch user by alias:', error);
        }
        // If any step fails, leave selectedDepartment as null (user must select manually)
      }
    };

    prePopulateDepartment();
  }, [invoice, projects, loading]);

  // Fetch budget when user selects department or project
  useEffect(() => {
    const analytic = (selectedProject?.id ?? selectedDepartment?.id) as number | undefined;
    if (analytic) {
      fetchBudget(analytic);
    } else {
      setBudgetSummary(null);
      setBudgetError(null);
    }
  }, [selectedDepartment, selectedProject]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch invoice: ${response.status}`);
      }
      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
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

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/odoo/projects");
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }
      const data = await response.json();
      setProjects(data);
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
      setSpendCategory(data);
    } catch (error) {
      console.error("Failed to fetch spend categories:", error);
      setSpendCategory([]);
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



  const handleApprove = async () => {
    if (!invoice) return;

    try {
      const payload: any = {};
      
      if (selectedDepartment) {
        payload.departmentId = selectedDepartment.id;
      }
      
      if (selectedProject) {
        payload.projectId = selectedProject.id;
      }
      
      if (selectedCategory) {
        payload.accountingCode = selectedCategory;
      }

      const response = await fetch(`/api/invoices/${invoice.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Update session running total for the selected analytic account
        const analytic = (selectedProject?.id ?? selectedDepartment?.id) as number | undefined;
        if (analytic) {
          addToSessionPendingAmount(analytic, invoice.amount_untaxed || 0);
        }
        // Redirect back to invoices list
        router.push('/invoices');
      } else {
        const error = await response.json();
        console.error("Failed to approve invoice:", error);
      }
    } catch (error) {
      console.error("Error approving invoice:", error);
    }
  };

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

  const getCurrentStatus = (invoice: OdooInvoice) => {
    if (invoice.x_studio_project_manager_review_status === 'pending') {
      return { variant: "destructive" as const, text: t('status.actionRequired') };
    }
    if (invoice.x_studio_project_manager_review_status === 'approved' && invoice.x_studio_is_over_budget) {
      return { variant: "secondary" as const, text: t('status.awaitingApproval') };
    }
    if (invoice.state === 'posted') {
      return { variant: "secondary" as const, text: t('status.sentForPayment') };
    }
    if (invoice.state === 'paid') {
      return { variant: "default" as const, text: t('status.paid') };
    }
    return { variant: "outline" as const, text: t('status.other') };
  };

  const isInvoiceApproved = (invoice: OdooInvoice) => {
    return invoice.x_studio_project_manager_review_status === 'approved';
  };



  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('loadingInvoice')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('invoiceNotFound')}</h1>
          <Button onClick={() => router.push('/invoices')}>
            {t('backToInvoices')}
          </Button>
        </div>
      </div>
    );
  }

  const supplier = suppliers.find(s => s.id === invoice.partner_id?.[0]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/invoices')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('invoice')} #{invoice.id}</h1>
        </div>
        {(() => {
          const statusInfo = getCurrentStatus(invoice);
          return <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.text}</Badge>;
        })()}
      </div>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('invoiceDetails')}
            </CardTitle>
            {/* PDF Viewer Button - only show if there are attachments */}
            {invoice.attachments && invoice.attachments.length > 0 && (
              <Sheet open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsPdfModalOpen(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {`${t('view')} PDF`}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-2xl">
                  <SheetHeader>
                    <SheetTitle>{invoice.attachments[0].name}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 h-full">
                    {invoice.attachments[0].mimetype === 'application/pdf' ? (
                      <iframe
                        src={`data:${invoice.attachments[0].mimetype};base64,${invoice.attachments[0].datas}`}
                        className="w-full h-full border-0"
                        title={invoice.attachments[0].name}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>{t('previewNotAvailable')} {invoice.attachments[0].mimetype}</p>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('supplier')}</span>
              <span className="font-medium">{invoice.partner_id?.[1] || 'Unknown Supplier'}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('projectManager')}</span>
              <span className="font-medium">{invoice.x_studio_project_manager_1 || 'Not Assigned'}</span>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('invoiceDate')}</span>
              <span className="font-medium">{invoice.invoice_date}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('dueDate')}</span>
              <span className="font-medium">{invoice.invoice_date_due}</span>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('subtotal')}</span>
              <span className="text-xl font-bold">
                <CurrencySymbol currencyId={invoice.currency_id?.[1] || 'EUR'} />
                {invoice.amount_untaxed?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department & Project Selection */}
      {hasExternalBasicPermission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {t('assignmentDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Department Field - Always visible and mandatory */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('department')} <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full p-3 border rounded-md"
                value={selectedDepartment?.id || ''}
                onChange={(e) => {
                  const dept = projects.find(p => p.id === parseInt(e.target.value));
                  setSelectedDepartment(dept || null);
                  // Reset project when department changes
                  setSelectedProject(null);
                }}
                required
              >
                <option value="">{t('selectDepartment')}</option>
                {projects
                  .filter(p => p.plan_id && (DEPARTMENT_IDENTIFIERS.includes(p.plan_id[1])))
                  .map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
              </select>
            </div>
            
            {/* Project Field - Only visible when "Construction" department is selected */}
            {selectedDepartment && selectedDepartment.id === CONSTRUCTION_DEPT_ID && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('project')}</label>
                <select 
                  className="w-full p-3 border rounded-md"
                  value={selectedProject?.id || ''}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === parseInt(e.target.value));
                    setSelectedProject(project || null);
                  }}
                >
                  <option value="">{t('selectProject')}</option>
                  {projects
                    .filter(p => p.plan_id && (PROJECT_IDENTIFIERS.includes(p.plan_id[1])))
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
            
            {/* Spend Category - Only visible when a project is selected */}
            {selectedProject && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('spendCategory')}</label>
                <select 
                  className="w-full p-3 border rounded-md"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">{t('selectSpendCategory')}</option>
                  {spendCategories.map((category) => (
                    <option key={category.id} value={category.code}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>
      )}



      {/* Actions */}
      {/* Budget Impact */}
      {hasExternalBasicPermission && (selectedDepartment || selectedProject) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('budget.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {budgetLoading && (
              <div className="text-sm text-muted-foreground">{t('budget.fetching')}</div>
            )}
            {!budgetLoading && budgetError && (
              <div className="text-sm text-red-600">{budgetError}</div>
            )}
            {!budgetLoading && !budgetError && budgetSummary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t('budget.beforeApproval')}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('budget.planned')}</span>
                    <span className="font-medium">
                      <CurrencySymbol currencyId={invoice.currency_id?.[1] || 'EUR'} />
                      {(budgetSummary.planned_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('budget.spent')}</span>
                    <span className="font-medium">
                      <CurrencySymbol currencyId={invoice.currency_id?.[1] || 'EUR'} />
                      {(budgetSummary.practical_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('budget.sessionPending')}</span>
                    <span className="font-medium">
                      <CurrencySymbol currencyId={invoice.currency_id?.[1] || 'EUR'} />
                      {(getSessionPendingAmount((selectedProject?.id ?? selectedDepartment!.id) as number)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('budget.remaining')}</span>
                    <span className="font-semibold">
                      <CurrencySymbol currencyId={invoice.currency_id?.[1] || 'EUR'} />
                      {(budgetSummary.planned_amount - budgetSummary.practical_amount - getSessionPendingAmount((selectedProject?.id ?? selectedDepartment!.id) as number)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t('budget.afterApproval')}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('budget.planned')}</span>
                    <span className="font-medium">
                      <CurrencySymbol currencyId={invoice.currency_id?.[1] || 'EUR'} />
                      {(budgetSummary.planned_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('budget.spent')}</span>
                    <span className="font-medium">
                      <CurrencySymbol currencyId={invoice.currency_id?.[1] || 'EUR'} />
                      {(budgetSummary.practical_amount + invoice.amount_untaxed).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('budget.sessionPending')}</span>
                    <span className="font-medium">
                      <CurrencySymbol currencyId={invoice.currency_id?.[1] || 'EUR'} />
                      {(getSessionPendingAmount((selectedProject?.id ?? selectedDepartment!.id) as number)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('budget.remaining')}</span>
                    <span className="font-semibold">
                      <CurrencySymbol currencyId={invoice.currency_id?.[1] || 'EUR'} />
                      {(budgetSummary.planned_amount - (budgetSummary.practical_amount + invoice.amount_untaxed) - getSessionPendingAmount((selectedProject?.id ?? selectedDepartment!.id) as number)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => router.push('/invoices')}
        >
          {t('backToInvoices')}
        </Button>
        <Button 
          className="flex-1"
          onClick={handleApprove}
          disabled={
            hasExternalBasicPermission && (
              !selectedDepartment || 
              userLoading || 
              (selectedDepartment.id === CONSTRUCTION_DEPT_ID && !selectedProject)
            ) ||
            isInvoiceApproved(invoice)
          }
        >
          <Check className="h-4 w-4 mr-2" />
          {isInvoiceApproved(invoice) ? t('alreadyApproved') : t('approveInvoice')}
        </Button>
      </div>
    </div>
  );
}
