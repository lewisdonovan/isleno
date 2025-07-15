-- Migration: add_date_to_kpi_data_type.sql

-- Add 'date' as a new value to the kpi_data_type ENUM
ALTER TYPE public.kpi_data_type ADD VALUE 'date';

-- Optional: If you also need a specific unit of measure for dates (e.g., 'date_value' or similar)
-- You might want to add a corresponding value to kpi_unit_of_measure as well,
-- but 'date' as a data type implies the value itself is a date, not a count of days or similar.
-- If a KPI measures a duration (e.g., "average days to close"), 'days' in kpi_unit_of_measure is already appropriate.
-- If it's a specific date (e.g., "Next Review Date"), the unit of measure might implicitly be 'date' or a more general 'text' if not a duration.
-- For now, I'll assume 'date' as a data_type is sufficient without a new unit_of_measure.