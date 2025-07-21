-- Add red_value and yellow_value columns
ALTER TABLE kpis
  ADD COLUMN red_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN yellow_value numeric NOT NULL DEFAULT 0;

-- Create direction enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kpi_direction') THEN
    CREATE TYPE kpi_direction AS ENUM ('up', 'down');
  END IF;
END$$;

-- Add direction column
ALTER TABLE kpis
  ADD COLUMN direction kpi_direction NOT NULL DEFAULT 'up';
