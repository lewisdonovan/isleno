-- /packages/supabase/migrations/20250128000000_create_flexible_permissions_system.sql

-- Purpose: Create a flexible permissions system that provides fine-grained access control
--          without conflicting with existing user roles. This system allows individual
--          permissions assignable to users or roles, using Supabase's Postgres features
--          like RLS for enforcement.
-- 
-- Key Features:
-- - Granular permissions with "resource.action" naming convention
-- - Role-based permissions (role_permissions table)
-- - User-specific permissions (user_permissions table) with conditions
-- - Optional resource scoping (resources table)
-- - Auditing via triggers
-- - RLS integration with Supabase auth

-- ============================================================================
-- 1. ENUMS FOR STRICT NAMING
-- ============================================================================

-- Enum for resource types
CREATE TYPE public.resource_type AS ENUM (
  'kpi',
  'department', 
  'project',
  'invoice',
  'user',
  'system',
  'snapshot',
  'board',
  'integration',
  'audit'
);

-- Enum for actions
CREATE TYPE public.permission_action AS ENUM (
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'snapshot',
  'manage_roles',
  'manage_permissions',
  'admin',
  'audit',
  'export',
  'import',
  'configure'
);

-- ============================================================================
-- 2. PERMISSIONS TABLE
-- ============================================================================

-- Core permissions table with strict typing and auto-generated names
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, -- Auto-generated from resource_type.action via trigger
  description text,
  resource_type public.resource_type NOT NULL, -- Strict enum for resource types
  action public.permission_action NOT NULL, -- Strict enum for actions
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(resource_type, action) -- Ensure no duplicate resource.action combinations
);

-- Function to generate permission name from resource_type and action
CREATE OR REPLACE FUNCTION public.generate_permission_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate name from resource_type.action
  NEW.name := NEW.resource_type::text || '.' || NEW.action::text;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate permission name
CREATE TRIGGER generate_permission_name_trigger
  BEFORE INSERT OR UPDATE ON public.permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_permission_name();

-- Enable RLS on permissions table
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only authenticated users can view permissions
CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only admins can manage permissions
CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 3. RESOURCES TABLE (Optional - for permission scoping)
-- ============================================================================

-- Resources table for fine-grained permission scoping
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type public.resource_type NOT NULL, -- Strict enum for resource types
  resource_id text NOT NULL, -- e.g., project_id, kpi_id, department_id
  name text, -- Human-readable name for the resource
  metadata jsonb, -- Additional resource metadata
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(resource_type, resource_id)
);

-- Enable RLS on resources table
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. ROLE PERMISSIONS TABLE
-- ============================================================================

-- Junction table for role-based permissions
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL, -- References role names from user_roles.role
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(role_name, permission_id)
);

-- Enable RLS on role_permissions table
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view role permissions
CREATE POLICY "Users can view role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only admins can manage role permissions
CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 4. USER PERMISSIONS TABLE
-- ============================================================================

-- Junction table for user-specific permissions with conditions
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  conditions jsonb, -- ABAC conditions: {"department_id": "123", "location": "PMI"}
  granted_by uuid REFERENCES auth.users(id), -- Who granted this permission
  granted_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone, -- Optional expiration
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, permission_id, conditions) -- Prevent duplicate permissions
);

-- Enable RLS on user_permissions table
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own permissions
CREATE POLICY "Users can view their own permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policy: Only admins can manage user permissions
CREATE POLICY "Admins can manage user permissions"
  ON public.user_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 5. PERMISSION AUDIT TABLE
-- ============================================================================

-- Audit table for tracking permission changes
CREATE TABLE public.permission_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL, -- Which table was modified
  record_id uuid NOT NULL, -- ID of the modified record
  action text NOT NULL, -- INSERT, UPDATE, DELETE
  old_values jsonb, -- Previous values
  new_values jsonb, -- New values
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on permission_audit table
ALTER TABLE public.permission_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit logs
CREATE POLICY "Admins can view permission audit"
  ON public.permission_audit FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
  check_user_id uuid,
  permission_name text,
  resource_context jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean AS $$
DECLARE
  has_permission boolean := false;
