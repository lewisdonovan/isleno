"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Eye, Check, Calendar, DollarSign, Building2, Tag } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getStatusBadge } from '@/lib/utils/invoiceUtils';

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

interface Project {
  id: number;
  name: string;
  code?: string;
  plan_id: [number, string];
}

interface SpendCategory {
  id: number;
  name: string;
  code: string;
}

export default function InvoiceDetailPage() {
  const t = useTranslations('invoices');
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoice_id as string;
  const { profile, isLoading: userLoading } = useCurrentUser();
  const DEPARTMENT_IDENTIFIERS = ["Department","Departmento"];
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [spendCategories, setSpendCategory] = useState<SpendCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [hasExternalBasicPermission, setHasExternalBasicPermission] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
      fetchSuppliers();
      fetchProjects();
      fetchSpendCategories();
      checkPermissions();
    }
  }, [invoiceId]);

  // Pre-populate department when profile and projects are loaded
  useEffect(() => {
    console.log({profile, projects});
    if (profile?.odoo_group_id && projects.length > 0 && !selectedDepartment) {
      const userDeptProject = projects.find(p => 
        p.id === profile.odoo_group_id &&
        (DEPARTMENT_IDENTIFIERS.includes(p.plan_id[1]))
      );
      if (userDeptProject) {
        setSelectedDepartment(userDeptProject);
      }
    }
  }, [profile, projects, selectedDepartment]);

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
      console.log({data})
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

  const supplier = suppliers.find(s => s.id === invoice.partner_id[0]);

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
          <p className="text-muted-foreground">{invoice.name || t('noReference')}</p>
        </div>
        {getStatusBadge(invoice.state)}
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
              <span className="font-medium">{invoice.partner_id[1]}</span>
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
                <CurrencySymbol currencyId={invoice.currency_id[1]} />
                {invoice.amount_untaxed.toFixed(2)}
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
            {selectedDepartment && selectedDepartment.id === 17 && (
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
                    .filter(p => p.plan_id && (p.plan_id[1] === t('projectType') || p.plan_id[1] === "Proyecto"))
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
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => router.push('/invoices')}
        >
          {t('cancel')}
        </Button>
        <Button 
          className="flex-1"
          onClick={handleApprove}
          disabled={hasExternalBasicPermission && (!selectedDepartment || userLoading)}
        >
          <Check className="h-4 w-4 mr-2" />
          {t('approveInvoice')}
        </Button>
      </div>
    </div>
  );
}
