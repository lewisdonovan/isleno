# Admin Permissions System

A comprehensive admin-level permissions system that provides full system access for CEO and IT users.

## Overview

The admin permissions system provides unrestricted access to all system resources and functionality. Admin users bypass all permission checks and have access to everything, everywhere.

## Key Features

- **Full System Access**: Admin users can access all KPIs, invoices, projects, users, and departments
- **Bypass All Restrictions**: Admin access overrides all other permission checks
- **CEO and IT Reserved**: Specifically designed for CEO and IT users who need complete system access
- **Secure Management**: Only existing admins can assign or remove admin roles
- **Audit Trail**: All admin role changes are logged for security

## Architecture

### Admin Role Hierarchy

```
1. Admin Access (highest priority - bypasses everything)
   ↓
2. Direct User Permission
   ↓
3. Role-Based Permission
   ↓
4. Department-Level Permission (for department heads)
   ↓
5. Individual Permission Fallback (lowest priority)
```

### Permission Types

#### Admin-Level Permissions
- `admin.admin` - Full system administration access
- `admin.view` - View all system data
- `admin.create` - Create any system resource
- `admin.edit` - Edit any system resource
- `admin.delete` - Delete any system resource
- `admin.manage_roles` - Manage all user roles
- `admin.manage_permissions` - Manage all user permissions
- `admin.audit` - View all audit logs
- `admin.export` - Export all system data
- `admin.import` - Import system data
- `admin.configure` - Configure system settings

## Database Schema

### Admin Role Assignment
```sql
-- Admin role in user_roles table
INSERT INTO public.user_roles (user_id, role) VALUES ('user-id', 'admin');
```

### Admin Permission Check Function
```sql
-- Updated user_has_permission function with admin bypass
CREATE OR REPLACE FUNCTION public.user_has_permission(
  check_user_id uuid,
  permission_name text,
  resource_context jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- FIRST CHECK: Admin access - if user is admin, grant access to everything
  IF EXISTS(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;
  
  -- ... rest of permission checking logic
END;
$$;
```

### Admin Helper Functions
```sql
-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean

-- Get all admin users
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (user_id uuid, full_name text, email text, created_at timestamp with time zone)
```

## API Endpoints

### Admin Status Check
```
GET /api/permissions/admin-status
```

**Response:**
```json
{
  "isAdmin": true,
  "user_id": "uuid"
}
```

### Admin User Management
```
GET /api/permissions/admin-users
POST /api/permissions/admin-users
DELETE /api/permissions/admin-users
```

**GET Response:**
```json
{
  "adminUsers": [
    {
      "user_id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-28T10:00:00Z"
    }
  ],
  "count": 1
}
```

**POST Request:**
```json
{
  "target_user_id": "uuid"
}
```

**DELETE Request:**
```json
{
  "target_user_id": "uuid"
}
```

## Usage Examples

### Checking Admin Status
```typescript
import { useAdminStatus } from '@/hooks/usePermissions'

function MyComponent() {
  const { isAdmin, loading } = useAdminStatus()
  
  if (loading) return <div>Loading...</div>
  if (isAdmin) return <div>Admin Dashboard</div>
  
  return <div>Regular User View</div>
}
```

### Server-Side Admin Check
```typescript
import { serverPermissionService } from '@/lib/services/permissions'

// Check if user is admin
const isAdmin = await serverPermissionService.isUserAdmin(userId)

// Admin users automatically have all permissions
const hasPermission = await serverPermissionService.userHasPermission(userId, 'kpi.view')
// Returns true for admin users regardless of specific permissions
```

### Admin Management
```typescript
import { AdminManager } from '@/components/AdminManager'

// Admin management interface
<AdminManager />
```

## React Hooks

### `useAdminStatus()`
```typescript
const { isAdmin, loading, error, refetch } = useAdminStatus()
```

### `useAdminUsers()`
```typescript
const { adminUsers, loading, error, refetch } = useAdminUsers()
```

## Permission Service Methods

### ServerPermissionService
```typescript
// Check if user is admin
await serverPermissionService.isUserAdmin(userId)

// Assign admin role
await serverPermissionService.assignAdminRole(userId)

// Remove admin role
await serverPermissionService.removeAdminRole(userId)

// Get all admin users
await serverPermissionService.getAdminUsers()
```

### PermissionUtils
```typescript
// Check admin status
await PermissionUtils.isAdmin(service, userId)

// Get admin permissions
PermissionUtils.getAdminPermissions()

// Check admin access
await PermissionUtils.hasAdminAccess(service, userId)
```

## RLS Policies

### Updated Policies with Admin Bypass
```sql
-- KPI policy with admin bypass
CREATE POLICY "Users can view KPIs with permission, department access, or admin access"
  ON public.kpis FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    public.user_has_permission(auth.uid(), 'kpi.view', jsonb_build_object('department_id', department_id)) OR
    public.can_access_department_resources(auth.uid(), department_id, 'kpi', 'view')
  );

-- Invoice policy with admin bypass
CREATE POLICY "Users can view invoices with permission, department access, or admin access"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    public.user_has_permission(auth.uid(), 'invoice.view', jsonb_build_object('department_id', department_id)) OR
    public.can_access_department_resources(auth.uid(), department_id, 'invoice', 'view')
  );
```

