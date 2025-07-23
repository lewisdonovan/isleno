-- /packages/supabase/migrations/20250723150305_add_user_profiles_table.sql

-- Purpose: Create a table for user profiles and store additional user metadata.
-- Affected Tables: public.profiles, auth.users (via trigger)
-- Special Considerations: This table has a one-to-one relationship with auth.users.
--                          It includes a trigger to auto-create a profile for new users.

-- Create the profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- One-to-one relationship with auth.users
  full_name text, -- Example: A common field for user's full name
  invoice_approval_alias text, -- Text used for invoice approval
  department_id UUID REFERENCES public.departments(department_id), -- Assuming public.departments table already exists or will be created earlier
  job_title text,
  location text,
  language text,
  monday_user_id bigint, -- Corrected: Use bigint for Monday.com user IDs
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles:
-- Users can view and update their own profiles.
-- Admins will later have full access via updated policies.

-- Policy for SELECT: Users can only view their own profile.
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for INSERT: Users can only create their own profile (handled by trigger, but good to have a policy).
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE -- THIS LINE IS MISSING OR MISPLACED IN YOUR FILE
  TO authenticated
  USING (auth.uid() = id);

-- Policy for DELETE: Users can only delete their own profile (ON DELETE CASCADE from auth.users also handles this).
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Function to automatically create a profile for new users in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at) -- Insert essential fields, other fields can be null initially
  VALUES (NEW.id, now(), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER allows this function to bypass RLS for this specific automated insert.

-- Create a trigger to call the handle_new_user_profile() function
-- AFTER a new user is created in auth.users table.
-- Note: You can have multiple AFTER INSERT triggers on auth.users.
CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();