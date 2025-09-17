'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, Building2 } from 'lucide-react';
import Link from 'next/link';

interface Department {
  department_id: string;
  department_name: string;
}

interface InvoiceOptionsClientProps {
  accessType: 'department' | 'admin';
  userDepartment: Department | null;
  allDepartments: Department[];
}

export default function InvoiceOptionsClient({ 
  accessType, 
  userDepartment, 
  allDepartments 
}: InvoiceOptionsClientProps) {
  const t = useTranslations('invoices');
  const tOptions = useTranslations('invoices.invoiceOptions');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {tOptions('description')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* My Invoices */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {tOptions('myInvoices')}
            </CardTitle>
            <CardDescription>
              {tOptions('myInvoicesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/invoices/me">
              <Button className="w-full">
                {tOptions('viewMyInvoices')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Department Invoices (for department heads) */}
        {accessType === 'department' && userDepartment && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {userDepartment.department_name} {tOptions('departmentInvoices')}
              </CardTitle>
              <CardDescription>
                {tOptions('departmentInvoicesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/invoices/department/${userDepartment.department_id}`}>
                <Button className="w-full">
                  {tOptions('viewDepartmentInvoices')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* All Invoices (for admins) */}
        {accessType === 'admin' && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {tOptions('allInvoices')}
              </CardTitle>
              <CardDescription>
                {tOptions('allInvoicesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/invoices/all">
                <Button className="w-full">
                  {tOptions('viewAllInvoices')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Department-specific views for admins */}
      {accessType === 'admin' && allDepartments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{tOptions('departmentViews')}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allDepartments.map((department) => (
              <Card key={department.department_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {department.department_name}
                  </CardTitle>
                  <CardDescription>
                    {tOptions('viewDepartmentInvoicesFrom', { departmentName: department.department_name })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/invoices/department/${department.department_id}`}>
                    <Button variant="outline" className="w-full">
                      {tOptions('viewDepartmentInvoices')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}