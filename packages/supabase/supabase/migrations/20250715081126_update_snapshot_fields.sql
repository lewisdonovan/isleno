-- Migration: update_snapshots_for_date_kpis.sql

-- Step 1: Add new columns to the snapshots table
ALTER TABLE public.snapshots
ADD COLUMN numeric_value NUMERIC, -- This will replace the old snapshot_value
ADD COLUMN date_value DATE,
ADD COLUMN text_value TEXT;

-- Step 2: (Optional but Recommended) Migrate existing data from snapshot_value to numeric_value
-- This ensures any existing numeric snapshots are moved to the new column
UPDATE public.snapshots
SET numeric_value = snapshot_value;

-- Step 3: Drop the old snapshot_value column
ALTER TABLE public.snapshots
DROP COLUMN snapshot_value;

-- Step 4: Add a CHECK constraint (Optional but highly recommended)
-- This ensures that only the relevant value column is populated based on the KPI's data_type
-- This requires a function to get the data_type from the kpis table
CREATE OR REPLACE FUNCTION public.check_snapshot_value_type()
RETURNS TRIGGER AS $$
DECLARE
    kpi_type public.kpi_data_type;
BEGIN
    SELECT data_type INTO kpi_type FROM public.kpis WHERE kpi_id = NEW.kpi_id;

    IF kpi_type IN ('numeric', 'percentage', 'currency') THEN
        IF NEW.numeric_value IS NULL OR NEW.date_value IS NOT NULL OR NEW.text_value IS NOT NULL THEN
            RAISE EXCEPTION 'For numeric/percentage/currency KPIs, only numeric_value must be set.';
        END IF;
    ELSIF kpi_type = 'date' THEN
        IF NEW.date_value IS NULL OR NEW.numeric_value IS NOT NULL OR NEW.text_value IS NOT NULL THEN
            RAISE EXCEPTION 'For date KPIs, only date_value must be set.';
        END IF;
    ELSIF kpi_type IN ('boolean', 'text') THEN
        IF NEW.text_value IS NULL OR NEW.numeric_value IS NOT NULL OR NEW.date_value IS NOT NULL THEN
            RAISE EXCEPTION 'For boolean/text KPIs, only text_value must be set.';
        END IF;
    ELSE
        RAISE EXCEPTION 'Unknown KPI data_type % for kpi_id %', kpi_type, NEW.kpi_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Apply the check function as a BEFORE INSERT OR UPDATE trigger
CREATE CONSTRAINT TRIGGER trg_check_snapshot_value_type
AFTER INSERT OR UPDATE ON public.snapshots
FOR EACH ROW EXECUTE FUNCTION public.check_snapshot_value_type();

-- Step 6: Update the RLS policy for insert (if needed, but usually covers all columns)
-- No change should be necessary for RLS policies if they are column-agnostic.
-- The existing RLS policies on public.snapshots for SELECT and INSERT should still apply correctly.
-- Example of existing INSERT policy (re-added for clarity, no actual change needed):
-- ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY; -- Should already be enabled
-- DROP POLICY IF EXISTS "Enable insert for automated processes on snapshots" ON public.snapshots; -- Drop and recreate if modifying
-- CREATE POLICY "Enable insert for automated processes on snapshots" ON public.snapshots
-- FOR INSERT WITH CHECK (auth.role() = 'service_role');