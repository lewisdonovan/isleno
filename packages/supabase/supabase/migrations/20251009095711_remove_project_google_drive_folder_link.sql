-- /packages/supabase/migrations/20251009095711_remove_project_google_drive_folder_link.sql

-- Purpose: Remove project_google_drive_folder_link column from properties table

-- ============================================================================
-- 1. DROP COLUMN
-- ============================================================================

ALTER TABLE public.properties
  DROP COLUMN project_google_drive_folder_link;

