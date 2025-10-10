-- /packages/supabase/migrations/20251009000001_create_properties_changes_table.sql

-- Purpose: Create properties_changes audit log table for tracking all changes to properties.
--          This provides a complete audit trail of who changed what and when.

-- ============================================================================
-- 1. ENUMS FOR CHANGE TYPES
-- ============================================================================

CREATE TYPE public.property_change_type AS ENUM (
  'created',
  'updated',
  'deleted'
);

-- ============================================================================
-- 2. PROPERTIES_CHANGES TABLE
-- ============================================================================

CREATE TABLE public.properties_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL, -- FK to properties table (added after properties table is created)
  change_type public.property_change_type NOT NULL,
  changed_fields TEXT[], -- Array of field names that changed (NULL for 'created')
  previous_state JSONB NOT NULL, -- Full snapshot of the property before the change
  next_state JSONB NOT NULL, -- Full snapshot of the property after the change
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Note: We'll add the FK constraint to properties table in the next migration
-- after the properties table is created

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX idx_properties_changes_property_id ON public.properties_changes (property_id);
CREATE INDEX idx_properties_changes_created_at ON public.properties_changes (created_at);
CREATE INDEX idx_properties_changes_created_by ON public.properties_changes (created_by);
CREATE INDEX idx_properties_changes_change_type ON public.properties_changes (change_type);

-- GIN index for JSONB columns to enable efficient querying
CREATE INDEX idx_properties_changes_previous_state ON public.properties_changes USING GIN (previous_state);
CREATE INDEX idx_properties_changes_next_state ON public.properties_changes USING GIN (next_state);

-- GIN index for array column to enable efficient querying of changed fields
CREATE INDEX idx_properties_changes_changed_fields ON public.properties_changes USING GIN (changed_fields);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.properties_changes ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view audit logs
CREATE POLICY "Authenticated users can view property changes"
  ON public.properties_changes
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Policy: Only the system (via triggers) should insert into this table
-- Users with 'internal' or 'admin' role can manually insert if needed
CREATE POLICY "Internal users can create property change logs"
  ON public.properties_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('internal', 'admin')
    )
  );

-- Policy: Audit logs should generally be immutable, but allow admins to update if necessary
CREATE POLICY "Admin users can update property change logs"
  ON public.properties_changes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Only admins can delete audit logs (should rarely happen)
CREATE POLICY "Admin users can delete property change logs"
  ON public.properties_changes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.properties_changes IS
'Audit log table that tracks all changes to properties. Provides a complete history of who changed what and when.';

COMMENT ON COLUMN public.properties_changes.property_id IS
'Reference to the property that was changed';

COMMENT ON COLUMN public.properties_changes.change_type IS
'Type of change: created, updated, or deleted';

COMMENT ON COLUMN public.properties_changes.changed_fields IS
'Array of field names that were modified in an update. NULL for created/deleted records.';

COMMENT ON COLUMN public.properties_changes.previous_state IS
'Complete JSON snapshot of the property before the change';

COMMENT ON COLUMN public.properties_changes.next_state IS
'Complete JSON snapshot of the property after the change';

