-- Migration: kpi_category_key.sql

-- Add the kpi_category_key column as TEXT, NOT NULL, with a temporary default UUID
-- This default ensures existing rows satisfy the NOT NULL constraint immediately.
ALTER TABLE public.kpi_categories
ADD COLUMN kpi_category_key TEXT NOT NULL DEFAULT gen_random_uuid();

-- Add a unique constraint on the kpi_category_key column.
-- This ensures that all kpi_category_key values are unique across your KPI categoriess.
ALTER TABLE public.kpi_categories
ADD CONSTRAINT uk_kpi_categories_kpi_category_key UNIQUE (kpi_category_key);

-- Optional: If you want to remove the default value after this migration
-- (e.g., once all existing UUIDs have been replaced with proper slugs,
-- and new inserts will explicitly provide a kpi_category_key), you can run this
-- in a *subsequent* migration or manually.
-- ALTER TABLE public.kpis ALTER COLUMN kpi_category_key DROP DEFAULT;