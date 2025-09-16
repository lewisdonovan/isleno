-- /packages/supabase/migrations/20250128000002_permission_test_examples.sql

-- Purpose: Test examples and queries demonstrating the flexible permissions system.
--          This migration includes example data and test queries to validate
--          the permission system functionality.

-- ============================================================================
-- 1. EXAMPLE DATA SETUP
-- ============================================================================

-- Create some example resources for testing
INSERT INTO public.resources (resource_type, resource_id, name, metadata) VALUES
('project', 'proj-001', 'Website Redesign Project', '{"client": "Acme Corp", "budget": 50000}'),
('project', 'proj-002', 'Mobile App Development', '{"client": "TechStart", "budget": 75000}'),
('kpi', 'kpi-001', 'Customer Satisfaction Score', '{"department": "customer_service"}'),
('kpi', 'kpi-002', 'Revenue Growth Rate', '{"department": "sales"}'),
('department', 'dept-001', 'Engineering', '{"location": "PMI", "head_count": 25}'),
('department', 'dept-002', 'Marketing', '{"location": "MAH", "head_count": 12}')
ON CONFLICT (resource_type, resource_id) DO NOTHING;

-- ============================================================================
-- 2. TEST QUERIES FOR PERMISSION SYSTEM
-- ============================================================================

-- Test 1: Check if a user has a specific permission
-- Example: Check if user 'user-123' can view KPIs
/*
SELECT public.user_has_permission(
  'user-123'::uuid,
  'kpis.view',
  '{}'::jsonb
) as can_view_kpis;
*/

-- Test 2: Check permission with context (ABAC)
-- Example: Check if user can view KPIs in a specific department
/*
SELECT public.user_has_permission(
  'user-123'::uuid,
  'kpis.view',
  '{"department_id": "dept-001"}'::jsonb
) as can_view_dept_kpis;
*/

-- Test 3: Get all permissions for a user
-- Example: Get all permissions for user 'user-123'
/*
SELECT * FROM public.get_user_permissions('user-123'::uuid);
*/

-- Test 4: Check role-based permissions
-- Example: Check what permissions the 'internal' role has
/*
SELECT 
  rp.role_name,
  p.name as permission_name,
  p.description,
  p.resource_type,
  p.action
FROM public.role_permissions rp
JOIN public.permissions p ON rp.permission_id = p.id
WHERE rp.role_name = 'internal'
ORDER BY p.resource_type, p.action;
*/

-- Test 5: Check user-specific permissions with conditions
-- Example: Check user permissions with department restrictions
/*
SELECT 
  up.user_id,
  p.name as permission_name,
  up.conditions,
  up.expires_at,
  up.is_active
FROM public.user_permissions up
JOIN public.permissions p ON up.permission_id = p.id
WHERE up.user_id = 'user-123'::uuid
  AND up.is_active = true
ORDER BY p.name;
*/

-- ============================================================================
-- 3. EXAMPLE PERMISSION SCENARIOS
-- ============================================================================

-- Scenario 1: Department-specific KPI access
-- Give a user permission to view KPIs only for their department
/*
INSERT INTO public.user_permissions (user_id, permission_id, conditions, granted_by)
SELECT 
  'user-123'::uuid,
  p.id,
  '{"department_id": "dept-001"}'::jsonb,
  'admin-user-id'::uuid
FROM public.permissions p
WHERE p.name = 'kpis.view';
*/

-- Scenario 2: Time-limited permission
-- Give a user temporary permission that expires in 30 days
/*
INSERT INTO public.user_permissions (user_id, permission_id, expires_at, granted_by)
SELECT 
  'user-123'::uuid,
  p.id,
  now() + interval '30 days',
  'admin-user-id'::uuid
FROM public.permissions p
WHERE p.name = 'projects.create';
*/

-- Scenario 3: Location-based access
-- Give a user permission only for PMI location
/*
INSERT INTO public.user_permissions (user_id, permission_id, conditions, granted_by)
SELECT 
  'user-123'::uuid,
  p.id,
  '{"location": "PMI"}'::jsonb,
  'admin-user-id'::uuid
FROM public.permissions p
WHERE p.name = 'departments.view';
*/

-- ============================================================================
-- 4. ADVANCED PERMISSION QUERIES
-- ============================================================================

-- Query 1: Find users who can manage KPIs
/*
SELECT DISTINCT
  u.email,
  u.id,
  CASE 
    WHEN up.user_id IS NOT NULL THEN 'Direct Permission'
    WHEN ur.user_id IS NOT NULL THEN 'Role-based Permission'
    ELSE 'No Permission'
  END as permission_source
FROM auth.users u
LEFT JOIN public.user_permissions up ON u.id = up.user_id
  AND up.permission_id = (SELECT id FROM public.permissions WHERE name = 'kpis.edit')
  AND up.is_active = true
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  AND ur.role IN (
    SELECT rp.role_name 
    FROM public.role_permissions rp 
    WHERE rp.permission_id = (SELECT id FROM public.permissions WHERE name = 'kpis.edit')
  )
WHERE up.user_id IS NOT NULL OR ur.user_id IS NOT NULL
ORDER BY u.email;
*/

