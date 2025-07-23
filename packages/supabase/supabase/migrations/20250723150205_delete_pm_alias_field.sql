-- /packages/supabase/migrations/20250723150205_delete_pm_alias_field.sql

-- Purpose: Remove the 'pm_alias' column from the 'user_roles' table,
--          as it belongs in a dedicated profiles table.
-- Affected Tables: public.user_roles

ALTER TABLE public.user_roles
DROP COLUMN pm_alias;