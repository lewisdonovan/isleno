-- /packages/supabase/migrations/20251009000000_create_locations_table.sql

-- Purpose: Create locations table for property management system.
--          This table stores location data that can be referenced by properties.
--          Also creates a reusable trigger function for automatically updating updated_at timestamps.

-- ============================================================================
-- 1. ENABLE POSTGIS EXTENSION (if not already enabled)
-- ============================================================================

-- PostGIS is required for geography/geometry types
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- 2. REUSABLE TRIGGER FUNCTION FOR UPDATED_AT
-- ============================================================================

-- Create a generic function that can be reused across all tables with updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column IS
'Reusable trigger function that automatically updates the updated_at column to the current UTC timestamp';

-- ============================================================================
-- 3. LOCATIONS TABLE
-- ============================================================================

CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX idx_locations_code ON public.locations (code);
CREATE INDEX idx_locations_created_at ON public.locations (created_at);
CREATE INDEX idx_locations_updated_at ON public.locations (updated_at);
CREATE INDEX idx_locations_created_by ON public.locations (created_by);
CREATE INDEX idx_locations_updated_by ON public.locations (updated_by);

-- ============================================================================
-- 5. TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view locations
CREATE POLICY "Authenticated users can view locations"
  ON public.locations
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Policy: Users with 'internal' or 'admin' role can insert locations
CREATE POLICY "Internal users can create locations"
  ON public.locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('internal', 'admin')
    )
  );

-- Policy: Users with 'internal' or 'admin' role can update locations
CREATE POLICY "Internal users can update locations"
  ON public.locations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('internal', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('internal', 'admin')
    )
  );

-- Policy: Users with 'internal' or 'admin' role can delete locations
CREATE POLICY "Internal users can delete locations"
  ON public.locations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('internal', 'admin')
    )
  );

-- ============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.locations IS
'Stores location data for the property management system. Can be referenced by properties table.';

COMMENT ON COLUMN public.locations.code IS
'Unique code/identifier for the location (e.g., "PMI", "MAD", "BCN")';

COMMENT ON COLUMN public.locations.name IS
'Human-readable name of the location';

