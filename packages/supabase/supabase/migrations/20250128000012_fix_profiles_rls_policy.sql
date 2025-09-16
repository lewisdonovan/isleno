-- /packages/supabase/migrations/20250128000012_fix_profiles_rls_policy.sql

-- Purpose: Fix the profiles RLS policy to avoid calling the problematic user_has_permission function
--          This resolves the "operator does not exist: resource_type = text" error

-- ============================================================================
-- FIX PROFILES RLS POLICY
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles with permission" ON public.profiles;

-- Create a simpler policy that doesn't call the problematic function
-- Users can view their own profile, and admins can view all profiles
CREATE POLICY "Users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Users can view profiles" ON public.profiles IS
'Simplified policy: users can view their own profile, admins can view all profiles';
