"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '../../messages/en.json';
import esMessages from '../../messages/es.json';

type Locale = 'en' | 'es';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

const messages = {
  en: enMessages,
  es: esMessages,
};

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load locale from localStorage and cookies on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] as Locale;
    
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'es')) {
      setLocaleState(savedLocale);
    } else if (cookieLocale && (cookieLocale === 'en' || cookieLocale === 'es')) {
      setLocaleState(cookieLocale);
    } else {
      // Try to detect from browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'es') {
        setLocaleState('es');
      } else {
        setLocaleState('en');
      }
    }
    setIsLoading(false);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    // Also set cookie for server-side access
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider messages={messages[locale]} locale={locale}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
} 