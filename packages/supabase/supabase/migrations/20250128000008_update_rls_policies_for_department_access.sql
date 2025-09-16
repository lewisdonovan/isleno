-- /packages/supabase/migrations/20250128000005_3_update_rls_policies_for_department_access.sql

-- Purpose: Update RLS policies to support department-level access
--          This is a separate migration to avoid enum parsing issues

-- ============================================================================
-- UPDATE RLS POLICIES FOR DEPARTMENT-LEVEL ACCESS
-- ============================================================================

-- Update KPI policies to support department-level access
DROP POLICY IF EXISTS "Users can view KPIs with permission" ON public.kpis;
CREATE POLICY "Users can view KPIs with permission"
  ON public.kpis FOR SELECT
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpi.view')
    OR public.can_access_department_resource(auth.uid(), department_id, 'kpis', 'view')
  );

-- Update department policies to support department-level access
DROP POLICY IF EXISTS "Users can view departments with permission" ON public.departments;
CREATE POLICY "Users can view departments with permission"
  ON public.departments FOR SELECT
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'department.view')
  );

-- Note: project and invoice tables don't exist yet, so we'll skip those policies
-- They can be added later when those tables are created