BEGIN
  -- Check user-specific permissions first (highest priority)
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions up
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE up.user_id = check_user_id
      AND p.name = permission_name
      AND up.is_active = true
      AND (up.expires_at IS NULL OR up.expires_at > now())
      AND (
        up.conditions IS NULL 
        OR public.check_permission_conditions(up.conditions, resource_context)
      )
  ) INTO has_permission;
  
  -- If user has direct permission, return true
  IF has_permission THEN
    RETURN true;
  END IF;
  
  -- Check role-based permissions
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role_name
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = check_user_id
      AND p.name = permission_name
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check permission conditions (ABAC)
CREATE OR REPLACE FUNCTION public.check_permission_conditions(
  conditions jsonb,
  context jsonb
)
RETURNS boolean AS $$
DECLARE
  condition_key text;
  condition_value text;
  context_value text;
BEGIN
  -- If no conditions, permission applies
  IF conditions IS NULL OR conditions = '{}'::jsonb THEN
    RETURN true;
  END IF;
  
  -- Check each condition
  FOR condition_key, condition_value IN 
    SELECT key, value::text FROM jsonb_each_text(conditions)
  LOOP
    -- Get context value for this condition
    context_value := context ->> condition_key;
    
    -- If context doesn't have this key or values don't match, deny
    IF context_value IS NULL OR context_value != condition_value THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(check_user_id uuid)
