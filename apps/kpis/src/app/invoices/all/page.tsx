import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { invoicePermissionService } from '@/lib/services/invoicePermissions';
import { getAllInvoices } from '@/lib/odoo/services';
import AllInvoicesClient from './client-page';

export default async function AllInvoicesPage() {
  try {
    // Get current user
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/auth/login');
    }

    // Check if user has admin access
    const { canView, accessType } = await invoicePermissionService.getInvoiceAccessLevel(user.id);
    
    if (!canView || accessType !== 'admin') {
      redirect('/invoices/me');
    }

    return (
      <AllInvoicesClient />
    );
  } catch (error) {
    console.error('Error loading all invoices:', error);
    redirect('/invoices/me');
  }
}
