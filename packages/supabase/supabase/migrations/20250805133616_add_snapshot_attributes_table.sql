-- +migrate Up
-- Crea la tabla snapshot_attributes
CREATE TABLE snapshot_attributes (
                                     id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                     snapshot_id                UUID NOT NULL
                                         REFERENCES public.snapshots(snapshot_id)
                                             ON DELETE CASCADE,

                                     kpi_id                     UUID NOT NULL
                                         REFERENCES public.kpis(kpi_id)
                                             ON DELETE CASCADE,

                                     snapshot_attribute         VARCHAR(255) NOT NULL,
                                     snapshot_attribute_value   VARCHAR(255) NOT NULL
);

-- +migrate Down
-- Elimina la tabla (la extensión la dejamos, suele usarse en otras tablas)
DROP TABLE IF EXISTS snapshot_attributes;