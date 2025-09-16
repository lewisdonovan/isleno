-- /packages/supabase/migrations/20250128000003_add_department_resource_types.sql

-- Purpose: Add department-level resource types to the resource_type enum
--          This must be done in a separate migration from the permissions insertion

-- ============================================================================
-- 1. ADD DEPARTMENT-LEVEL RESOURCE TYPES TO ENUM
-- ============================================================================

-- Add all additional resource types to the enum
-- Note: These must be added before they can be used in the permissions table
-- Simple approach - just add the values (will fail if they already exist, but that's OK)
ALTER TYPE public.resource_type ADD VALUE 'department_kpis';
ALTER TYPE public.resource_type ADD VALUE 'department_invoices';
ALTER TYPE public.resource_type ADD VALUE 'department_projects';
ALTER TYPE public.resource_type ADD VALUE 'department_users';
ALTER TYPE public.resource_type ADD VALUE 'admin';

-- ============================================================================
-- 2. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TYPE public.resource_type IS 'Resource types including individual and department-level resources';