RETURNS TABLE (
  permission_name text,
  permission_description text,
  resource_type text,
  action text,
  source text, -- 'role' or 'user'
  conditions jsonb,
  expires_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  -- User-specific permissions
  SELECT 
    p.name as permission_name,
    p.description as permission_description,
    p.resource_type,
    p.action,
    'user'::text as source,
    up.conditions,
    up.expires_at
  FROM public.user_permissions up
  JOIN public.permissions p ON up.permission_id = p.id
  WHERE up.user_id = check_user_id
    AND up.is_active = true
    AND (up.expires_at IS NULL OR up.expires_at > now())
  
  UNION ALL
  
  -- Role-based permissions
  SELECT 
    p.name as permission_name,
    p.description as permission_description,
    p.resource_type,
    p.action,
    'role'::text as source,
    NULL::jsonb as conditions,
    NULL::timestamp with time zone as expires_at
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role = rp.role_name
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = check_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. AUDIT TRIGGERS
-- ============================================================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_permission_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.permission_audit (
      table_name, record_id, action, old_values, changed_by
    ) VALUES (
      TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), auth.uid()
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.permission_audit (
      table_name, record_id, action, old_values, new_values, changed_by
    ) VALUES (
      TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.permission_audit (
      table_name, record_id, action, new_values, changed_by
    ) VALUES (
      TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), auth.uid()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for permission tables
CREATE TRIGGER audit_permissions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();

CREATE TRIGGER audit_role_permissions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();

CREATE TRIGGER audit_user_permissions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();

-- ============================================================================
-- 8. INITIAL PERMISSIONS DATA
-- ============================================================================

-- Insert common permissions based on your existing tables
-- Note: The 'name' field is auto-generated from resource_type.action
INSERT INTO public.permissions (description, resource_type, action) VALUES
-- KPI permissions
('View KPIs', 'kpi', 'view'),
('Create KPIs', 'kpi', 'create'),
('Edit KPIs', 'kpi', 'edit'),
('Delete KPIs', 'kpi', 'delete'),
('Create KPI snapshots', 'kpi', 'snapshot'),

-- Department permissions
('View departments', 'department', 'view'),
('Create departments', 'department', 'create'),
('Edit departments', 'department', 'edit'),
('Delete departments', 'department', 'delete'),

-- Project permissions
('View projects', 'project', 'view'),
('Create projects', 'project', 'create'),
('Edit projects', 'project', 'edit'),
('Delete projects', 'project', 'delete'),

-- Invoice permissions
('View invoices', 'invoice', 'view'),
('Create invoices', 'invoice', 'create'),
('Edit invoices', 'invoice', 'edit'),
('Approve invoices', 'invoice', 'approve'),
('Delete invoices', 'invoice', 'delete'),

-- User management permissions
('View user profiles', 'user', 'view'),
('Edit user profiles', 'user', 'edit'),
('Manage user roles', 'user', 'manage_roles'),
('Manage user permissions', 'user', 'manage_permissions'),

-- System permissions
('Full system administration', 'system', 'admin'),
('View audit logs', 'system', 'audit'),

-- Snapshot permissions
('View snapshots', 'snapshot', 'view'),
('Create snapshots', 'snapshot', 'create'),
('Delete snapshots', 'snapshot', 'delete'),

-- Board permissions
('View boards', 'board', 'view'),
('Create boards', 'board', 'create'),
('Edit boards', 'board', 'edit'),
('Delete boards', 'board', 'delete'),

-- Integration permissions
('View integrations', 'integration', 'view'),
('Configure integrations', 'integration', 'configure'),

-- Audit permissions
('View audit logs', 'audit', 'view'),
('Export audit data', 'audit', 'export');

-- ============================================================================
-- 9. DEFAULT ROLE PERMISSIONS
-- ============================================================================

-- Assign default permissions to existing roles using enum values
INSERT INTO public.role_permissions (role_name, permission_id, created_by) 
SELECT 'default', id, NULL FROM public.permissions 
WHERE (resource_type = 'kpi' AND action = 'view')
   OR (resource_type = 'department' AND action = 'view')
   OR (resource_type = 'project' AND action = 'view')
   OR (resource_type = 'invoice' AND action = 'view')
   OR (resource_type = 'user' AND action = 'view');

INSERT INTO public.role_permissions (role_name, permission_id, created_by) 
SELECT 'internal', id, NULL FROM public.permissions 
WHERE (resource_type = 'kpi' AND action IN ('view', 'create', 'edit', 'snapshot'))
   OR (resource_type = 'department' AND action IN ('view', 'create', 'edit'))
   OR (resource_type = 'project' AND action IN ('view', 'create', 'edit'))
   OR (resource_type = 'invoice' AND action IN ('view', 'create', 'edit'))
   OR (resource_type = 'user' AND action IN ('view', 'edit'))
   OR (resource_type = 'snapshot' AND action = 'view')
   OR (resource_type = 'board' AND action = 'view');

INSERT INTO public.role_permissions (role_name, permission_id, created_by) 
SELECT 'external_basic', id, NULL FROM public.permissions 
WHERE (resource_type = 'kpi' AND action = 'view')
   OR (resource_type = 'department' AND action = 'view')
   OR (resource_type = 'project' AND action = 'view')
   OR (resource_type = 'user' AND action = 'view');

INSERT INTO public.role_permissions (role_name, permission_id, created_by) 
SELECT 'admin', id, NULL FROM public.permissions;

-- ============================================================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for efficient permission lookups
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON public.user_permissions(permission_id);
CREATE INDEX idx_user_permissions_active ON public.user_permissions(is_active) WHERE is_active = true;
CREATE INDEX idx_user_permissions_expires ON public.user_permissions(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_role_permissions_role_name ON public.role_permissions(role_name);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);

CREATE INDEX idx_permissions_name ON public.permissions(name);
CREATE INDEX idx_permissions_resource_type ON public.permissions(resource_type);
CREATE INDEX idx_permissions_action ON public.permissions(action);

CREATE INDEX idx_permission_audit_table_record ON public.permission_audit(table_name, record_id);
CREATE INDEX idx_permission_audit_changed_at ON public.permission_audit(changed_at);

-- ============================================================================
-- 11. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.permissions IS 'Core permissions table with hierarchical naming convention (resource.action)';
COMMENT ON TABLE public.resources IS 'Optional table for fine-grained permission scoping to specific resources';
COMMENT ON TABLE public.role_permissions IS 'Junction table linking roles to permissions';
COMMENT ON TABLE public.user_permissions IS 'Junction table for user-specific permissions with ABAC conditions';
COMMENT ON TABLE public.permission_audit IS 'Audit trail for all permission-related changes';

COMMENT ON FUNCTION public.user_has_permission IS 'Check if a user has a specific permission with optional context';
COMMENT ON FUNCTION public.check_permission_conditions IS 'Evaluate ABAC conditions against context';
COMMENT ON FUNCTION public.get_user_permissions IS 'Get all permissions for a user from both roles and direct assignments';

-- ============================================================================
-- 12. RLS POLICIES FOR RESOURCES TABLE (Added after all tables are created)
-- ============================================================================

-- RLS Policy: Users can view resources they have access to
CREATE POLICY "Users can view accessible resources"
  ON public.resources FOR SELECT
  TO authenticated
  USING (
    -- Users can view resources if they have any permission on them
    EXISTS (
      SELECT 1 FROM public.user_permissions up
      JOIN public.permissions p ON up.permission_id = p.id
      WHERE up.user_id = auth.uid() 
        AND p.resource_type = resources.resource_type
    )
    OR
    -- Or if they have role-based permissions
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role = rp.role_name
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid() 
        AND p.resource_type = resources.resource_type
    )
  );

-- RLS Policy: Only admins can manage resources
CREATE POLICY "Admins can manage resources"
  ON public.resources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
