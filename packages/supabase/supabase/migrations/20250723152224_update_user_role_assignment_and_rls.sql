-- /packages/supabase/migrations/20250723152224_update_user_role_assignment_and_rls.sql

-- Purpose: Update the handle_new_user_role() function to assign roles based on email domain.
--          Also, update RLS policies for user_roles to allow 'admin' role management.
-- Affected Tables: public.user_roles, auth.users (via trigger)

-- 1. Recreate the handle_new_user_role() function with domain-based logic
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_domain text;
BEGIN
  -- Get the new user's email
  user_email := NEW.email;

  -- Extract the domain from the email
  user_domain := SUBSTRING(user_email FROM POSITION('@' IN user_email) + 1);

  -- Always assign the 'default' role to every new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'default');

  -- Assign 'internal' role if the email domain is 'isleno.es'
  IF user_domain = 'isleno.es' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'internal');
  ELSE
    -- For any other domain, assign an 'external_basic' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'external_basic');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Note: The trigger `on_auth_user_created` (from an earlier migration)
--       will automatically start using this updated function.

-- 2. Update RLS Policies for user_roles to enable 'admin' management
-- These policies allow authenticated users to see their own roles,
-- AND allow any user with the 'admin' role to manage all roles.

-- Drop existing restrictive policies first, as we are replacing them
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "No direct role inserts initially" ON public.user_roles;
DROP POLICY IF EXISTS "No direct role updates initially" ON public.user_roles;
DROP POLICY IF EXISTS "No direct role deletes initially" ON public.user_roles;


-- Policy for SELECT: Users can view their own roles, or admins can view all.
CREATE POLICY "Users and Admins can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for INSERT: Only admins can assign roles (manually).
-- The `handle_new_user_role` function (SECURITY DEFINER) can still bypass this.
CREATE POLICY "Admins can assign roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for UPDATE: Only admins can update roles.
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for DELETE: Only admins can delete roles.
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );