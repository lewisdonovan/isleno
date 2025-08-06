"use client";

import { SupportedLocale } from '@isleno/types/calendar';
import { useTranslations } from 'next-intl';

interface TaskListHeaderProps {
  headerHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  isDark: boolean;
  locale: SupportedLocale;
}

export default function TaskListHeader({ 
  headerHeight, 
  fontFamily, 
  fontSize,
  isDark,
  // locale
}: TaskListHeaderProps) {
  const t = useTranslations('gantt');
  return (
    <div 
      className="table-header-container"
      style={{ 
        width: "200px",
        height: `${headerHeight}px`,
        fontFamily, 
        fontSize,
        borderBottom: '1px solid #e2e8f0',
        background: isDark ? '#1e293b' : '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '8px',
        fontWeight: '500',
        color: isDark ? '#f1f5f9' : '#1e293b'
      }}
    >
      {t('name')}
    </div>
  );
} 