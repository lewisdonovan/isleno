"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BarChart3, LogOut, User, Calendar, BarChart2, Globe, Sun, Moon, Monitor, ChevronDown, TrendingUp, FileStack } from 'lucide-react'
import Image from 'next/image'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from '@/components/locale-provider'
import { useTheme } from 'next-themes'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AppSidebar() {
  const pathname = usePathname()
  const t = useTranslations('navigation')
  const { locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()
  const { state: _state } = useSidebar()

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

  // Navigation items
  const navigationItems = [
    {
      title: t('kpis'),
      url: '/kpis',
      icon: TrendingUp,
      active: pathname.startsWith('/kpis')
    },
    {
      title: t('invoices'),
      url: '/invoices',
      icon: FileStack,
      active: pathname.startsWith('/invoices')
    },
    {
      title: t('calendar'),
      url: '/calendar',
      icon: Calendar,
      active: pathname.startsWith('/calendar')
    },
    {
      title: t('timeline'),
      url: '/gantt',
      icon: BarChart2,
      active: pathname.startsWith('/gantt')
    },
    {
      title: t('cashflow'),
      url: '/cashflow',
      icon: BarChart3,
      active: pathname.startsWith('/cashflow')
    },
    // {
    //   title: t('boards'),
    //   url: '/boards',
    //   icon: Table,
    //   active: pathname.startsWith('/boards')
    // },
    // {
    //   title: t('charts'),
    //   url: '/charts',
    //   icon: BarChart3,
    //   active: pathname === '/charts'
    // }
  ]

  if (isLoading || userLoading) {
    return (
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-center p-4">
            <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 6 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <div className="w-full h-10 bg-muted rounded animate-pulse" />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-center p-4 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
          <Link href="/" className="flex items-center space-x-2 text-center justify-center group-data-[collapsible=icon]:justify-center">
            <div className={`w-8 h-8 group-data-[collapsible=icon]:mx-auto`}>
              <Image
                src={"/logo_icon.jpg"}
                alt="Isleño"
                width={32}
                height={32}
                className="rounded-full w-full h-full object-cover mr-2 group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:mx-auto"
              />
            </div>
            <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">{t('brand')}</span>
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={item.active}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {isAuthenticated ? (
          <div className="p-4 group-data-[collapsible=icon]:p-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`
                    w-full justify-start group-data-[collapsible=icon]:p-0 
                    group-data-[collapsible=icon]:self-center
                    group-data-[collapsible=icon]:justify-center 
                    group-data-[collapsible=icon]:text-center 
                    group-data-[collapsible=icon]:items-center
                    group-data-[collapsible=icon]:flex
                    group-data-[collapsible=icon]:w-full
                    group-data-[collapsible=icon]:mb-6
                  `}>
                  {user && getAvatarUrl() ? (
                    <Image
                      src={getAvatarUrl()!}
                      alt={user.name}
                      width={24}
                      height={24}
                      className="rounded-full object-cover mr-2 group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:self-center"
                    />
                  ) : (
                    <User className="h-4 w-4 mr-2 group-data-[collapsible=icon]:mr-0" />
                  )}
                  <span className="truncate group-data-[collapsible=icon]:hidden">{user?.name || 'User'}</span>
                  <ChevronDown className="h-4 w-4 ml-auto group-data-[collapsible=icon]:hidden" />
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
          </div>
        ) : (
          <div className="p-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="w-full">
                <User className="h-4 w-4 group-data-[collapsible=icon]:mr-0 mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">{t('login')}</span>
              </Button>
            </Link>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
} 