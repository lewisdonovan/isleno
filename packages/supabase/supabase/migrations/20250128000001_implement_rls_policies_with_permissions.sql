-- /packages/supabase/migrations/20250128000001_implement_rls_policies_with_permissions.sql

-- Purpose: Implement RLS policies for key business tables that integrate with the new
--          flexible permissions system. These policies will check both role-based
--          and user-specific permissions dynamically.

-- ============================================================================
-- 1. KPIS TABLE POLICIES
-- ============================================================================

-- Drop existing KPI policies if they exist
DROP POLICY IF EXISTS "Users can view KPIs" ON public.kpis;
DROP POLICY IF EXISTS "Users can create KPIs" ON public.kpis;
DROP POLICY IF EXISTS "Users can update KPIs" ON public.kpis;
DROP POLICY IF EXISTS "Users can delete KPIs" ON public.kpis;

-- KPI View Policy: Users can view KPIs if they have kpi.view permission
CREATE POLICY "Users can view KPIs with permission"
  ON public.kpis FOR SELECT
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpi.view')
  );

-- KPI Create Policy: Users can create KPIs if they have kpis.create permission
CREATE POLICY "Users can create KPIs with permission"
  ON public.kpis FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'kpi.create')
  );

-- KPI Update Policy: Users can update KPIs if they have kpis.edit permission
CREATE POLICY "Users can update KPIs with permission"
  ON public.kpis FOR UPDATE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpi.edit')
  )
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'kpi.edit')
  );

-- KPI Delete Policy: Users can delete KPIs if they have kpis.delete permission
CREATE POLICY "Users can delete KPIs with permission"
  ON public.kpis FOR DELETE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpi.delete')
  );

-- ============================================================================
-- 2. DEPARTMENTS TABLE POLICIES
-- ============================================================================

-- Drop existing department policies if they exist
DROP POLICY IF EXISTS "Users can view departments" ON public.departments;
DROP POLICY IF EXISTS "Users can create departments" ON public.departments;
DROP POLICY IF EXISTS "Users can update departments" ON public.departments;
DROP POLICY IF EXISTS "Users can delete departments" ON public.departments;

-- Department View Policy
CREATE POLICY "Users can view departments with permission"
  ON public.departments FOR SELECT
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'department.view')
  );

-- Department Create Policy
CREATE POLICY "Users can create departments with permission"
  ON public.departments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'department.create')
  );

-- Department Update Policy
CREATE POLICY "Users can update departments with permission"
  ON public.departments FOR UPDATE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'department.edit')
  )
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'department.edit')
  );

-- Department Delete Policy
CREATE POLICY "Users can delete departments with permission"
  ON public.departments FOR DELETE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'department.delete')
  );

-- ============================================================================
-- 3. PROFILES TABLE POLICIES (Enhanced)
-- ============================================================================

-- Drop existing profile policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Profile View Policy: Users can view their own profile or if they have users.view permission
CREATE POLICY "Users can view profiles with permission"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR 
    public.user_has_permission(auth.uid(), 'user.view')
  );

-- Profile Insert Policy: Users can create their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Profile Update Policy: Users can update their own profile or if they have users.edit permission
CREATE POLICY "Users can update profiles with permission"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR 
    public.user_has_permission(auth.uid(), 'user.edit')
  )
  WITH CHECK (
    id = auth.uid() OR 
    public.user_has_permission(auth.uid(), 'user.edit')
  );

-- ============================================================================
-- 4. USER ROLES TABLE POLICIES (Enhanced)
-- ============================================================================

-- Drop existing user_roles policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- User Roles View Policy: Users can view their own roles or if they have users.manage_roles permission
CREATE POLICY "Users can view roles with permission"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    public.user_has_permission(auth.uid(), 'user.manage_roles')
  );

-- User Roles Insert Policy: Only users with users.manage_roles permission can assign roles
CREATE POLICY "Users can assign roles with permission"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'user.manage_roles')
  );

-- User Roles Update Policy: Only users with users.manage_roles permission can update roles
CREATE POLICY "Users can update roles with permission"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'user.manage_roles')
  )
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'user.manage_roles')
  );

