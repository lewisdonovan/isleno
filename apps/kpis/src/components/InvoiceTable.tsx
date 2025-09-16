'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OdooInvoice, PaginationInfo } from '@isleno/types/odoo';


interface Department {
  department_id: string;
  department_name: string;
}

interface InvoiceTableProps {
  invoices: OdooInvoice[];
  showDepartment?: boolean;
  showAlias?: boolean;
  title: string;
  description?: string;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
}

export default function InvoiceTable({ 
  invoices, 
  showDepartment = false, 
  showAlias = false,
  title,
  description,
  pagination,
  onPageChange
}: InvoiceTableProps) {
  const t = useTranslations('invoices.invoiceViews');
  const ti = useTranslations('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [aliasFilter, setAliasFilter] = useState('all');
  const [departments, setDepartments] = useState<Department[]>([]);

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.departments || []);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
  }, []);

  const aliases = useMemo(() => {
    const aliasList = [...new Set(invoices.map(inv => inv.x_studio_project_manager_1).filter((alias): alias is string => Boolean(alias)))];
    return aliasList.sort();
  }, [invoices]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = !searchTerm || 
        invoice.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.partner_id?.[1]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.x_studio_project_manager_1?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'pending' && invoice.x_studio_project_manager_review_status === 'pending') ||
        (statusFilter === 'approved' && invoice.x_studio_project_manager_review_status === 'approved') ||
        (statusFilter === 'posted' && invoice.state === 'posted') ||
        (statusFilter === 'paid' && invoice.state === 'paid');

      const matchesDepartment = !showDepartment || departmentFilter === 'all' || 
        invoice.department_name === departmentFilter;

      const matchesAlias = !showAlias || aliasFilter === 'all' || 
        invoice.x_studio_project_manager_1 === aliasFilter;

      return matchesSearch && matchesStatus && matchesDepartment && matchesAlias;
    });
  }, [invoices, searchTerm, statusFilter, departmentFilter, aliasFilter, showDepartment, showAlias]);

  const getStatusBadge = (invoice: OdooInvoice) => {
    if (invoice.x_studio_project_manager_review_status === 'pending') {
      return <Badge variant="destructive">Action Required</Badge>;
    }
    if (invoice.x_studio_project_manager_review_status === 'approved' && invoice.x_studio_is_over_budget) {
      return <Badge variant="secondary">{ti('status.awaitingApproval')}</Badge>;
    }
    if (invoice.state === 'posted') {
      return <Badge variant="secondary">{ti('status.sentForPayment')}</Badge>;
    }
    if (invoice.state === 'paid') {
      return <Badge variant="default">{ti('status.paid')}</Badge>;
    }
    return <Badge variant="outline">{ti('status.other')}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Input
            placeholder={t('searchInvoices')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="pending">{ti('status.actionRequired')}</SelectItem>
              <SelectItem value="approved">{ti('status.awaitingApproval')}</SelectItem>
              <SelectItem value="posted">{ti('status.sentForPayment')}</SelectItem>
              <SelectItem value="paid">{ti('status.paid')}</SelectItem>
            </SelectContent>
          </Select>

          {showDepartment && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('filterByDepartment')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allDepartments')}</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.department_id} value={dept.department_name}>{dept.department_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showAlias && (
            <Select value={aliasFilter} onValueChange={setAliasFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('filterByAlias')} />
              </SelectTrigger>
              <SelectContent className="px-2">
                <SelectItem value="all">{t('allAliases')}</SelectItem>
                {aliases.map(alias => (
                  <SelectItem key={alias} value={alias}>{alias}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {t('showingResults', { filtered: filteredInvoices.length, total: invoices.length })}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell">Invoice</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                {showAlias && <TableHead>{t('approvalAlias')}</TableHead>}
                {showDepartment && <TableHead>{t('department')}</TableHead>}
                <TableHead className="hidden md:table-cell">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow 
                  key={invoice.id}
                  className="cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors duration-150"
                  onClick={() => window.open(`/invoices/${invoice.id}`, '_blank')}
                >
                  <TableCell className="font-medium hidden md:table-cell">
                    {invoice.name || `Invoice ${invoice.id}`}
                  </TableCell>
                  <TableCell>
                    {invoice.partner_id?.[1] || 'Unknown Supplier'}
                  </TableCell>
                  <TableCell>
                    {invoice.invoice_date ? formatDate(invoice.invoice_date) : '-'}
                  </TableCell>
                  <TableCell>
                    {invoice.amount_untaxed ? formatCurrency(invoice.amount_untaxed) : '-'}
                  </TableCell>
                  {showAlias && (
                    <TableCell>
                      {invoice.x_studio_project_manager_1 || '-'}
                    </TableCell>
                  )}
                  {showDepartment && (
                    <TableCell>
                      {invoice.department_name || '-'}
                    </TableCell>
                  )}
                  <TableCell className="hidden md:table-cell">
                    {getStatusBadge(invoice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {t('noInvoicesFound')}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination && onPageChange && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} invoices
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {pagination.totalPages > 5 && (
                  <>
                    <span className="text-muted-foreground">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(pagination.totalPages)}
                    >
                      {pagination.totalPages}
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
