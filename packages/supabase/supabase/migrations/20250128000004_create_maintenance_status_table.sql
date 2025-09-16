-- /packages/supabase/migrations/20250128000003_create_maintenance_status_table.sql

-- Purpose: Create a maintenance status table to manage scheduled maintenance windows
--          for the Isleño Admin UI. All times are stored in CET timezone.

-- ============================================================================
-- 1. MAINTENANCE STATUS TABLE
-- ============================================================================

-- Create the maintenance_status table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.maintenance_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT false,
  start_time timestamp with time zone NOT NULL, -- When maintenance starts (stored in CET)
  end_time timestamp with time zone NOT NULL,   -- When maintenance ends (stored in CET)
  reason text, -- Optional reason for maintenance
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Ensure end_time is after start_time
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
  
  -- Note: Single active maintenance constraint will be enforced via unique partial index
);

-- Enable RLS on maintenance_status table
ALTER TABLE public.maintenance_status ENABLE ROW LEVEL SECURITY;

-- Create unique partial index to ensure only one active maintenance window at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_status_single_active 
ON public.maintenance_status (is_active) 
WHERE is_active = true;

-- RLS Policy: Only authenticated users can view maintenance status
DROP POLICY IF EXISTS "Authenticated users can view maintenance status" ON public.maintenance_status;
CREATE POLICY "Authenticated users can view maintenance status"
  ON public.maintenance_status FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only admins can manage maintenance status
DROP POLICY IF EXISTS "Admins can manage maintenance status" ON public.maintenance_status;
CREATE POLICY "Admins can manage maintenance status"
  ON public.maintenance_status FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if maintenance is currently active
CREATE OR REPLACE FUNCTION public.is_maintenance_active()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  maintenance_active boolean := false;
BEGIN
  -- Check if there's an active maintenance window that includes the current CET time
  SELECT EXISTS(
    SELECT 1 FROM public.maintenance_status 
    WHERE is_active = true 
    AND now() AT TIME ZONE 'Europe/Madrid' BETWEEN start_time AND end_time
  ) INTO maintenance_active;
  
  RETURN maintenance_active;
END;
$$;

-- Function to get current maintenance info (if active)
CREATE OR REPLACE FUNCTION public.get_current_maintenance()
RETURNS TABLE (
  id uuid,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  reason text,
  created_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ms.id,
    ms.start_time,
    ms.end_time,
    ms.reason,
    ms.created_by
  FROM public.maintenance_status ms
  WHERE ms.is_active = true 
  AND now() AT TIME ZONE 'Europe/Madrid' BETWEEN ms.start_time AND ms.end_time
  ORDER BY ms.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to automatically deactivate expired maintenance windows
CREATE OR REPLACE FUNCTION public.cleanup_expired_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set is_active to false for maintenance windows that have ended
  UPDATE public.maintenance_status 
  SET is_active = false, updated_at = now()
  WHERE is_active = true 
  AND now() AT TIME ZONE 'Europe/Madrid' > end_time;
END;
$$;

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_maintenance_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_maintenance_status_updated_at ON public.maintenance_status;
CREATE TRIGGER update_maintenance_status_updated_at
  BEFORE UPDATE ON public.maintenance_status
  FOR EACH ROW EXECUTE FUNCTION public.update_maintenance_updated_at();

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for checking active maintenance status
CREATE INDEX IF NOT EXISTS idx_maintenance_status_active_time
ON public.maintenance_status (is_active, start_time, end_time);

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_maintenance_status_end_time 
ON public.maintenance_status (end_time) WHERE is_active = true;

-- ============================================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.maintenance_status IS 
'Manages scheduled maintenance windows for the Isleño Admin UI. All times are stored in CET timezone.';

COMMENT ON COLUMN public.maintenance_status.is_active IS 
'Whether this maintenance window is currently active';

COMMENT ON COLUMN public.maintenance_status.start_time IS 
'When maintenance starts (stored in CET timezone)';

COMMENT ON COLUMN public.maintenance_status.end_time IS 
'When maintenance ends (stored in CET timezone)';

COMMENT ON COLUMN public.maintenance_status.reason IS 
'Optional reason for the maintenance window';

COMMENT ON FUNCTION public.is_maintenance_active() IS 
'Check if maintenance is currently active based on CET timezone';

COMMENT ON FUNCTION public.get_current_maintenance() IS 
'Get information about the current active maintenance window';

COMMENT ON FUNCTION public.cleanup_expired_maintenance() IS 
'Automatically deactivate expired maintenance windows';
