-- up -----------------------------------------------------
ALTER TABLE public.snapshots
DROP CONSTRAINT IF EXISTS snapshots_kpi_id_snapshot_date_key;

ALTER TABLE public.snapshots
    ADD CONSTRAINT snapshots_dim_unique
        UNIQUE (kpi_id, snapshot_date, closer_monday_id, location);

-- down ---------------------------------------------------
ALTER TABLE public.snapshots
DROP CONSTRAINT IF EXISTS snapshots_dim_unique;

ALTER TABLE public.snapshots
    ADD CONSTRAINT snapshots_kpi_id_snapshot_date_key
        UNIQUE (kpi_id, snapshot_date);
