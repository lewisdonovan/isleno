-- /packages/supabase/supabase/migrations/20250128000014_fix_role_permissions_and_add_invoice_system.sql

-- Purpose: Fix role permissions according to new specifications and add invoice permission system
--          - default: no permissions (new users)
--          - internal: department-scoped kpi.view + department.view
--          - department_head: department-scoped kpi.view + department.view + user.view
--          - admin: all permissions
--          - Remove external_basic role
--          - Add invoice permissions and RLS policies

-- ============================================================================
-- 1. ADD INVOICE PERMISSIONS
-- ============================================================================

-- Insert invoice permissions
INSERT INTO public.permissions (description, resource_type, action) VALUES
('View invoices', 'invoice', 'view'),
('Create invoices', 'invoice', 'create'),
('Edit invoices', 'invoice', 'edit'),
('Delete invoices', 'invoice', 'delete'),
('Approve invoices', 'invoice', 'approve')

ON CONFLICT (resource_type, action) DO NOTHING;

-- ============================================================================
-- 2. CLEAN UP ROLE PERMISSIONS
-- ============================================================================

-- Remove external_basic role permissions (phase out this role)
DELETE FROM public.role_permissions WHERE role_name = 'external_basic';

-- Remove all existing role permissions to start fresh
DELETE FROM public.role_permissions;

-- ============================================================================
-- 3. ASSIGN CORRECT ROLE PERMISSIONS
-- ============================================================================

-- DEFAULT role: No permissions (new users)
-- (No permissions assigned)

-- INTERNAL role: Department-scoped kpi.view + department.view
INSERT INTO public.role_permissions (role_name, permission_id, created_by)
SELECT 'internal', id, NULL FROM public.permissions
WHERE (resource_type = 'kpi' AND action = 'view')
   OR (resource_type = 'department' AND action = 'view');

-- DEPARTMENT_HEAD role: Department-scoped kpi.view + department.view + user.view
INSERT INTO public.role_permissions (role_name, permission_id, created_by)
SELECT 'department_head', id, NULL FROM public.permissions
WHERE (resource_type = 'kpi' AND action = 'view')
   OR (resource_type = 'department' AND action = 'view')
   OR (resource_type = 'user' AND action = 'view');

-- ADMIN role: All permissions
INSERT INTO public.role_permissions (role_name, permission_id, created_by)
SELECT 'admin', id, NULL FROM public.permissions;

-- ============================================================================
-- 4. INVOICE PERMISSIONS (API-LEVEL IMPLEMENTATION)
-- ============================================================================

-- Note: Invoice permissions are handled at the API level since invoices are stored in Odoo, not the database.
-- The invoice permission system is implemented in:
-- - apps/kpis/src/lib/services/invoicePermissions.ts
-- - Updated API routes in apps/kpis/src/app/api/invoices/

-- Invoice permissions are checked using:
-- 1. invoice.view permission for basic access
-- 2. invoice_approval_alias for individual user filtering
-- 3. department_id for department head access
-- 4. admin role for system-wide access

-- No database functions needed since invoices are fetched from Odoo with appropriate filtering.

-- ============================================================================
-- 5. INVOICE RLS POLICIES (COMMENTED OUT - WILL BE ADDED WHEN INVOICES TABLE EXISTS)
-- ============================================================================

-- Note: These policies will be created when the 'invoices' table exists with columns:
-- - id, invoice_approval_alias, department_id (derived from user's department), created_at, etc.

-- TODO: Uncomment these policies when invoices table is created
/*
-- Drop existing invoice policies if they exist
DROP POLICY IF EXISTS "Users can view invoices with permission" ON public.invoices;
DROP POLICY IF EXISTS "Users can create invoices with permission" ON public.invoices;
DROP POLICY IF EXISTS "Users can update invoices with permission" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete invoices with permission" ON public.invoices;

-- Invoice View Policy: Users can view invoices based on their invoice_approval_alias
-- or if they're department head/admin
CREATE POLICY "Users can view invoices with permission"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    -- Individual user access via invoice_approval_alias
    public.can_view_invoice_by_alias(auth.uid(), invoice_approval_alias)
    OR
    -- Department head access to all invoices in their department
    public.can_view_department_invoices(auth.uid(), (
      SELECT department_id FROM public.profiles 
      WHERE invoice_approval_alias = invoices.invoice_approval_alias
    ))
    OR
    -- Admin access to all invoices
    public.is_admin(auth.uid())
  );

-- Invoice Create Policy: Users can create invoices if they have invoice.create permission
CREATE POLICY "Users can create invoices with permission"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'invoice.create')
  );

-- Invoice Update Policy: Users can update invoices if they have invoice.edit permission
CREATE POLICY "Users can update invoices with permission"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'invoice.edit')
  )
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'invoice.edit')
  );

-- Invoice Delete Policy: Users can delete invoices if they have invoice.delete permission
CREATE POLICY "Users can delete invoices with permission"
  ON public.invoices FOR DELETE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'invoice.delete')
  );
*/

-- ============================================================================
-- 6. RLS POLICIES ALREADY UPDATED IN PREVIOUS MIGRATIONS
-- ============================================================================

-- Note: RLS policies for KPIs and departments are already updated in previous migrations:
-- - Migration 20250128000009_add_admin_level_permissions.sql handles admin access
-- - Migration 20250128000008_update_rls_policies_for_department_access.sql handles department access
-- - Migration 20250128000013_fix_database_function_enum_casting.sql fixes function issues

-- The existing policies already support:
-- 1. Admin access to all resources
-- 2. Department head access to department resources
-- 3. Individual user access based on permissions
-- 4. Department-scoped access for internal users

-- No additional RLS policy updates needed in this migration.

-- ============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- This migration successfully:
-- 1. Adds invoice permissions to the permissions table
-- 2. Cleans up role permissions (removes external_basic, fixes role definitions)
-- 3. Assigns correct permissions to default, internal, department_head, and admin roles
-- 4. Implements invoice permission system at the API level (not database level)
-- 5. Maintains existing RLS policies from previous migrations

-- Invoice permissions are handled in:
-- - apps/kpis/src/lib/services/invoicePermissions.ts
-- - Updated API routes in apps/kpis/src/app/api/invoices/

-- Role definitions:
-- - default: No permissions (new users)
-- - internal: Department-scoped kpi.view + department.view
-- - department_head: Department-scoped kpi.view + department.view + user.view  
-- - admin: All permissions including invoice permissions