-- User Roles Delete Policy: Only users with users.manage_roles permission can remove roles
CREATE POLICY "Users can remove roles with permission"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'user.manage_roles')
  );

-- ============================================================================
-- 5. KPI CATEGORIES TABLE POLICIES
-- ============================================================================

-- Drop existing kpi_categories policies if they exist
DROP POLICY IF EXISTS "Users can view KPI categories" ON public.kpi_categories;
DROP POLICY IF EXISTS "Users can create KPI categories" ON public.kpi_categories;
DROP POLICY IF EXISTS "Users can update KPI categories" ON public.kpi_categories;
DROP POLICY IF EXISTS "Users can delete KPI categories" ON public.kpi_categories;

-- KPI Categories View Policy: Users can view if they have kpis.view permission
CREATE POLICY "Users can view KPI categories with permission"
  ON public.kpi_categories FOR SELECT
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpis.view')
  );

-- KPI Categories Create Policy: Users can create if they have kpis.create permission
CREATE POLICY "Users can create KPI categories with permission"
  ON public.kpi_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'kpi.create')
  );

-- KPI Categories Update Policy: Users can update if they have kpis.edit permission
CREATE POLICY "Users can update KPI categories with permission"
  ON public.kpi_categories FOR UPDATE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpi.edit')
  )
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'kpi.edit')
  );

-- KPI Categories Delete Policy: Users can delete if they have kpis.delete permission
CREATE POLICY "Users can delete KPI categories with permission"
  ON public.kpi_categories FOR DELETE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpi.delete')
  );

-- ============================================================================
-- 6. SNAPSHOTS TABLE POLICIES
-- ============================================================================

-- Drop existing snapshots policies if they exist
DROP POLICY IF EXISTS "Users can view snapshots" ON public.snapshots;
DROP POLICY IF EXISTS "Users can create snapshots" ON public.snapshots;
DROP POLICY IF EXISTS "Users can update snapshots" ON public.snapshots;
DROP POLICY IF EXISTS "Users can delete snapshots" ON public.snapshots;

-- Snapshots View Policy: Users can view if they have kpis.view permission
CREATE POLICY "Users can view snapshots with permission"
  ON public.snapshots FOR SELECT
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpis.view')
  );

-- Snapshots Create Policy: Users can create if they have kpis.snapshot permission
CREATE POLICY "Users can create snapshots with permission"
  ON public.snapshots FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'kpis.snapshot')
  );

-- Snapshots Update Policy: Users can update if they have kpis.edit permission
CREATE POLICY "Users can update snapshots with permission"
  ON public.snapshots FOR UPDATE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpi.edit')
  )
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'kpi.edit')
  );

-- Snapshots Delete Policy: Users can delete if they have kpis.delete permission
CREATE POLICY "Users can delete snapshots with permission"
  ON public.snapshots FOR DELETE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpi.delete')
  );

-- ============================================================================
-- 7. KPI SNAPSHOT CONFIGS TABLE POLICIES
-- ============================================================================

-- Drop existing kpi_snapshot_configs policies if they exist
DROP POLICY IF EXISTS "Users can view KPI snapshot configs" ON public.kpi_snapshot_configs;
DROP POLICY IF EXISTS "Users can create KPI snapshot configs" ON public.kpi_snapshot_configs;
DROP POLICY IF EXISTS "Users can update KPI snapshot configs" ON public.kpi_snapshot_configs;
DROP POLICY IF EXISTS "Users can delete KPI snapshot configs" ON public.kpi_snapshot_configs;

-- KPI Snapshot Configs View Policy: Users can view if they have kpis.view permission
CREATE POLICY "Users can view KPI snapshot configs with permission"
  ON public.kpi_snapshot_configs FOR SELECT
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpis.view')
  );

-- KPI Snapshot Configs Create Policy: Users can create if they have kpis.create permission
CREATE POLICY "Users can create KPI snapshot configs with permission"
  ON public.kpi_snapshot_configs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'kpi.create')
  );

-- KPI Snapshot Configs Update Policy: Users can update if they have kpis.edit permission
CREATE POLICY "Users can update KPI snapshot configs with permission"
  ON public.kpi_snapshot_configs FOR UPDATE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpi.edit')
  )
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'kpi.edit')
  );

