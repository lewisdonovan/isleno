/**
 * User Roles Management Page
 * 
 * Main page for managing user roles and permissions.
 * Only accessible to admin users.
 */

import { UserRolesList } from '@/components/UserRolesList'
import { AdminRouteProtection } from '@/components/AdminRouteProtection'

export default function UserRolesPage() {
  return (
    <AdminRouteProtection>
      <div className="container mx-auto py-6">
        <UserRolesList />
      </div>
    </AdminRouteProtection>
  )
}
