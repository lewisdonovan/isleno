# Flexible Permissions System for Supabase Database

## Overview

This document describes the implementation of a flexible permissions system that provides fine-grained access control without conflicting with existing user roles. The system allows individual permissions assignable to users or roles, using Supabase's Postgres features like RLS for enforcement.

## Key Features

- **Granular Access Control**: Define precise permissions for specific user types or functions
- **Principle of Least Privilege**: Grant only the minimal permissions required for tasks
- **Simplified and Scalable Management**: Manage permissions through roles with user overrides
- **Consistent Permission Naming**: Action-oriented, hierarchical strings (e.g., "projects.view.all")
- **RBAC with ABAC Extensions**: Role-based with attribute-based conditions via JSONB
- **Database-Level Enforcement**: Automatic, query-time checks using Supabase RLS
- **Comprehensive Auditing**: Track permission changes and access attempts
- **Lean Implementation**: Modular design with developer ease of use

## Database Schema

### Core Tables

#### 1. `permissions` Table
```sql
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, -- e.g., "projects.view", "kpis.edit"
  description text,
  resource_type text, -- e.g., "project", "kpi", "invoice"
  action text, -- e.g., "view", "edit", "delete", "approve"
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
```

#### 2. `resources` Table (Optional)
```sql
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  name text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(resource_type, resource_id)
);
```

#### 3. `role_permissions` Table
```sql
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL, -- References user_roles.role
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(role_name, permission_id)
);
```

#### 4. `user_permissions` Table
```sql
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  conditions jsonb, -- ABAC conditions: {"department_id": "123", "location": "PMI"}
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone, -- Optional expiration
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, permission_id, conditions)
);
```

#### 5. `permission_audit` Table
```sql
CREATE TABLE public.permission_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL, -- INSERT, UPDATE, DELETE
  old_values jsonb,
  new_values jsonb,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamp with time zone DEFAULT now() NOT NULL
);
```

## Permission Naming Convention

Permissions follow a hierarchical naming pattern: `resource.action`

### Examples:
- `kpis.view` - View KPIs
- `kpis.create` - Create KPIs
- `kpis.edit` - Edit KPIs
- `kpis.delete` - Delete KPIs
- `kpis.snapshot` - Create KPI snapshots
- `departments.view` - View departments
- `departments.create` - Create departments
- `projects.view` - View projects
- `invoices.approve` - Approve invoices
- `users.manage_roles` - Manage user roles
- `users.manage_permissions` - Manage user permissions
- `system.admin` - Full system administration
- `system.audit` - View audit logs

## Core Functions

### 1. `user_has_permission(user_id, permission_name, context)`
Checks if a user has a specific permission with optional context.

```sql
SELECT public.user_has_permission(
  'user-123'::uuid,
  'kpis.view',
  '{"department_id": "dept-001"}'::jsonb
) as can_view_kpis;
```

### 2. `get_user_permissions(user_id)`
Returns all permissions for a user from both roles and direct assignments.

```sql
SELECT * FROM public.get_user_permissions('user-123'::uuid);
```

### 3. `check_permission_conditions(conditions, context)`
Evaluates ABAC conditions against context.

```sql
SELECT public.check_permission_conditions(
  '{"department_id": "dept-001"}'::jsonb,
  '{"department_id": "dept-001"}'::jsonb
) as conditions_match;
```

## RLS Policies

The system implements Row Level Security (RLS) policies on all business tables that check permissions dynamically:

### Example: KPI Table Policies
```sql
-- Users can view KPIs if they have kpis.view permission
CREATE POLICY "Users can view KPIs with permission"
  ON public.kpis FOR SELECT
  TO authenticated
  USING (
    public.user_has_permission(auth.uid(), 'kpis.view')
  );

-- Users can create KPIs if they have kpis.create permission
CREATE POLICY "Users can create KPIs with permission"
  ON public.kpis FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'kpis.create')
  );
```

## Default Role Permissions

The system comes with predefined permissions for existing roles:

### `default` Role
- `kpis.view`
- `departments.view`
- `projects.view`
- `invoices.view`
- `users.view`

### `internal` Role
- All `default` permissions plus:
- `kpis.create`, `kpis.edit`, `kpis.snapshot`
- `departments.create`, `departments.edit`
- `projects.create`, `projects.edit`
- `invoices.create`, `invoices.edit`
- `users.edit`

### `external_basic` Role
- `kpis.view`
- `departments.view`
- `projects.view`
- `users.view`

### `admin` Role
- All permissions (full system access)

## API Endpoints

### Permission Management
- `GET /api/permissions` - Get all permissions
- `POST /api/permissions` - Create a new permission

### User Permissions
- `GET /api/permissions/user/[userId]` - Get user permissions
- `POST /api/permissions/user/[userId]` - Assign permission to user
- `DELETE /api/permissions/user/[userId]` - Remove permission from user

### Role Permissions
- `GET /api/permissions/role/[roleName]` - Get role permissions
- `POST /api/permissions/role/[roleName]` - Assign permission to role
- `DELETE /api/permissions/role/[roleName]` - Remove permission from role

### Permission Checking
- `GET /api/permissions/check` - Get current user's permissions
- `POST /api/permissions/check` - Check specific permission

## React Hooks

### `usePermission(permissionName, context)`
```typescript
const { hasPermission, loading, error } = usePermission('kpis.view', {
  department_id: 'dept-001'
});
```

### `useUserPermissions()`
```typescript
const { permissions, loading, error } = useUserPermissions();
```

### `usePermissions(permissionNames, context)`
```typescript
const { permissions, loading, error } = usePermissions([
  'kpis.view',
  'kpis.edit',
  'kpis.delete'
]);
```