-- KPI Snapshot Configs Delete Policy: Users can delete if they have kpis.delete permission
CREATE POLICY "Users can delete KPI snapshot configs with permission"
  ON public.kpi_snapshot_configs FOR DELETE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpi.delete')
  );

-- ============================================================================
-- 8. SPRINT BOARDS TABLE POLICIES
-- ============================================================================

-- Drop existing sprint_boards policies if they exist
DROP POLICY IF EXISTS "Users can view sprint boards" ON public.sprint_boards;
DROP POLICY IF EXISTS "Users can create sprint boards" ON public.sprint_boards;
DROP POLICY IF EXISTS "Users can update sprint boards" ON public.sprint_boards;
DROP POLICY IF EXISTS "Users can delete sprint boards" ON public.sprint_boards;

-- Sprint Boards View Policy: Users can view if they have projects.view permission
CREATE POLICY "Users can view sprint boards with permission"
  ON public.sprint_boards FOR SELECT
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'projects.view')
  );

-- Sprint Boards Create Policy: Users can create if they have projects.create permission
CREATE POLICY "Users can create sprint boards with permission"
  ON public.sprint_boards FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'projects.create')
  );

-- Sprint Boards Update Policy: Users can update if they have projects.edit permission
CREATE POLICY "Users can update sprint boards with permission"
  ON public.sprint_boards FOR UPDATE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'projects.edit')
  )
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'projects.edit')
  );

-- Sprint Boards Delete Policy: Users can delete if they have projects.delete permission
CREATE POLICY "Users can delete sprint boards with permission"
  ON public.sprint_boards FOR DELETE
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'projects.delete')
  );

-- ============================================================================
-- 9. USER MONDAY TOKENS TABLE POLICIES
-- ============================================================================

-- Drop existing user_monday_tokens policies if they exist
DROP POLICY IF EXISTS "Users can view their own Monday tokens" ON public.user_monday_tokens;
DROP POLICY IF EXISTS "Users can create their own Monday tokens" ON public.user_monday_tokens;
DROP POLICY IF EXISTS "Users can update their own Monday tokens" ON public.user_monday_tokens;
DROP POLICY IF EXISTS "Users can delete their own Monday tokens" ON public.user_monday_tokens;

-- User Monday Tokens View Policy: Users can only view their own tokens
CREATE POLICY "Users can view their own Monday tokens"
  ON public.user_monday_tokens FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- User Monday Tokens Insert Policy: Users can only create their own tokens
CREATE POLICY "Users can create their own Monday tokens"
  ON public.user_monday_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User Monday Tokens Update Policy: Users can only update their own tokens
CREATE POLICY "Users can update their own Monday tokens"
  ON public.user_monday_tokens FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User Monday Tokens Delete Policy: Users can only delete their own tokens
CREATE POLICY "Users can delete their own Monday tokens"
  ON public.user_monday_tokens FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Users can view KPIs with permission" ON public.kpis IS 
'Users can view KPIs if they have the kpis.view permission through roles or direct assignment';

COMMENT ON POLICY "Users can create KPIs with permission" ON public.kpis IS 
'Users can create KPIs if they have the kpis.create permission through roles or direct assignment';

COMMENT ON POLICY "Users can update KPIs with permission" ON public.kpis IS 
'Users can update KPIs if they have the kpis.edit permission through roles or direct assignment';

COMMENT ON POLICY "Users can delete KPIs with permission" ON public.kpis IS 
'Users can delete KPIs if they have the kpis.delete permission through roles or direct assignment';

COMMENT ON POLICY "Users can view departments with permission" ON public.departments IS 
'Users can view departments if they have the departments.view permission through roles or direct assignment';

COMMENT ON POLICY "Users can create departments with permission" ON public.departments IS 
'Users can create departments if they have the departments.create permission through roles or direct assignment';

COMMENT ON POLICY "Users can update departments with permission" ON public.departments IS 
'Users can update departments if they have the departments.edit permission through roles or direct assignment';

COMMENT ON POLICY "Users can delete departments with permission" ON public.departments IS 
'Users can delete departments if they have the departments.delete permission through roles or direct assignment';
