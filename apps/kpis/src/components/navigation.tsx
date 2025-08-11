"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Table, BarChart3, LogOut, User, Calendar, BarChart2, Globe, Sun, Moon, Monitor, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from '@/hooks/useLocale'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NAVIGATION_ITEMS, NAVIGATION_ICON_MAP } from '@/configs';

export function Navigation() {
  const pathname = usePathname()
  const t = useTranslations('navigation')
  const { locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()

  const { user, isLoading, signOut } = useCurrentUser()

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
      <nav className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center space-x-2">
                  <Image src="/logo_icon.jpg" alt="Isleno" width={32} height={32} className="rounded" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Isleno</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center space-x-2">
                  <Image src="/logo_icon.jpg" alt="Isleno" width={32} height={32} className="rounded" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Isleno</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">{t('signIn')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const navItems = NAVIGATION_ITEMS.map(item => ({
    ...item,
    icon: NAVIGATION_ICON_MAP[item.icon],
    label: t(item.label)
  }));

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Navigation items (left) */}
          <div className="flex items-center space-x-8 flex-1">
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navItems.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                      isActive
                        ? 'border-teal-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          {/* User, language, theme menus (center-right) */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Globe className="h-4 w-4 mr-2" />
                  {locale?.toUpperCase()}
                  <ChevronDown className="h-4 w-4 ml-2" />
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
            {/* Theme Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  {theme === 'light' && <Sun className="h-4 w-4" />}
                  {theme === 'dark' && <Moon className="h-4 w-4" />}
                  {theme === 'system' && <Monitor className="h-4 w-4" />}
                  <ChevronDown className="h-4 w-4 ml-2" />
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
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  {getAvatarUrl() ? (
                    <Image
                      className="h-8 w-8 rounded-full"
                      src={getAvatarUrl()!}
                      alt={getUserName()}
                      width={32}
                      height={32}
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{getUserName()}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Logo and title (right) */}
          <div className="flex items-center space-x-2 ml-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo_icon.jpg" alt="Isleno" width={32} height={32} className="rounded" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Isleno</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 