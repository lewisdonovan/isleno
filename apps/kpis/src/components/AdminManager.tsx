'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAdminUsers, useAdminStatus } from '@/hooks/usePermissions'
import { Shield, UserPlus, UserMinus, Crown, AlertTriangle } from 'lucide-react'

interface AdminManagerProps {
  className?: string
}

export default function AdminManager({ className }: AdminManagerProps) {
  const t = useTranslations('common')
  const { adminUsers, loading: usersLoading, error: usersError, refetch: refetchUsers } = useAdminUsers()
  const { isAdmin, loading: statusLoading } = useAdminStatus()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newAdminEmail, setNewAdminEmail] = useState('')

  const handleAssignAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setError('Please enter an email address')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // First, find the user by email
      const findUserResponse = await fetch('/api/users/find-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newAdminEmail }),
      })

      if (!findUserResponse.ok) {
        const errorData = await findUserResponse.json()
        throw new Error(errorData.error || 'User not found')
      }

      const { user } = await findUserResponse.json()

      // Assign admin role
      const response = await fetch('/api/permissions/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_user_id: user.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign admin role')
      }

      setSuccess(`Admin role assigned to ${newAdminEmail}`)
      setNewAdminEmail('')
      refetchUsers()
      
    } catch (err) {
      console.error('Error assigning admin role:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAdmin = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to remove admin access from ${userEmail}?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/permissions/admin-users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_user_id: userId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove admin role')
      }

      setSuccess(`Admin role removed from ${userEmail}`)
      refetchUsers()
      
    } catch (err) {
      console.error('Error removing admin role:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Don't show the component if user is not admin
  if (statusLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isAdmin) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Access Denied</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            You need admin access to manage admin users. This feature is reserved for CEO and IT users only.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          <span>Admin User Management</span>
        </CardTitle>
        <CardDescription>
          Manage admin users who have full system access. Reserved for CEO and IT users only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Add New Admin */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Add New Admin User</Label>
            <div className="flex space-x-2">
              <Input
                id="adminEmail"
                type="email"
                placeholder="user@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleAssignAdmin} 
                disabled={loading || !newAdminEmail.trim()}
                className="flex items-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Admin</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Current Admin Users */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <h3 className="text-lg font-semibold">Current Admin Users</h3>
            <Badge variant="secondary">{adminUsers.length}</Badge>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : usersError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{usersError}</AlertDescription>
            </Alert>
          ) : adminUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No admin users found
            </div>
          ) : (
            <div className="space-y-3">
              {adminUsers.map((admin) => (
                <div 
                  key={admin.user_id} 
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
                      <Crown className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium">{admin.full_name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">{admin.email}</div>
                      <div className="text-xs text-gray-400">
                        Admin since: {new Date(admin.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveAdmin(admin.user_id, admin.email)}
                    disabled={loading}
                    className="flex items-center space-x-1"
                  >
                    <UserMinus className="h-4 w-4" />
                    <span>Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Permissions Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Admin Permissions Include:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Full access to all KPIs, invoices, projects, and users</li>
            <li>• Access to all departments and department-level resources</li>
            <li>• System administration and configuration access</li>
            <li>• User role and permission management</li>
            <li>• Audit log access and system monitoring</li>
            <li>• Data export and import capabilities</li>
          </ul>
        </div>

        {/* Security Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h4 className="font-medium text-red-900">Security Notice</h4>
          </div>
          <p className="text-sm text-red-800">
            Admin users have unrestricted access to all system data and functionality. 
            Only assign admin roles to trusted CEO and IT personnel. Admin access should 
            be regularly reviewed and removed when no longer needed.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
