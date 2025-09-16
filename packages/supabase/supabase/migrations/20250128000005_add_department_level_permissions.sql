-- /packages/supabase/migrations/20250128000005_add_department_level_permissions.sql

-- Purpose: Extend the permissions system to support department-level access
--          for department heads while maintaining fine-grained permissions for regular users

-- ============================================================================
-- 1. ADD DEPARTMENT-LEVEL PERMISSIONS WITH ENUM VALUES
-- ============================================================================

-- Create a function that adds enum values and permissions in one go
CREATE OR REPLACE FUNCTION public.add_department_permissions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Add department-level resource types to the enum
  BEGIN
    ALTER TYPE public.resource_type ADD VALUE 'department_kpis';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, continue
  END;
  
  BEGIN
    ALTER TYPE public.resource_type ADD VALUE 'department_invoices';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, continue
  END;
  
  BEGIN
    ALTER TYPE public.resource_type ADD VALUE 'department_projects';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, continue
  END;
  
  BEGIN
    ALTER TYPE public.resource_type ADD VALUE 'department_users';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, continue
  END;
  
  BEGIN
    ALTER TYPE public.resource_type ADD VALUE 'admin';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, continue
  END;
  
  -- Insert department-level permissions
  INSERT INTO public.permissions (description, resource_type, action) VALUES
-- Department KPIs
('View all KPIs in department', 'department_kpis', 'view'),
('Create KPIs in department', 'department_kpis', 'create'),
('Edit KPIs in department', 'department_kpis', 'edit'),
('Delete KPIs in department', 'department_kpis', 'delete'),
('Create KPI snapshots in department', 'department_kpis', 'snapshot'),

-- Department Invoices
('View all invoices in department', 'department_invoices', 'view'),
('Approve invoices in department', 'department_invoices', 'approve'),
('Edit invoices in department', 'department_invoices', 'edit'),

-- Department Projects
('View all projects in department', 'department_projects', 'view'),
('Create projects in department', 'department_projects', 'create'),
('Edit projects in department', 'department_projects', 'edit'),
('Delete projects in department', 'department_projects', 'delete'),

-- Department Users
('View users in department', 'department_users', 'view'),
('Manage users in department', 'department_users', 'manage_roles'),
('Assign permissions to department users', 'department_users', 'manage_permissions')

ON CONFLICT (resource_type, action) DO NOTHING;

  -- Insert department head role permissions
  INSERT INTO public.role_permissions (role_name, permission_id, created_by)
  SELECT 'department_head', id, NULL FROM public.permissions
  WHERE (resource_type = 'department_kpis' AND action IN ('view', 'create', 'edit', 'delete', 'snapshot'))
     OR (resource_type = 'department_invoices' AND action IN ('view', 'approve', 'edit'))
     OR (resource_type = 'department_projects' AND action IN ('view', 'create', 'edit', 'delete'))
     OR (resource_type = 'department_users' AND action IN ('view', 'manage_roles', 'manage_permissions'))
     OR (resource_type = 'kpi' AND action = 'view')  -- Can still view individual KPIs
     OR (resource_type = 'invoice' AND action = 'view')  -- Can still view individual invoices
     OR (resource_type = 'project' AND action = 'view')  -- Can still view individual projects
     OR (resource_type = 'user' AND action = 'view');  -- Can still view individual users

  -- Add department_id column to user_permissions for department-level permissions
  ALTER TABLE public.user_permissions 
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(department_id) ON DELETE CASCADE;

  -- Add index for department-level permission queries
  CREATE INDEX IF NOT EXISTS idx_user_permissions_department 
  ON public.user_permissions (department_id) WHERE department_id IS NOT NULL;

END;
$$;

-- Execute the function to add department permissions
SELECT public.add_department_permissions();

-- Add comment for the department_id column
COMMENT ON COLUMN public.user_permissions.department_id IS
'Department ID for department-level permissions. NULL for global permissions.';

-- ============================================================================
-- 2. MIGRATION COMPLETE
-- ============================================================================

-- All department-level permissions have been successfully added!
-- The migration includes:
-- - Department-level enum values (department_kpis, department_invoices, etc.)
-- - Department-level permissions for all resources
-- - Department head role permissions
-- - Database schema updates (department_id column)