### `useResourcePermissions(resource, context)`
```typescript
const {
  hasAnyPermission,
  hasViewPermission,
  hasCreatePermission,
  hasEditPermission,
  hasDeletePermission
} = useResourcePermissions('kpis');
```

### `usePermissionGate(permissionName, context)`
```typescript
const { canAccess, loading, error } = usePermissionGate('kpis.edit');
```

## Usage Examples

### 1. Server-Side Permission Checking
```typescript
import { serverPermissionService } from '@/lib/services/permissions';

// Check if user can view KPIs
const canViewKpis = await serverPermissionService.userHasPermission(
  userId,
  'kpis.view'
);

// Check with context (ABAC)
const canViewDeptKpis = await serverPermissionService.userHasPermission(
  userId,
  'kpis.view',
  { department_id: 'dept-001' }
);
```

### 2. Client-Side Permission Checking
```typescript
import { clientPermissionService } from '@/lib/services/permissions';

// Check current user's permission
const canEditKpis = await clientPermissionService.userHasPermission('kpis.edit');
```

### 3. React Component with Permission Gate
```typescript
import { usePermissionGate } from '@/hooks/usePermissions';

function KpiEditButton({ kpiId }: { kpiId: string }) {
  const { canAccess, loading } = usePermissionGate('kpis.edit');
  
  if (loading) return <div>Loading...</div>;
  if (!canAccess) return null;
  
  return <button>Edit KPI</button>;
}
```

### 4. Conditional Rendering Based on Permissions
```typescript
import { useResourcePermissions } from '@/hooks/usePermissions';

function KpiManagement() {
  const {
    hasViewPermission,
    hasCreatePermission,
    hasEditPermission,
    hasDeletePermission
  } = useResourcePermissions('kpis');
  
  return (
    <div>
      {hasViewPermission && <KpiList />}
      {hasCreatePermission && <CreateKpiButton />}
      {hasEditPermission && <EditKpiButton />}
      {hasDeletePermission && <DeleteKpiButton />}
    </div>
  );
}
```

### 5. Assigning User Permissions
```typescript
import { serverPermissionService } from '@/lib/services/permissions';

// Assign department-specific KPI view permission
await serverPermissionService.assignUserPermission({
  user_id: 'user-123',
  permission_id: 'permission-id',
  conditions: { department_id: 'dept-001' },
  expires_at: new Date('2024-12-31')
});
```

### 6. Assigning Role Permissions
```typescript
// Assign permission to role
await serverPermissionService.assignRolePermission({
  role_name: 'internal',
  permission_id: 'permission-id'
});
```

## ABAC (Attribute-Based Access Control)

The system supports ABAC through the `conditions` field in `user_permissions`:

### Example: Department-Specific Access
```json
{
  "department_id": "dept-001",
  "location": "PMI"
}
```

### Example: Time-Based Access
```json
{
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### Example: Resource-Specific Access
```json
{
  "project_id": "proj-001",
  "client": "acme-corp"
}
```

## Auditing

All permission changes are automatically audited:

### View Audit Logs
```sql
SELECT 
  pa.table_name,
  pa.action,
  pa.old_values,
  pa.new_values,
  pa.changed_at,
  u.email as changed_by_email
FROM public.permission_audit pa
JOIN auth.users u ON pa.changed_by = u.id
ORDER BY pa.changed_at DESC
LIMIT 10;
```

### API Access to Audit Logs
```typescript
const auditLogs = await serverPermissionService.getPermissionAuditLogs(100);
```

## Performance Considerations

### Indexes
The system includes optimized indexes for:
- User permission lookups
- Role permission lookups
- Permission name searches
- Audit log queries

### Caching
Consider implementing caching for frequently checked permissions:
```typescript
// Example with Redis cache
const cacheKey = `permissions:${userId}:${permissionName}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await checkPermission();
await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min cache
```

## Migration Guide

### From Existing Role System
1. Run the migration scripts in order
2. Existing roles will automatically get default permissions
3. Gradually migrate to granular permissions
4. Update application code to use permission checks

### Testing
1. Use the test examples in `20250128000002_permission_test_examples.sql`
2. Test RLS policies with different user contexts
3. Verify permission inheritance from roles
4. Test ABAC conditions

## Security Best Practices

1. **Principle of Least Privilege**: Grant minimal required permissions
2. **Regular Auditing**: Review permission assignments regularly
3. **Expiration Management**: Use expiration dates for temporary permissions
4. **Condition Validation**: Validate ABAC conditions before assignment
5. **Role Separation**: Keep admin permissions separate from business permissions

## Troubleshooting

### Common Issues

1. **Permission Not Working**: Check if user has both role and direct permissions
2. **RLS Blocking Access**: Verify RLS policies are correctly implemented
3. **Performance Issues**: Check indexes and consider caching
4. **ABAC Not Working**: Verify condition format and context matching

### Debug Queries
```sql
-- Check user's effective permissions
SELECT * FROM public.get_user_permissions('user-id');

-- Check specific permission
SELECT public.user_has_permission('user-id', 'permission.name', '{}');

-- View audit trail
SELECT * FROM public.permission_audit 
WHERE table_name = 'user_permissions' 
ORDER BY changed_at DESC;
```

## Future Enhancements

1. **Permission Groups**: Group related permissions for easier management
2. **Dynamic Permissions**: Permissions based on runtime conditions
3. **Permission Templates**: Predefined permission sets for common roles
4. **Advanced ABAC**: More complex condition evaluation
5. **Permission Analytics**: Usage tracking and optimization suggestions

## Conclusion

This flexible permissions system provides a robust foundation for access control that scales with your organization while maintaining security and performance. The combination of RBAC and ABAC, along with comprehensive auditing and developer-friendly APIs, ensures both security and usability.
