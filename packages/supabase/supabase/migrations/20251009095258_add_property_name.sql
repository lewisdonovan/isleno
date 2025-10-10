-- /packages/supabase/migrations/20251009095258_add_property_name.sql

-- Purpose: Add property_name field to properties table for human-readable property names

-- ============================================================================
-- 1. ADD PROPERTY_NAME COLUMN
-- ============================================================================

ALTER TABLE public.properties
  ADD COLUMN property_name TEXT NOT NULL;

-- ============================================================================
-- 2. ADD INDEX FOR PROPERTY_NAME
-- ============================================================================

CREATE INDEX idx_properties_property_name ON public.properties (property_name);

-- ============================================================================
-- 3. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN public.properties.property_name IS
'Human-readable name for the property (e.g., "Apartment on Gran Via", "House in Malaga Centro")';

