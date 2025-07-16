-- Migration: add_kpi_key_to_kpis_table.sql

-- Add the kpi_key column as TEXT, NOT NULL, with a temporary default UUID
-- This default ensures existing rows satisfy the NOT NULL constraint immediately.
ALTER TABLE public.kpis
ADD COLUMN kpi_key TEXT NOT NULL DEFAULT gen_random_uuid();

-- Add a unique constraint on the kpi_key column.
-- This ensures that all kpi_key values are unique across your KPIs.
ALTER TABLE public.kpis
ADD CONSTRAINT uk_kpis_kpi_key UNIQUE (kpi_key);

-- Optional: If you want to remove the default value after this migration
-- (e.g., once all existing UUIDs have been replaced with proper slugs,
-- and new inserts will explicitly provide a kpi_key), you can run this
-- in a *subsequent* migration or manually.
-- ALTER TABLE public.kpis ALTER COLUMN kpi_key DROP DEFAULT;