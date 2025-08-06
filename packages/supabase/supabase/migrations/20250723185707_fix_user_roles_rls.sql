-- /packages/supabase/migrations/20250123000000_fix_user_roles_rls_recursion.sql

-- Purpose: Fix infinite recursion in user_roles RLS policies
-- Problem: The existing policies create infinite recursion when checking for admin role
-- Solution: Simplify policies to avoid recursive queries

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users and Admins can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Create simplified policies that don't cause recursion

-- Policy for SELECT: Users can only view their own roles
-- Admin users will be handled by a separate service role or function
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for INSERT: Only allow inserts via SECURITY DEFINER functions
-- This prevents direct role assignment but allows the trigger function to work
CREATE POLICY "Only allow function-based role inserts"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (false); -- Deny direct inserts, only allow via functions

-- Policy for UPDATE: Prevent direct updates
CREATE POLICY "Prevent direct role updates"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (false);

-- Policy for DELETE: Prevent direct deletes
CREATE POLICY "Prevent direct role deletes"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (false);

-- Create a security definer function for admin role management
-- This function can bypass RLS and be called by admins through the API
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id uuid,
  target_role text
)
RETURNS void AS $$
BEGIN
  -- In a real implementation, you'd check if the current user is admin
  -- via a different mechanism (like checking a separate admin table
  -- or using service role authentication)
  
  -- For now, this function can only be called by service_role
  IF NOT (auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Only service role can assign roles';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, target_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user has a specific role
-- This can be used by the application without causing RLS recursion
CREATE OR REPLACE FUNCTION public.user_has_role(
  check_user_id uuid,
  check_role text
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = check_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;