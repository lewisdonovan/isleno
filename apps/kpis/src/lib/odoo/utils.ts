import { odooApi } from './api';
import { supabaseServer } from '@/lib/supabaseServer';
import { ODOO_MAIN_COMPANY_ID } from '../constants/odoo';

/**
 * Validates if a user has access to a specific invoice based on their invoice_approval_alias
 */
export async function validateInvoiceAccess(invoiceId: number, userAlias: string | null): Promise<boolean> {
  if (!userAlias) return false;
  
  try {
    
    const invoices = await odooApi.searchRead('account.move', [
      ['id', '=', invoiceId]
    ], {
      fields: ['x_studio_project_manager_1']
    });
    
    return invoices.length > 0 && invoices[0].x_studio_project_manager_1 === userAlias;
  } catch (error) {
    console.error('Failed to validate invoice access:', error);
    return false;
  }
}

/**
 * Gets the current user's invoice approval alias from their profile
 */
export async function getCurrentUserInvoiceAlias(): Promise<{
  user: any;
  alias: string | null;
  error?: string;
}> {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, alias: null, error: 'Unauthorized' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('invoice_approval_alias')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError);
      return { user, alias: null, error: 'Failed to fetch user profile' };
    }

    return { user, alias: profile?.invoice_approval_alias || null };
  } catch (error) {
    console.error('Error getting user invoice alias:', error);
    return { user: null, alias: null, error: 'Internal server error' };
  }
}

/**
 * Checks if the current user has the external_basic permission
 */
export async function hasExternalBasicPermission(): Promise<boolean> {
  try {
    console.log("🔐 Checking external_basic permission...");
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("❌ No authenticated user:", authError?.message);
      return false;
    }

    console.log("👤 User authenticated:", { id: user.id, email: user.email });

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('❌ Failed to fetch user roles:', rolesError);
      return false;
    }

    console.log("🎭 User roles:", roles);
    const hasPermission = roles.some(role => role.role === 'external_basic');
    console.log("✅ External basic permission:", hasPermission);
    
    return hasPermission;
  } catch (error) {
    console.error('❌ Error checking user permissions:', error);
    return false;
  }
} 