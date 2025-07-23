-- /packages/supabase/migrations/20250723145416_add_user_roles_table.sql

-- Purpose: Create a table to manage user roles and set up initial RLS.
-- Affected Tables: public.user_roles, auth.users (via trigger)
-- Special Considerations: This migration sets up the core role management system.
--                          It includes a trigger to assign a 'default' role to
--                          all new users signing up via Supabase Auth.

-- Create the user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL, -- Examples: 'default', 'internal', 'admin', 'external_basic'
  pm_alias text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role) -- Ensures a user doesn't have the same role assigned multiple times
);

-- Enable Row Level Security (RLS) on the user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles:
-- Only the authenticated user can see their own roles.
-- Later, we'll add policies for admins to manage all roles.

-- Policy for SELECT: Authenticated users can only view their own roles.
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for INSERT: By default, no one except the system (via trigger) can insert roles directly.
-- We will later add a policy for admins to insert/update roles.
-- For now, this effectively restricts manual role assignment unless via security definer functions.
CREATE POLICY "No direct role inserts initially"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (false); -- This policy always returns false, effectively denying inserts for authenticated users.

-- Policy for UPDATE: By default, no one can update roles directly.
CREATE POLICY "No direct role updates initially"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false); -- Deny updates for authenticated users.

-- Policy for DELETE: By default, no one can delete roles directly.
CREATE POLICY "No direct role deletes initially"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (false); -- Deny deletes for authenticated users.

-- Function to automatically assign a 'default' role upon new user creation in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'default'); -- Assign 'default' role to new users
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER means this function runs with the permissions of the user who created it (usually postgres/supabase_admin),
-- allowing it to bypass RLS on user_roles for this specific automated insert.

-- Create a trigger to call the handle_new_user_role() function
-- after a new user is created in auth.users table.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();