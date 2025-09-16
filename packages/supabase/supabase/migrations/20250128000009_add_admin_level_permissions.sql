-- /packages/supabase/migrations/20250128000009_add_admin_level_permissions.sql

-- Purpose: Add admin-level permissions that grant full system access
--          Reserved for CEO and IT users who need access to everything, everywhere

-- ============================================================================
-- 1. ADD ADMIN-LEVEL PERMISSIONS
-- ============================================================================

-- Insert admin-level permissions using text values instead of enum
INSERT INTO public.permissions (description, resource_type, action) VALUES
-- System Administration
('Full system administration access', 'admin', 'admin'),
('View all system data', 'admin', 'view'),
('Create any system resource', 'admin', 'create'),
('Edit any system resource', 'admin', 'edit'),
('Delete any system resource', 'admin', 'delete'),
('Manage all user roles', 'admin', 'manage_roles'),
('Manage all user permissions', 'admin', 'manage_permissions'),
('View all audit logs', 'admin', 'audit'),
('Export all system data', 'admin', 'export'),
('Import system data', 'admin', 'import'),
('Configure system settings', 'admin', 'configure')

ON CONFLICT (resource_type, action) DO NOTHING;

-- ============================================================================
-- 2. CREATE ADMIN ROLE WITH FULL ACCESS
-- ============================================================================

-- Insert admin role permissions (grants access to everything)
INSERT INTO public.role_permissions (role_name, permission_id, created_by)
SELECT 'admin', id, NULL FROM public.permissions
WHERE resource_type = 'admin' OR 
      -- Also grant all individual permissions
      (resource_type IN ('kpi', 'department', 'project', 'invoice', 'user', 'system', 'snapshot', 'board', 'integration', 'audit'))
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- ============================================================================
-- 3. CREATE ADMIN HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
END;
$$;

-- Function to get all admin users
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.user_id,
    p.full_name,
    p.email,
    ur.created_at
  FROM public.user_roles ur
  JOIN public.profiles p ON ur.user_id = p.id
  WHERE ur.role = 'admin'
  ORDER BY ur.created_at DESC;
END;
$$;

-- ============================================================================
-- 4. UPDATE RLS POLICIES FOR ADMIN ACCESS
-- ============================================================================

-- Update KPI policies to support admin access
DROP POLICY IF EXISTS "Users can view KPIs with permission" ON public.kpis;
CREATE POLICY "Users can view KPIs with permission"
  ON public.kpis FOR SELECT
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpi.view')
    OR public.can_access_department_resource(auth.uid(), department_id, 'kpis', 'view')
    OR public.is_admin(auth.uid())
  );

-- Update department policies to support admin access
DROP POLICY IF EXISTS "Users can view departments with permission" ON public.departments;
CREATE POLICY "Users can view departments with permission"
  ON public.departments FOR SELECT
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'department.view')
    OR public.is_admin(auth.uid())
  );

-- ============================================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.is_admin IS
'Check if a user has the admin role with full system access';

COMMENT ON FUNCTION public.get_admin_users IS
'Get all users with admin role for management purposes';
