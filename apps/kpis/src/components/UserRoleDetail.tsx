/**
 * User Role Detail Component
 * 
 * Displays detailed user information and allows management of roles and permissions.
 * Only accessible to admin users.
 */

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Loader2, 
  ArrowLeft, 
  User, 
  Shield, 
  Users, 
  Plus, 
  Trash2, 
  Check,
  X
} from 'lucide-react'

interface UserDetail {
  id: string
  name: string | null
  job_title: string | null
  department_id: string | null
  department_name: string | null
  email: string | null
  location: string | null
  roles: string[]
  permissions: string[]
  all_permissions: Array<{
    id: string
    name: string
    description: string | null
    resource_type: string
    action: string
  }>
}

interface UserRoleDetailProps {
  userId: string
  onBack?: () => void
}

export function UserRoleDetail({ userId, onBack }: UserRoleDetailProps) {
  const t = useTranslations()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigningRole, setAssigningRole] = useState(false)
  const [removingRole, setRemovingRole] = useState<string | null>(null)
  const [newRole, setNewRole] = useState('')
  const [showAssignDialog, setShowAssignDialog] = useState(false)

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/user-roles/${userId}`)
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Access denied - Admin permissions required')
          }
          throw new Error('Failed to fetch user details')
        }
        
        const data = await response.json()
        setUser(data.user)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  const handleAssignRole = async () => {
    if (!newRole) return

    try {
      setAssigningRole(true)
      
      const response = await fetch(`/api/user-roles/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign role')
      }

      // Refresh user data
      const data = await response.json()
      if (data.success) {
        // Reload user data
        const userResponse = await fetch(`/api/user-roles/${userId}`)
        const userData = await userResponse.json()
        setUser(userData.user)
        
        setNewRole('')
        setShowAssignDialog(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role')
    } finally {
      setAssigningRole(false)
    }
  }

  const handleRemoveRole = async (role: string) => {
    try {
      setRemovingRole(role)
      
      const response = await fetch(`/api/user-roles/${userId}?role=${role}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove role')
      }

      // Refresh user data
      const data = await response.json()
      if (data.success) {
        // Reload user data
        const userResponse = await fetch(`/api/user-roles/${userId}`)
        const userData = await userResponse.json()
        setUser(userData.user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role')
    } finally {
      setRemovingRole(null)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'department_head':
        return 'default'
      case 'default':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'department_head':
        return <Users className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getPermissionBadgeVariant = (permission: string) => {
    if (permission.includes('admin')) return 'destructive'
    if (permission.includes('manage')) return 'default'
    if (permission.includes('create') || permission.includes('edit') || permission.includes('delete')) return 'secondary'
    return 'outline'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading user details...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertDescription>User not found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {user.name || 'Unknown User'}
                </CardTitle>
                <CardDescription>
                  Manage roles and permissions for this user
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Email</Label>
              <p className="text-sm">{user.email || '-'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Job Title</Label>
              <p className="text-sm">{user.job_title || '-'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Department</Label>
              <p className="text-sm">{user.department_name || '-'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Location</Label>
              <p className="text-sm">{user.location || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Roles
              </CardTitle>
              <CardDescription>
                Manage user roles. Roles grant broad sets of permissions.
              </CardDescription>
            </div>
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Role</DialogTitle>
                  <DialogDescription>
                    Select a role to assign to {user.name || 'this user'}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin - Full system access</SelectItem>
                        <SelectItem value="department_head">Department Head - Department-level access</SelectItem>
                        <SelectItem value="default">Default - Basic access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssignRole} 
                    disabled={!newRole || assigningRole}
                  >
                    {assigningRole ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      'Assign Role'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {user.roles.length === 0 ? (
            <p className="text-gray-500 text-sm">No roles assigned</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <div key={role} className="flex items-center gap-2">
                  <Badge 
                    variant={getRoleBadgeVariant(role)}
                    className="flex items-center gap-1"
                  >
                    {getRoleIcon(role)}
                    {role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRole(role)}
                    disabled={removingRole === role}
                  >
                    {removingRole === role ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            Permissions
          </CardTitle>
          <CardDescription>
            Current permissions granted to this user (from roles and direct assignments).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.permissions.length === 0 ? (
            <p className="text-gray-500 text-sm">No permissions assigned</p>
          ) : (
            <div className="space-y-2">
              {user.permissions.map((permission, index) => (
                <Badge 
                  key={`${permission}-${index}`}
                  variant={getPermissionBadgeVariant(permission)}
                  className="mr-2 mb-2"
                >
                  {permission}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Permissions</CardTitle>
          <CardDescription>
            All permissions available in the system (for reference).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(user.all_permissions.reduce((acc, permission) => {
              const resourceType = permission.resource_type
              if (!acc[resourceType]) {
                acc[resourceType] = []
              }
              acc[resourceType].push(permission)
              return acc
            }, {} as Record<string, typeof user.all_permissions>)).map(([resourceType, permissions]) => (
              <div key={resourceType}>
                <h4 className="font-medium capitalize mb-2">{resourceType}</h4>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((permission) => (
                    <Badge 
                      key={permission.id}
                      variant="outline"
                      className="text-xs"
                    >
                      {permission.name}
                    </Badge>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
