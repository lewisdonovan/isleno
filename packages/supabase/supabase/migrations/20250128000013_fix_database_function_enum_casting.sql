-- /packages/supabase/migrations/20250128000013_fix_database_function_enum_casting.sql

-- Purpose: Fix the user_has_permission and get_user_permissions functions to properly cast enum types to text
--          This resolves the "operator does not exist: resource_type = text" error

-- ============================================================================
-- FIX USER_HAS_PERMISSION FUNCTION
-- ============================================================================

-- Fix the user_has_permission function to cast enum types to text
CREATE OR REPLACE FUNCTION public.user_has_permission(
  check_user_id uuid,
  permission_name text,
  resource_context jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  permission_parts text[];
  resource_type_val text;
  action_val text;
  user_department_id uuid;
  target_department_id uuid;
  has_permission boolean := false;
BEGIN
  -- Parse permission name (e.g., kpi.view or department_kpis.view)
  permission_parts := string_to_array(permission_name, '.');
  
  IF array_length(permission_parts, 1) != 2 THEN
    RETURN false;
  END IF;
  
  resource_type_val := permission_parts[1];
  action_val := permission_parts[2];
  
  -- Get user's department
  SELECT department_id INTO user_department_id
  FROM public.profiles
  WHERE id = check_user_id;
  
  -- Get target department from context (if provided)
  target_department_id := (resource_context->>'department_id')::uuid;
  
  -- Check if user has the specific permission
  -- 1. Direct user permission
  SELECT EXISTS(
    SELECT 1 FROM public.user_permissions up
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE up.user_id = check_user_id
    AND p.name = permission_name
    AND (up.department_id IS NULL OR up.department_id = target_department_id)
    AND (up.conditions IS NULL OR up.conditions @> resource_context)
  ) INTO has_permission;
  
  IF has_permission THEN
    RETURN true;
  END IF;
  
  -- 2. Department-level permission check
  IF resource_type_val LIKE 'department_%' AND user_department_id IS NOT NULL THEN
    -- Check if user has department-level permission
    SELECT EXISTS(
      SELECT 1 FROM public.user_permissions up
      JOIN public.permissions p ON up.permission_id = p.id
      WHERE up.user_id = check_user_id
      AND p.name = permission_name
      AND up.department_id = user_department_id
      AND (up.conditions IS NULL OR up.conditions @> resource_context)
    ) INTO has_permission;
    
    IF has_permission THEN
      RETURN true;
    END IF;
    
    -- Check if user is department head with department-level permissions
    SELECT EXISTS(
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role = rp.role_name
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = check_user_id
      AND ur.role = 'department_head'
      AND p.name = permission_name
    ) INTO has_permission;
    
    IF has_permission THEN
      RETURN true;
    END IF;
  END IF;
  
  -- 3. Role-based permission check - FIXED: Cast enum to text
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role_name
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = check_user_id
    AND p.resource_type::text = resource_type_val
    AND p.action::text = action_val
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$;

-- ============================================================================
-- FIX GET_USER_PERMISSIONS FUNCTION
-- ============================================================================

-- Fix the get_user_permissions function to cast enum types to text
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
    p.resource_type::text as resource_type,
    p.action::text as action,
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
    p.resource_type::text as resource_type,
    p.action::text as action,
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
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.user_has_permission IS
'Fixed function to check user permissions, properly casting enum types to text to avoid type mismatch errors';

COMMENT ON FUNCTION public.get_user_permissions IS
'Fixed function to get all permissions for a user, properly casting enum types to text';
