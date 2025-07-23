"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Table, BarChart3, LogOut, User, Calendar, BarChart2, Globe, Sun, Moon, Monitor, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from '@/components/locale-provider'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navigation() {
  const pathname = usePathname()
  const t = useTranslations('navigation')
  const { locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()

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
                {t('brand')}
              </Link>
            </div>
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
              {t('brand')}
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
                    <span>{t('calendar')}</span>
                  </Button>
                </Link>
                <Link href="/gantt">
                  <Button
                    variant={pathname.startsWith('/gantt') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <BarChart2 className="h-4 w-4" />
                    <span>{t('timeline')}</span>
                  </Button>
                </Link>
                <Link href="/cashflow">
                  <Button
                    variant={pathname.startsWith('/cashflow') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>{t('cashflow')}</span>
                  </Button>
                </Link>
                <Link href="/boards">
                  <Button
                    variant={pathname.startsWith('/boards') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Table className="h-4 w-4" />
                    <span>{t('boards')}</span>
                  </Button>
                </Link>
                <Link href="/charts">
                  <Button
                    variant={pathname === '/charts' ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>{t('charts')}</span>
                  </Button>
                </Link>
                <Link href="/kpis">
                  <Button
                    variant={pathname.startsWith('/kpis') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <span>{t('kpis')}</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    {user && getAvatarUrl() ? (
                      <Image
                        src={getAvatarUrl()!}
                        alt={user.name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Language Switcher */}
                  <DropdownMenuItem onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}>
                    <Globe className="mr-2 h-4 w-4" />
                    <span>{t('language')}</span>
                    <span className="ml-auto">{locale === 'en' ? '🇬🇧 EN' : '🇪🇸 ES'}</span>
                  </DropdownMenuItem>
                  
                  {/* Theme Switcher */}
                  <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}>
                    {theme === 'dark' ? (
                      <Moon className="mr-2 h-4 w-4" />
                    ) : theme === 'light' ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Monitor className="mr-2 h-4 w-4" />
                    )}
                    <span>{t('theme')}</span>
                    <span className="ml-auto">{theme === 'light' ? t('light') : theme === 'dark' ? t('dark') : t('system')}</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Logout */}
                  <DropdownMenuItem onClick={handleLogout} variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  {t('login')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 