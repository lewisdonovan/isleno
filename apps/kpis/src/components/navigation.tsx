"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Table, BarChart3, LogOut, User, Calendar, BarChart2 } from 'lucide-react'
import Image from 'next/image'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useEffect, useState } from 'react'
import { ModeToggle } from '@/components/mode-toggle'

export function Navigation() {
  const pathname = usePathname()
  const isKpisDashboard = pathname.startsWith('/boards')
  const brandName = 'Isleño'
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoading: userLoading } = useCurrentUser()

  useEffect(() => {
    // Check if user is authenticated via API
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/status')
        const data = await response.json()
        setIsAuthenticated(data.authenticated)
      } catch (error) {
        console.error('Authentication check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/monday/logout', {
        method: 'POST',
      });
      setIsAuthenticated(false)
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get the best available avatar URL
  const getAvatarUrl = () => {
    if (!user) return null;
    return user.photo_thumb_small || user.photo_thumb || user.photo_original;
  };

  if (isLoading || userLoading) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-xl font-bold">
                {brandName}
              </Link>
            </div>
            <ModeToggle />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-bold">
              {brandName}
            </Link>
            {isAuthenticated && (
              <div className="flex items-center space-x-2">
                <Link href="/calendar">
                  <Button
                    variant={pathname.startsWith('/calendar') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Calendar</span>
                  </Button>
                </Link>
                <Link href="/gantt">
                  <Button
                    variant={pathname.startsWith('/gantt') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <BarChart2 className="h-4 w-4" />
                    <span>Timeline</span>
                  </Button>
                </Link>
                <Link href="/cashflow">
                  <Button
                    variant={pathname.startsWith('/cashflow') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Cashflow</span>
                  </Button>
                </Link>
                <Link href="/boards">
                  <Button
                    variant={pathname.startsWith('/boards') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Table className="h-4 w-4" />
                    <span>Boards</span>
                  </Button>
                </Link>
                <Link href="/charts">
                  <Button
                    variant={pathname === '/charts' ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Charts</span>
                  </Button>
                </Link>
                <Link href="/kpis">
                  <Button
                    variant={pathname.startsWith('/kpis') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <span>KPIs</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <ModeToggle />
            {isAuthenticated && (
              <>
                {user && (
                  <div className="flex items-center space-x-3">
                    {getAvatarUrl() ? (
                      <div className="relative">
                        <Image
                          src={getAvatarUrl()!}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 