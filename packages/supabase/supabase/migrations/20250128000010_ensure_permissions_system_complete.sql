-- /packages/supabase/migrations/20250128000010_ensure_permissions_system_complete.sql

-- Purpose: Ensure all permissions system components are properly applied
--          This migration fixes any missing enum values or columns that may not have been applied

-- ============================================================================
-- 1. ENSURE ALL ENUM VALUES EXIST
-- ============================================================================

-- Add admin resource type to the enum (idempotent)
DO $$
BEGIN
  BEGIN
    ALTER TYPE public.resource_type ADD VALUE 'admin';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, continue
  END;
END $$;

-- ============================================================================
-- 2. ENSURE DEPARTMENT_ID COLUMN EXISTS IN USER_PERMISSIONS
-- ============================================================================

-- Add department_id column to user_permissions if it doesn't exist
ALTER TABLE public.user_permissions 
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(department_id) ON DELETE CASCADE;

-- Add index for department-level permission queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_permissions_department 
ON public.user_permissions (department_id) WHERE department_id IS NOT NULL;

-- ============================================================================
-- 3. ENSURE BASE PERMISSIONS EXIST
-- ============================================================================

-- Insert base permissions (idempotent) - these should have been created in the original migration
INSERT INTO public.permissions (description, resource_type, action) VALUES
-- KPI Permissions
('View KPIs', 'kpi', 'view'),
('Create KPIs', 'kpi', 'create'),
('Edit KPIs', 'kpi', 'edit'),
('Delete KPIs', 'kpi', 'delete'),
('Create KPI snapshots', 'kpi', 'snapshot'),

-- Department Permissions
('View departments', 'department', 'view'),
('Create departments', 'department', 'create'),
('Edit departments', 'department', 'edit'),
('Delete departments', 'department', 'delete'),

-- Project Permissions
('View projects', 'project', 'view'),
('Create projects', 'project', 'create'),
('Edit projects', 'project', 'edit'),
('Delete projects', 'project', 'delete'),

-- Invoice Permissions
('View invoices', 'invoice', 'view'),
('Create invoices', 'invoice', 'create'),
('Edit invoices', 'invoice', 'edit'),
('Delete invoices', 'invoice', 'delete'),
('Approve invoices', 'invoice', 'approve'),

-- User Permissions
('View users', 'user', 'view'),
('Create users', 'user', 'create'),
('Edit users', 'user', 'edit'),
('Delete users', 'user', 'delete'),
('Manage user roles', 'user', 'manage_roles'),
('Manage user permissions', 'user', 'manage_permissions'),

-- System Permissions
('View system data', 'system', 'view'),
('Configure system', 'system', 'configure'),

-- Audit Permissions
('View audit logs', 'audit', 'view'),
('Export audit data', 'audit', 'export')

ON CONFLICT (resource_type, action) DO NOTHING;

-- ============================================================================
-- 4. ENSURE ADMIN PERMISSIONS EXIST
-- ============================================================================

-- Insert admin-level permissions (idempotent)
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
-- 5. ENSURE ROLE PERMISSIONS ARE ASSIGNED
-- ============================================================================

-- Assign default role permissions (idempotent)
INSERT INTO public.role_permissions (role_name, permission_id, created_by)
SELECT 'default', id, NULL FROM public.permissions
WHERE (resource_type = 'kpi' AND action = 'view')
   OR (resource_type = 'department' AND action = 'view')
   OR (resource_type = 'project' AND action = 'view')
   OR (resource_type = 'invoice' AND action = 'view')
   OR (resource_type = 'user' AND action = 'view')
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- Assign department head role permissions (idempotent)
-- Department heads get broader access to their department's resources
INSERT INTO public.role_permissions (role_name, permission_id, created_by)
SELECT 'department_head', id, NULL FROM public.permissions
WHERE (resource_type = 'kpi' AND action IN ('view', 'create', 'edit', 'delete', 'snapshot'))
   OR (resource_type = 'invoice' AND action IN ('view', 'approve', 'edit'))
   OR (resource_type = 'project' AND action IN ('view', 'create', 'edit', 'delete'))
   OR (resource_type = 'user' AND action IN ('view', 'manage_roles', 'manage_permissions'))
   OR (resource_type = 'department' AND action = 'view')
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- Assign admin role permissions (idempotent)
INSERT INTO public.role_permissions (role_name, permission_id, created_by)
SELECT 'admin', id, NULL FROM public.permissions
WHERE resource_type = 'admin' OR 
      -- Also grant all individual permissions
      (resource_type IN ('kpi', 'department', 'project', 'invoice', 'user', 'system', 'snapshot', 'board', 'integration', 'audit'))
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- ============================================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TYPE public.resource_type IS 'Resource types including individual and department-level resources';
COMMENT ON COLUMN public.user_permissions.department_id IS 'Department ID for department-level permissions (optional)';
