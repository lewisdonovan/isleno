-- Enums for KPIs
CREATE TYPE kpi_data_type AS ENUM (
    'numeric', 
    'percentage', 
    'currency', 
    'boolean', 
    'text'
);
CREATE TYPE kpi_unit_of_measure AS ENUM (
    'EUR', 'USD', 'GBP', 
    'years', 'months', 'weeks', 'days', 'hours', 'minutes', 
    'percent', 'count', 'ratio', 'text');
CREATE TYPE kpi_target_frequency AS ENUM (
    'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
);
CREATE TYPE symbol_position AS ENUM ('left', 'right');

--------------------------------
-- KPI Categories Table
--------------------------------

-- Create the KPI Categories table (re-included for completeness)
CREATE TABLE public.kpi_categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    updated_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Add index for category_name for faster lookups
CREATE INDEX idx_kpi_categories_name ON public.kpi_categories (category_name);

-- Enable Row Level Security for kpi_categories table
ALTER TABLE public.kpi_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read KPI categories
CREATE POLICY "Enable read access for all authenticated users on categories" ON public.kpi_categories
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only service_role or specific roles can manage categories
CREATE POLICY "Enable full access for admin users on categories" ON public.kpi_categories
FOR ALL USING (auth.role() = 'service_role');


--------------------------------
-- Departments Table
--------------------------------

CREATE TABLE public.departments (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    updated_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Add index for department_name for faster lookups
CREATE INDEX idx_departments_name ON public.departments (department_name);

-- Enable Row Level Security for departments table
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read departments
CREATE POLICY "Enable read access for all authenticated users on departments" ON public.departments
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only service_role or specific roles can manage departments
CREATE POLICY "Enable full access for admin users on departments" ON public.departments
FOR ALL USING (auth.role() = 'service_role');


--------------------------------
-- KPIs Table
--------------------------------

-- Create the KPIs table
-- NOTE: The 'department' TEXT column is replaced by 'department_id'
CREATE TABLE public.kpis (
    kpi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monday_item_id TEXT UNIQUE, -- Monday's item ID, for linking
    location TEXT NOT NULL,     -- e.g., 'PMI', 'MAH'
    department_id UUID NOT NULL REFERENCES public.departments(department_id) ON DELETE RESTRICT, -- FK to departments
    role_resp TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'ALL',
    kpi_name TEXT NOT NULL UNIQUE, -- The name of the KPI, should be unique
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    effort SMALLINT,           -- Estimated effort (0-10) if not implemented
    impact SMALLINT,           -- Estimated impact (0-10) if not implemented
    priority SMALLINT,         -- Business priority (1-10) if not implemented
    data_type kpi_data_type NOT NULL,    -- Using the defined ENUM type
    unit_of_measure kpi_unit_of_measure NOT NULL, -- Using the defined ENUM type
    target_value NUMERIC,       -- The desired target value for the KPI
    target_frequency kpi_target_frequency NOT NULL DEFAULT 'daily', -- Using the defined ENUM type
    symbol_position symbol_position NOT NULL DEFAULT 'right', -- Using the defined ENUM type
    definition_url TEXT,        -- URL to a detailed definition/calculation method FOR FUTURE IMPLEMENTATION

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(), -- Links to Supabase Auth user
    updated_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()  -- Links to Supabase Auth user
);

-- Add indexes for common query patterns
CREATE INDEX idx_kpis_location ON public.kpis (location);
CREATE INDEX idx_kpis_department_id ON public.kpis (department_id); -- Index for the FK
CREATE INDEX idx_kpis_is_active ON public.kpis (is_active);

-- Enable Row Level Security for kpis table
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read KPI definitions
CREATE POLICY "Enable read access for all authenticated users" ON public.kpis
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only service_role or specific roles can manage (insert/update/delete) KPI definitions
-- Adjust this policy based on your specific access control needs
CREATE POLICY "Enable full access for admin users only" ON public.kpis
FOR ALL USING (auth.role() = 'service_role');


--------------------------------
-- KPI Categories Join Table
--------------------------------

-- Create the Many-to-Many join table for KPIs and Categories (re-included for completeness)
CREATE TABLE public.kpi_kpi_categories (
    kpi_id UUID NOT NULL REFERENCES public.kpis(kpi_id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.kpi_categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (kpi_id, category_id), -- Composite primary key ensures uniqueness
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for join performance
CREATE INDEX idx_kpi_kpi_categories_kpi_id ON public.kpi_kpi_categories (kpi_id);
CREATE INDEX idx_kpi_kpi_categories_category_id ON public.kpi_kpi_categories (category_id);

-- Enable Row Level Security for the join table
ALTER TABLE public.kpi_kpi_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read associations
CREATE POLICY "Enable read access for all authenticated users on kpi_kpi_categories" ON public.kpi_kpi_categories
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only service_role or specific roles can manage associations (add/remove KPI from category)
CREATE POLICY "Enable full access for admin users on kpi_kpi_categories" ON public.kpi_kpi_categories
FOR ALL USING (auth.role() = 'service_role');


--------------------------------
-- Snapshots Table
--------------------------------

-- Create the Snapshots table (re-included for completeness)
CREATE TABLE public.snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES public.kpis(kpi_id) ON DELETE CASCADE, -- Links to the KPI definition
    snapshot_date DATE NOT NULL, -- The date for which the snapshot was taken (daily now!)
    snapshot_value NUMERIC,      -- The actual measured value of the KPI for that date
    snapshot_data JSONB,         -- Raw JSON for additional related data/metrics

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Ensure only one snapshot per KPI per day
    UNIQUE (kpi_id, snapshot_date)
);

-- Add indexes for common query patterns
CREATE INDEX idx_snapshots_kpi_id ON public.snapshots (kpi_id);
CREATE INDEX idx_snapshots_snapshot_date ON public.snapshots (snapshot_date);

-- Enable Row Level Security for snapshots table
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read snapshot data
CREATE POLICY "Enable read access for all authenticated users on snapshots" ON public.snapshots
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only service_role or specific roles can insert snapshot data
-- This will likely be handled by automated processes, not direct user input
CREATE POLICY "Enable insert for automated processes on snapshots" ON public.snapshots
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Policy: Prevent direct updates/deletes to snapshots (snapshots are typically immutable once taken)