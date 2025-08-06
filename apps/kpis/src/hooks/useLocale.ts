'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export type Locale = 'en' | 'es';

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // Get initial locale from cookie
    const savedLocale = Cookies.get('locale') as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'es')) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    Cookies.set('locale', newLocale, { expires: 365 }); // Save for 1 year
    // Refresh the page to load new messages
    window.location.reload();
  };

  return { locale, setLocale };
} 