## Security Considerations

### Access Control
- **Admin-Only Management**: Only existing admins can assign or remove admin roles
- **Self-Protection**: Admins cannot remove their own admin role
- **Audit Logging**: All admin role changes are logged
- **Email Validation**: Admin assignment requires valid user email

### Data Protection
- **RLS Enforcement**: Database-level security with admin bypass
- **Permission Validation**: Admin access is checked first in all permission functions
- **Secure API**: All admin management endpoints require admin authentication

## Admin Permissions Include

### System Access
- ✅ Full access to all KPIs across all departments
- ✅ Full access to all invoices across all departments
- ✅ Full access to all projects across all departments
- ✅ Full access to all users and user profiles
- ✅ Full access to all departments and department data

### Administrative Functions
- ✅ User role management (assign/remove any role)
- ✅ Permission management (assign/remove any permission)
- ✅ System configuration and settings
- ✅ Audit log access and monitoring
- ✅ Data export and import capabilities
- ✅ Maintenance mode management

### Department Access
- ✅ Access to all department-level resources
- ✅ Override department-level restrictions
- ✅ Cross-department data access
- ✅ Department head management

## UI Components

### AdminManager Component
```typescript
import { AdminManager } from '@/components/AdminManager'

// Full admin management interface
<AdminManager />
```

**Features:**
- Add new admin users by email
- Remove admin access from users
- View all current admin users
- Security notices and warnings
- Admin permission information

## Assignment Process

### Adding New Admin Users
1. **Admin Access Required**: Only existing admins can add new admins
2. **Email Validation**: System validates the email exists in the user database
3. **Role Assignment**: Admin role is assigned to the user
4. **Immediate Access**: User gains full system access immediately
5. **Audit Logging**: Assignment is logged for security

### Removing Admin Access
1. **Admin Access Required**: Only existing admins can remove admin access
2. **Self-Protection**: Admins cannot remove their own admin role
3. **Confirmation Required**: System requires confirmation before removal
4. **Immediate Effect**: User loses admin access immediately
5. **Audit Logging**: Removal is logged for security

## Best Practices

### For Administrators
- **Regular Review**: Regularly review admin user list
- **Principle of Least Privilege**: Only assign admin roles when absolutely necessary
- **Secure Assignment**: Use secure channels for admin role assignment
- **Monitor Usage**: Monitor admin user activity and access patterns

### For Developers
- **Admin Checks**: Always check admin status first in permission functions
- **Fallback Logic**: Ensure admin access works even if other systems fail
- **Error Handling**: Provide clear error messages for admin-related operations
- **Security Logging**: Log all admin-related actions for audit

## Troubleshooting

### Common Issues

1. **Admin Not Getting Access**
   - Verify user has `admin` role in `user_roles` table
   - Check if RLS policies include admin bypass
   - Ensure permission functions check admin status first

2. **Cannot Assign Admin Role**
   - Verify current user has admin access
   - Check if target user exists in the system
   - Ensure API endpoints are properly authenticated

3. **Admin Access Denied**
   - Check if user has `admin` role assigned
   - Verify RLS policies include `public.is_admin(auth.uid())`
   - Check if permission functions are updated

### Debug Commands

```sql
-- Check if user is admin
SELECT public.is_admin('user-id');

-- Get all admin users
SELECT * FROM public.get_admin_users();

-- Check user roles
SELECT role FROM public.user_roles WHERE user_id = 'user-id';

-- Test admin permission check
SELECT public.user_has_permission('user-id', 'kpi.view', '{}'::jsonb);
```

## Future Enhancements

- **Time-Limited Admin Access**: Temporary admin access with expiration
- **Admin Access Levels**: Different levels of admin access (super admin, department admin)
- **Admin Activity Monitoring**: Detailed logging of admin actions
- **Emergency Admin Access**: Break-glass admin access for emergencies
- **Admin Access Delegation**: Temporary delegation of admin access

## Migration Guide

### From Existing System
1. **Deploy Database Migration**: Run admin permissions migration
2. **Assign Initial Admins**: Assign admin roles to CEO and IT users
3. **Update Permission Checks**: Ensure all permission checks include admin bypass
4. **Test Admin Access**: Verify admin users can access all resources
5. **Update UI Components**: Add admin management interfaces

### Example Migration
```typescript
// Assign admin role to CEO
await serverPermissionService.assignAdminRole(ceoUserId)

// Assign admin role to IT user
await serverPermissionService.assignAdminRole(itUserId)

// Verify admin access
const isAdmin = await serverPermissionService.isUserAdmin(userId)
```

The admin permissions system provides complete system access for CEO and IT users while maintaining security and audit capabilities! 🚀
