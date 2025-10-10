-- /packages/supabase/migrations/20251009000002_create_properties_table.sql

-- Purpose: Create properties table for comprehensive property/project management.
--          Tracks all key dates, financials, and stages of property projects.

-- ============================================================================
-- 1. ENUMS FOR PROPERTY TYPES AND STAGES
-- ============================================================================

CREATE TYPE public.property_type AS ENUM (
  'apartment',
  'house',
  'multi-tenant',
  'other'
);

CREATE TYPE public.property_stage AS ENUM (
  'not_started',
  'legal',
  'prep',
  'refurb',
  'staging',
  'our_stock',
  'reserved_arras',
  'sold',
  'rent'
);

CREATE TYPE public.property_sales_type AS ENUM (
  'sale',
  'rental'
);

-- ============================================================================
-- 2. PROPERTIES TABLE
-- ============================================================================

CREATE TABLE public.properties (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL UNIQUE, -- Human-readable/internal property reference
  
  -- Project management
  project_manager UUID REFERENCES public.profiles(id),
  project_board_id BIGINT UNIQUE, -- Monday.com board ID
  project_property_db_board_id BIGINT UNIQUE, -- Monday.com property DB board ID
  project_google_drive_link TEXT,
  project_google_drive_folder_link TEXT,
  project_location UUID REFERENCES public.locations(id), -- FK to locations table
  project_geolocation GEOGRAPHY(POINT, 4326), -- PostGIS geography type for lat/lng coordinates
  project_sqm NUMERIC,
  project_price_per_sqm NUMERIC,
  project_type public.property_type,
  current_stage public.property_stage NOT NULL,
  
  -- Search and briefing
  search_closer_dd_form_link TEXT,
  search_briefing_form_link TEXT,
  
  -- Purchase details
  purchase_price NUMERIC,
  purchase_reserve_amount NUMERIC,
  purchase_reserve_paid BOOLEAN,
  purchase_arras_amount NUMERIC,
  purchase_arras_paid BOOLEAN,
  purchase_arras_signed_date DATE,
  purchase_amount_outstanding NUMERIC,
  purchase_latest_notary_date DATE,
  purchase_notary_date DATE,
  access_from_arras_planning BOOLEAN DEFAULT false,
  access_from_arras_refurb BOOLEAN DEFAULT false,
  
  -- Prep phase
  prep_earliest_date DATE,
  prep_start_date DATE,
  prep_end_date DATE,
  
  -- Refurbishment phase
  refurb_earliest_start_date DATE,
  refurb_start_date DATE,
  refurb_end_date DATE,
  refurb_cost_real NUMERIC,
  
  -- Contractors (Odoo IDs)
  contractor_electrician_odoo_id BIGINT,
  contractor_plumber_odoo_id BIGINT,
  contractor_labourer_odoo_id BIGINT,
  contractor_carpenter_odoo_id BIGINT,
  contractor_windows_odoo_id BIGINT,
  contractor_demolition_odoo_id BIGINT,
  contractor_painter_odoo_id BIGINT,
  contractor_flooring_odoo_id BIGINT,
  contractor_drywall_odoo_id BIGINT,
  
  -- Staging phase
  staging_start_date DATE,
  staging_end_date DATE,
  
  -- Marketing
  marketing_link_to_ad TEXT,
  
  -- Sales details
  sales_type public.property_sales_type DEFAULT 'sale',
  sales_pessimistic_price NUMERIC,
  sales_optimistic_price NUMERIC,
  sales_tasacion_price NUMERIC,
  sales_final_price NUMERIC,
  sales_reserve_amount NUMERIC,
  sales_reserve_paid BOOLEAN,
  sales_arras_amount NUMERIC,
  sales_arras_paid BOOLEAN,
  sales_arras_signed_date DATE,
  sales_amount_outstanding NUMERIC,
  sales_latest_notary_date DATE,
  sales_notary_date DATE,
  sales_amount_received_in_notary NUMERIC,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- 3. ADD FOREIGN KEY TO PROPERTIES_CHANGES
-- ============================================================================

-- Now that properties table exists, add the FK constraint
ALTER TABLE public.properties_changes
  ADD CONSTRAINT fk_properties_changes_property_id
  FOREIGN KEY (property_id)
  REFERENCES public.properties(id)
  ON DELETE CASCADE;

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Unique indexes (already covered by UNIQUE constraints, but explicit for clarity)
CREATE UNIQUE INDEX idx_properties_property_id ON public.properties (property_id);
CREATE UNIQUE INDEX idx_properties_project_board_id ON public.properties (project_board_id) WHERE project_board_id IS NOT NULL;
CREATE UNIQUE INDEX idx_properties_project_property_db_board_id ON public.properties (project_property_db_board_id) WHERE project_property_db_board_id IS NOT NULL;

-- Foreign key indexes
CREATE INDEX idx_properties_project_manager ON public.properties (project_manager);
CREATE INDEX idx_properties_project_location ON public.properties (project_location);
CREATE INDEX idx_properties_created_by ON public.properties (created_by);
CREATE INDEX idx_properties_updated_by ON public.properties (updated_by);

-- Status and stage indexes
CREATE INDEX idx_properties_current_stage ON public.properties (current_stage);
CREATE INDEX idx_properties_project_type ON public.properties (project_type);
CREATE INDEX idx_properties_sales_type ON public.properties (sales_type);

-- Temporal indexes
CREATE INDEX idx_properties_created_at ON public.properties (created_at);
CREATE INDEX idx_properties_updated_at ON public.properties (updated_at);

-- Geospatial index for location-based queries
CREATE INDEX idx_properties_project_geolocation ON public.properties USING GIST (project_geolocation);

-- ============================================================================
-- 5. TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. TRIGGER FOR AUDIT LOGGING
-- ============================================================================

-- Function to automatically log changes to properties
CREATE OR REPLACE FUNCTION public.log_property_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  changed_fields TEXT[];
  old_jsonb JSONB;
  new_jsonb JSONB;
BEGIN
  -- Convert rows to JSONB
  old_jsonb := to_jsonb(OLD);
  new_jsonb := to_jsonb(NEW);
  
  IF TG_OP = 'INSERT' THEN
    -- Log creation
    INSERT INTO public.properties_changes (
      property_id,
      change_type,
      changed_fields,
      previous_state,
      next_state,
      created_by
    ) VALUES (
      NEW.id,
      'created'::public.property_change_type,
      NULL, -- No changed fields for creation
      '{}'::jsonb, -- Empty previous state
      new_jsonb,
      auth.uid()
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Find which fields changed
    SELECT array_agg(key) INTO changed_fields
    FROM jsonb_each(old_jsonb)
    WHERE jsonb_each.value IS DISTINCT FROM (new_jsonb -> jsonb_each.key);
    
    -- Only log if fields actually changed (besides updated_at)
    IF array_length(changed_fields, 1) > 1 OR 
       (array_length(changed_fields, 1) = 1 AND changed_fields[1] != 'updated_at') THEN
      INSERT INTO public.properties_changes (
        property_id,
        change_type,
        changed_fields,
        previous_state,
        next_state,
        created_by
      ) VALUES (
        NEW.id,
        'updated'::public.property_change_type,
        changed_fields,
        old_jsonb,
        new_jsonb,
        auth.uid()
      );
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Log deletion
    INSERT INTO public.properties_changes (
      property_id,
      change_type,
      changed_fields,
      previous_state,
      next_state,
      created_by
    ) VALUES (
      OLD.id,
      'deleted'::public.property_change_type,
      NULL, -- No changed fields for deletion
      old_jsonb,
      '{}'::jsonb, -- Empty next state
      auth.uid()
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.log_property_changes IS
'Automatically logs all changes to the properties table in the properties_changes audit log';

-- Create trigger for audit logging
CREATE TRIGGER log_property_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.log_property_changes();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view properties
CREATE POLICY "Authenticated users can view properties"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Policy: Users with 'internal' or 'admin' role can insert properties
CREATE POLICY "Internal users can create properties"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('internal', 'admin')
    )
  );

-- Policy: Users with 'internal' or 'admin' role can update properties
CREATE POLICY "Internal users can update properties"
  ON public.properties
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

-- Policy: Users with 'internal' or 'admin' role can delete properties
CREATE POLICY "Internal users can delete properties"
  ON public.properties
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
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.properties IS
'Comprehensive property/project management table tracking all key dates, financials, and stages';

COMMENT ON COLUMN public.properties.id IS
'Auto-generated UUID primary key';

COMMENT ON COLUMN public.properties.property_id IS
'Human-readable internal property reference ID (unique)';

COMMENT ON COLUMN public.properties.project_manager IS
'Foreign key to profiles table for the assigned project manager';

COMMENT ON COLUMN public.properties.project_board_id IS
'Monday.com board ID for the project (unique)';

COMMENT ON COLUMN public.properties.project_property_db_board_id IS
'Monday.com property database board ID (unique)';

COMMENT ON COLUMN public.properties.project_location IS
'Foreign key to locations table for the property location';

COMMENT ON COLUMN public.properties.project_geolocation IS
'Geographic coordinates (latitude/longitude) using PostGIS geography type';

COMMENT ON COLUMN public.properties.current_stage IS
'Current stage of the property in the project lifecycle';

COMMENT ON COLUMN public.properties.refurb_cost_real IS
'Actual refurbishment cost (as opposed to estimated)';

COMMENT ON COLUMN public.properties.sales_type IS
'Whether the property is for sale or rental';

COMMENT ON COLUMN public.properties.sales_tasacion_price IS
'Official valuation/appraisal price (tasación in Spanish)';

