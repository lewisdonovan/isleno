import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { invoicePermissionService } from '@/lib/services/invoicePermissions';
import InvoiceOptionsClient from './client-page';

export default async function InvoicesPage() {
  try {
    // Get current user
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/auth/login');
    }

    // Check invoice access level
    const { canView, accessType, aliases } = await invoicePermissionService.getInvoiceAccessLevel(user.id);
    
    if (!canView) {
      redirect('/auth/login');
    }

    // If user only has individual access, redirect to /invoices/me
    if (accessType === 'individual') {
      redirect('/invoices/me');
    }

    // Get user's department information
    const userDepartmentId = await invoicePermissionService.getUserDepartment(user.id);
    let userDepartment = null;
    if (userDepartmentId) {
      const { data: department } = await supabase
        .from('departments')
        .select('department_id, department_name')
        .eq('department_id', userDepartmentId)
        .single();
      userDepartment = department;
    }

    // Get all departments for admin users
    let allDepartments: Array<{ department_id: string; department_name: string }> = [];
    if (accessType === 'admin') {
      const { data: departments } = await supabase
        .from('departments')
        .select('department_id, department_name')
        .order('department_name');
      allDepartments = departments || [];
    }

    return (
      <InvoiceOptionsClient 
        accessType={accessType as 'admin' | 'department'}
        userDepartment={userDepartment}
        allDepartments={allDepartments}
      />
    );
  } catch (error) {
    console.error('Error loading invoice options:', error);
    redirect('/invoices/me');
  }
}