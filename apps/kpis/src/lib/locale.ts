import { cookies } from 'next/headers';

export type Locale = 'en' | 'es';

export async function getLocaleFromCookies(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale');
  
  if (localeCookie?.value && (localeCookie.value === 'en' || localeCookie.value === 'es')) {
    return localeCookie.value as Locale;
  }
  
  return 'en'; // Default to English
}

export function getLocaleFromHeaders(headers: Headers): Locale {
  const acceptLanguage = headers.get('accept-language');
  
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].trim());
    for (const lang of languages) {
      if (lang.startsWith('es')) {
        return 'es';
      }
    }
  }
  
  return 'en';
}

// Cache for loaded translations
const translationCache: Record<Locale, any> = {
  en: null,
  es: null,
};

// Utility to resolve nested keys like 'pages.cashflow.title'
function getNested(obj: any, path: string[]): string | undefined {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function t(locale: Locale, ...keys: string[]): string {
  // Load and cache translations if not already loaded
  if (!translationCache[locale]) {
    // Use dynamic import instead of require
    import(`../../messages/${locale}.json`).then(module => {
      translationCache[locale] = module.default;
    });
    // Return a fallback while loading
    return keys[keys.length - 1];
  }
  const localeMessages = translationCache[locale];
  const translation = getNested(localeMessages, keys);
  return (typeof translation === 'string' ? translation : keys[keys.length - 1]);
} 