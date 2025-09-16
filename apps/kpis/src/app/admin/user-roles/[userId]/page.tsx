/**
 * User Role Detail Page
 * 
 * Individual user role and permission management page.
 * Only accessible to admin users.
 */

import { UserRoleDetail } from '@/components/UserRoleDetail'
import { AdminRouteProtection } from '@/components/AdminRouteProtection'

interface UserDetailPageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params
  
  return (
    <AdminRouteProtection>
      <div className="container mx-auto py-6">
        <UserRoleDetail userId={userId} />
      </div>
    </AdminRouteProtection>
  )
}
