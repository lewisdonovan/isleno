import type { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  href: string;
  label: string;
  icon: string; // Icon name that maps to NAVIGATION_ICON_MAP
  exact?: boolean;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { href: '/', label: 'dashboard', icon: 'BarChart3', exact: true },
  { href: '/kpis', label: 'kpis', icon: 'BarChart2' },
  { href: '/invoices', label: 'invoices', icon: 'FileText' },
  { href: '/admin/user-roles', label: 'user_roles', icon: 'Users' },
];

export const SECTION_DESCRIPTIONS: Record<string, string> = {
  '/': 'Your main dashboard with an overview of all accessible sections and current status.',
  '/kpis': 'Track and analyze Key Performance Indicators across different departments and categories.',
  '/kpis/live': 'Real-time KPI dashboard with live data from Monday.com integration.',
  '/boards': 'Browse and manage Monday.com boards with full OAuth integration.',
  '/calendar': 'Financial calendar showing cash flow events, milestones, and important dates.',
  '/gantt': 'Project timeline view with Gantt charts for tracking progress and milestones.',
  '/cashflow': 'Cash flow analysis and projections with detailed financial insights.',
  '/charts': 'Data visualization tools and chart galleries for in-depth analysis.',
  '/invoices': 'Invoice management and approval workflow for financial operations.',
  '/admin/user-roles': 'Manage user roles and permissions. Admin access required.',
} as const; 