-- Query 2: Permission audit trail for a specific user
/*
SELECT 
  pa.table_name,
  pa.action,
  pa.old_values,
  pa.new_values,
  pa.changed_at,
  u.email as changed_by_email
FROM public.permission_audit pa
JOIN auth.users u ON pa.changed_by = u.id
WHERE pa.table_name = 'user_permissions'
  AND (pa.new_values->>'user_id' = 'user-123' OR pa.old_values->>'user_id' = 'user-123')
ORDER BY pa.changed_at DESC
LIMIT 10;
*/

-- Query 3: Find permissions that are about to expire
/*
SELECT 
  u.email,
  p.name as permission_name,
  up.expires_at,
  up.expires_at - now() as time_until_expiry
FROM public.user_permissions up
JOIN auth.users u ON up.user_id = u.id
JOIN public.permissions p ON up.permission_id = p.id
WHERE up.expires_at IS NOT NULL
  AND up.expires_at > now()
  AND up.expires_at <= now() + interval '7 days'
ORDER BY up.expires_at ASC;
*/

-- Query 4: Permission usage statistics
/*
SELECT 
  p.name as permission_name,
  p.resource_type,
  p.action,
  COUNT(DISTINCT up.user_id) as direct_assignments,
  COUNT(DISTINCT rp.role_name) as role_assignments,
  COUNT(DISTINCT ur.user_id) as total_users_with_permission
FROM public.permissions p
LEFT JOIN public.user_permissions up ON p.id = up.permission_id AND up.is_active = true
LEFT JOIN public.role_permissions rp ON p.id = rp.permission_id
LEFT JOIN public.user_roles ur ON rp.role_name = ur.role
GROUP BY p.id, p.name, p.resource_type, p.action
ORDER BY total_users_with_permission DESC;
*/

-- ============================================================================
-- 5. RLS POLICY TESTING QUERIES
-- ============================================================================

-- Test RLS policies by trying to access data as different users
-- Note: These queries should be run with different user contexts

-- Test 1: Try to view KPIs (should only work if user has kpis.view permission)
/*
SELECT * FROM public.kpis LIMIT 5;
*/

-- Test 2: Try to create a KPI (should only work if user has kpis.create permission)
/*
INSERT INTO public.kpis (
  kpi_name, kpi_key, department_id, data_type, 
  unit_of_measure, direction, target_frequency, 
  role_resp, location, channel, red_value, yellow_value
) VALUES (
  'Test KPI', 'test-kpi', 'dept-001', 'numeric',
  'count', 'up', 'monthly',
  'test-user', 'PMI', 'manual', 100, 80
);
*/

-- Test 3: Try to view departments (should only work if user has departments.view permission)
/*
SELECT * FROM public.departments LIMIT 5;
*/

-- Test 4: Try to view user profiles (should work for own profile or with users.view permission)
/*
SELECT * FROM public.profiles WHERE id = auth.uid();
*/

-- ============================================================================
-- 6. PERFORMANCE TESTING QUERIES
-- ============================================================================

-- Test permission check performance
/*
EXPLAIN ANALYZE
SELECT public.user_has_permission(
  'user-123'::uuid,
  'kpis.view',
  '{}'::jsonb
);
*/

-- Test user permissions query performance
/*
EXPLAIN ANALYZE
SELECT * FROM public.get_user_permissions('user-123'::uuid);
*/

-- Test RLS policy performance on large tables
/*
EXPLAIN ANALYZE
SELECT COUNT(*) FROM public.kpis;
*/

-- ============================================================================
-- 7. CLEANUP QUERIES (for testing)
-- ============================================================================

-- Remove test user permissions
/*
DELETE FROM public.user_permissions 
WHERE user_id = 'user-123'::uuid;
*/

-- Remove test resources
/*
DELETE FROM public.resources 
WHERE resource_type IN ('project', 'kpi', 'department')
  AND resource_id LIKE '%-001' OR resource_id LIKE '%-002';
*/

-- ============================================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.user_has_permission IS 
'Test this function with: SELECT public.user_has_permission(''user-id'', ''permission.name'', ''{}''::jsonb)';

COMMENT ON FUNCTION public.get_user_permissions IS 
'Test this function with: SELECT * FROM public.get_user_permissions(''user-id'')';

COMMENT ON FUNCTION public.check_permission_conditions IS 
'Test this function with: SELECT public.check_permission_conditions(''{"key": "value"}''::jsonb, ''{"key": "value"}''::jsonb)';
