-- Create table to define KPI snapshot configurations
create table public.kpi_snapshot_configs (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid references public.kpis(kpi_id) on delete cascade,
  source_board_ids jsonb, -- stores an array of board IDs involved, e.g. [5740801783, 9076281262]
  graphql_query text, -- pre-built query if static
  transform_function text, -- name of the function to run in code
  notes text, -- developer or ops notes
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  updated_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- index for fast lookups
create index idx_kpi_snapshot_configs_kpi_id on public.kpi_snapshot_configs (kpi_id);

-- enable row level security
alter table public.kpi_snapshot_configs enable row level security;

-- policy: only authenticated users can read kpi snapshot configs
create policy "Enable read access for all authenticated users on kpi snapshot configs" on public.kpi_snapshot_configs for select using (auth.role() = 'authenticated');

-- policy: only service_role or specific roles can manage kpi snapshot configs
create policy "Enable full access for admin users on kpi snapshot configs" on public.kpi_snapshot_configs for all using (auth.role() = 'service_role');