"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BarChart3, LogOut, User, Calendar, BarChart2, Building2, Globe, Sun, Moon, Monitor, ChevronDown, GanttChartSquare, DollarSign, FileText, Home, Menu } from 'lucide-react'
import Image from 'next/image'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from '@/hooks/useLocale'
import { useTheme } from 'next-themes'
import { getAccessibleRoutes, getRoleDisplayName } from '@/lib/rbac'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
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
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { SIDEBAR_ICON_MAP } from '@/configs/icons';

// Mobile Sidebar Component
function MobileSidebar() {
  const pathname = usePathname()
  const t = useTranslations('navigation')
  const { locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()
  const { user, isLoading, signOut, role, permissions, profile, isAuthenticated } = useCurrentUser()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getAvatarUrl = () => {
    if (!user?.user_metadata?.avatar_url) return null;
    return user.user_metadata.avatar_url;
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email || 'User';
  };

  if (isLoading || !user) {
    return null;
  }

  const accessibleRoutes = getAccessibleRoutes(role, permissions, profile, isAuthenticated);
  const navItems = accessibleRoutes.map(route => ({
    href: route.path,
    label: t(route.label),
    icon: SIDEBAR_ICON_MAP[route.icon as keyof typeof SIDEBAR_ICON_MAP] || Home,
    exact: route.path === '/'
  }));

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-primary border-sidebar-border hover:bg-sidebar-accent md:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <SheetHeader className="p-4 border-b border-sidebar-border">
          <SheetTitle className="flex items-center space-x-2">
            <Image src="/logo_icon.jpg" alt="Isleno" width={32} height={32} className="rounded" />
            <span className="text-xl font-bold">Isleno</span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          {/* Navigation Items */}
          <div className="flex-1 p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-sidebar-foreground/70 mb-4">{t('navigation')}</h3>
              {navItems.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          
          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3 p-3 rounded-lg">
              {getAvatarUrl() ? (
                <Image
                  className="h-10 w-10 rounded-full"
                  src={getAvatarUrl()!}
                  alt={getUserName()}
                  width={40}
                  height={40}
                />
              ) : (
                <User className="h-10 w-10" />
              )}
              <div className="flex-1">
                <div className="font-medium">{getUserName()}</div>
                <div className="text-sm text-sidebar-foreground/70">{getRoleDisplayName(role)}</div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-4 space-y-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Globe className="h-4 w-4 mr-2" />
                    {t('language')}: {locale?.toUpperCase()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setLocale('en')}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocale('es')}>
                    Español
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    {theme === 'light' && <Sun className="h-4 w-4 mr-2" />}
                    {theme === 'dark' && <Moon className="h-4 w-4 mr-2" />}
                    {theme === 'system' && <Monitor className="h-4 w-4 mr-2" />}
                    {t('theme')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="h-4 w-4 mr-2" />
                    {t('light')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="h-4 w-4 mr-2" />
                    {t('dark')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="h-4 w-4 mr-2" />
                    {t('system')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-500 hover:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('signOut')}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const t = useTranslations('navigation')
  const { locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()
  const { state: collapseState } = useSidebar()

  const { user, isLoading, signOut, role, permissions, profile, isAuthenticated } = useCurrentUser()

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get the user avatar URL from Google OAuth
  const getAvatarUrl = () => {
    if (!user?.user_metadata?.avatar_url) return null;
    return user.user_metadata.avatar_url;
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email || 'User';
  };

  if (isLoading) {
    return (
      <>
        <MobileSidebar />
        <Sidebar className="hidden md:block">
          <SidebarHeader>
            <div className="flex items-center space-x-2 px-2">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </SidebarContent>
        </Sidebar>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <MobileSidebar />
        <Sidebar className="hidden md:block">
          <SidebarHeader>
            <div className="flex items-center space-x-2 px-2">
              <Image src="/logo_icon.jpg" alt="Isleno" width={32} height={32} className="rounded" />
              <span className="text-xl font-bold">Isleno</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <div className="flex items-center justify-center h-full">
              <Link href="/auth/login">
                <Button>{t('signIn')}</Button>
              </Link>
            </div>
          </SidebarContent>
        </Sidebar>
      </>
    );
  }

  // Get accessible routes based on user role and permissions
  const accessibleRoutes = getAccessibleRoutes(role, permissions, profile, isAuthenticated);
  
  // Icon mapping
  const navItems = accessibleRoutes.map(route => ({
    href: route.path,
    label: t(route.label),
    icon: SIDEBAR_ICON_MAP[route.icon as keyof typeof SIDEBAR_ICON_MAP] || Home,
    exact: route.path === '/'
  }));

  return (
    <>
      <MobileSidebar />
      <Sidebar collapsible="icon" className="hidden md:block">
        {/* SidebarTrigger: Overlapping right edge, only on desktop */}
        <div className="hidden md:block relative">
          <SidebarTrigger />
        </div>
        <SidebarHeader>
          <div className="flex items-center space-x-2 px-2 mt-4 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center">
            <Image 
              src="/logo_icon.jpg" 
              alt="Isleno" 
              width={24} 
              height={24} 
              className={`rounded`} 
            />
            {collapseState === 'expanded' && <span className="text-xl font-bold">Isleno Admin</span>}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t('navigation')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <item.icon className="h-5 w-5" />
                          {collapseState === 'expanded' && <span className="ml-2">{item.label}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mb-4 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center">
                    {getAvatarUrl() ? (
                      <Image
                        className="rounded-full"
                        src={getAvatarUrl()!}
                        alt={getUserName()}
                        width={24}
                        height={24}
                      />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                    {collapseState === 'expanded' && (
                      <div className="flex flex-col text-left ml-2">
                        <span className="truncate font-medium">{getUserName()}</span>
                        <span className="truncate text-xs text-muted-foreground">{getRoleDisplayName(role)}</span>
                      </div>
                    )}
                    {collapseState === 'expanded' && <ChevronDown className="ml-auto h-4 w-4" />}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Language Switcher */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Globe className="h-4 w-4 mr-2" />
                        {t('language')}: {locale?.toUpperCase()}
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right">
                      <DropdownMenuItem onClick={() => setLocale('en')}>
                        English
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocale('es')}>
                        Español
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Theme Switcher */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        {theme === 'light' && <Sun className="h-4 w-4 mr-2" />}
                        {theme === 'dark' && <Moon className="h-4 w-4 mr-2" />}
                        {theme === 'system' && <Monitor className="h-4 w-4 mr-2" />}
                        {t('theme')}
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right">
                      <DropdownMenuItem onClick={() => setTheme('light')}>
                        <Sun className="h-4 w-4 mr-2" />
                        {t('light')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('dark')}>
                        <Moon className="h-4 w-4 mr-2" />
                        {t('dark')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('system')}>
                        <Monitor className="h-4 w-4 mr-2" />
                        {t('system')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  )
} 