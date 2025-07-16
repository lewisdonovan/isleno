-- Migration to remove the unique constraint on the 'monday_item_id' column in the 'public.kpis' table.

ALTER TABLE public.kpis
DROP CONSTRAINT IF EXISTS kpis_kpi_name_key;