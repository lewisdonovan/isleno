-- /packages/supabase/migrations/20250128000005_2_create_department_helper_functions.sql

-- Purpose: Create helper functions for department-level access
--          This is a separate migration to avoid enum parsing issues

-- ============================================================================
-- CREATE DEPARTMENT ACCESS HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is department head
CREATE OR REPLACE FUNCTION public.is_department_head(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'department_head'
  );
END;
$$;

-- Function to get user's department ID
CREATE OR REPLACE FUNCTION public.get_user_department(check_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dept_id uuid;
BEGIN
  SELECT department_id INTO dept_id
  FROM public.profiles
  WHERE id = check_user_id;
  
  RETURN dept_id;
END;
$$;

-- Function to check department-level access
CREATE OR REPLACE FUNCTION public.can_access_department_resource(
  check_user_id uuid,
  target_department_id uuid,
  resource_type text,
  action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_department_id uuid;
  has_access boolean := false;
BEGIN
  -- Get user's department
  user_department_id := public.get_user_department(check_user_id);
  
  -- Check if user is in the same department or is department head
  IF user_department_id = target_department_id OR public.is_department_head(check_user_id) THEN
    -- Check if user has department-level permission
    has_access := public.user_has_permission(
      check_user_id,
      'department_' || resource_type || '.' || action,
      jsonb_build_object('department_id', target_department_id)
    );
  END IF;
  
  RETURN has_access;
END;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.is_department_head IS
'Check if a user has the department_head role';

COMMENT ON FUNCTION public.get_user_department IS
'Get the department ID for a user from their profile';

COMMENT ON FUNCTION public.can_access_department_resource IS
'Check if a user can access department-level resources based on their department and permissions';

-- Note: department_id column comment will be added in the main migration
