import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { invoicePermissionService } from '@/lib/services/invoicePermissions';
import { getAllInvoices } from '@/lib/odoo/services';
import DepartmentInvoicesClient from './client-page';

interface DepartmentInvoicesPageProps {
  params: Promise<{ departmentId: string }>;
}

export default async function DepartmentInvoicesPage({ params }: DepartmentInvoicesPageProps) {
  const { departmentId } = await params;

  try {
    // Get current user
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/auth/login');
    }

    // Check if user has access to view invoices
    const { canView, accessType } = await invoicePermissionService.getInvoiceAccessLevel(user.id);
    
    if (!canView) {
      redirect('/invoices/me');
    }

    // Allow access if user is admin (can view all departments)
    if (accessType === 'admin') {
      // Admin can access any department - no additional checks needed
    } else if (accessType === 'department') {
      // Department head can only access their own department
      const userDepartmentId = await invoicePermissionService.getUserDepartment(user.id);
      if (userDepartmentId !== departmentId) {
        redirect('/invoices/me');
      }
    } else {
      // Individual users don't have department access
      redirect('/invoices/me');
    }

    // Get department information
    const { data: department } = await supabase
      .from('departments')
      .select('department_name')
      .eq('department_id', departmentId)
      .single();

    if (!department) {
      notFound();
    }

    return (
      <DepartmentInvoicesClient 
        departmentName={department.department_name}
        departmentId={departmentId}
      />
    );
  } catch (error) {
    console.error('Error loading department invoices:', error);
    redirect('/invoices/me');
  }
}
