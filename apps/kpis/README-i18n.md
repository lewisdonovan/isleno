# Internationalization (i18n) Implementation

This document describes the internationalization setup for the Isleño KPI application using `next-intl` with cookie-based language persistence for both client and server components.

## Overview

The application now supports both English and Spanish languages with automatic browser language detection and user-controlled language switching. Language preferences are stored in localStorage for a seamless user experience.

## Features

- **Automatic Browser Language Detection**: Uses the user's browser/system language preference
- **Language Switcher**: Globe icon in the navigation header with flag indicators
- **Cookie-based Persistence**: Language preference saved in cookies for both client and server access
- **No URL Changes**: Clean URLs like `/kpis`, `/calendar` (no locale prefix)
- **Fallback to English**: Defaults to English if the user's language is not supported
- **Complete Translation Coverage**: All UI text is now translatable
- **Instant Language Switching**: No page reloads required

## Supported Languages

- **English (en)**: Default language
- **Spanish (es)**: Full translation available

## File Structure

```
apps/kpis/
├── messages/
│   ├── en.json               # English translations
│   └── es.json               # Spanish translations
└── src/
    ├── app/
    │   ├── layout.tsx        # Root layout with LocaleProvider
    │   ├── page.tsx          # Home page
    │   ├── kpis/             # All original routes preserved
    │   ├── calendar/
    │   ├── auth/
    │   └── api/              # API routes unchanged
    └── components/
        ├── locale-provider.tsx   # Cookie-based locale management
        ├── language-switcher.tsx # Language switcher component
        └── navigation.tsx        # Updated with translations
    └── lib/
        └── locale.ts            # Server-side locale utilities
```

## Usage

### Adding New Translations

1. Add new keys to both `messages/en.json` and `messages/es.json`
2. Use the `useTranslations` hook in your components:

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('namespace');
  
  return <div>{t('key')}</div>;
}
```

### Translation Namespaces

- `navigation`: Navigation menu items
- `home`: Home page content
- `auth`: Authentication pages
- `calendar`: Calendar and financial calendar
- `gantt`: Project timeline and Gantt charts
- `kpis`: KPI dashboard and configuration
- `forms`: Form labels and messages
- `common`: Common UI elements and actions

### Language Switching

Users can change the language by:
1. Clicking the globe icon in the navigation header
2. Selecting their preferred language from the dropdown
3. The language preference is saved to cookies and localStorage
4. All text updates instantly without page reload
5. Server components also respect the language preference

## Technical Implementation

### LocaleProvider Configuration

The LocaleProvider handles:
- Cookie and localStorage-based language persistence
- Browser language detection
- Dynamic message loading
- Context-based state management

### Server-Side Locale Support

Server components can access locale preferences via:
- `getLocaleFromCookies()` - Get locale from cookies
- `getLocaleFromHeaders()` - Get locale from Accept-Language header
- `t(locale, namespace, key)` - Simple translation function for server components

### Routing

- All original routes preserved: `/kpis`, `/calendar`, `/auth/login`, etc.
- No locale prefix in URLs
- API routes remain unaffected: `/api/*`

### Component Updates

All major components have been updated to use translations:
- Navigation component
- Home page
- Authentication pages
- KPI components
- Calendar components
- Gantt chart components

## Browser Language Detection

The application automatically detects the user's preferred language from:
1. Cookie saved preference
2. localStorage saved preference
3. Browser language settings
4. Falls back to English if unsupported

## Future Enhancements

- Add more languages (French, German, etc.)
- Implement locale-specific date/number formatting
- Add RTL support for languages like Arabic
- Implement locale-specific content (images, documents)

## Testing

To test the implementation:

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Use the language switcher in the navigation (globe icon)
4. Verify all text changes instantly
5. Refresh the page to confirm language preference persists
6. Test server components (like `/kpis`) to ensure they respect the language preference

## Build and Deployment

The i18n setup is fully compatible with:
- Development builds
- Production builds
- Static exports
- Vercel deployment
- Docker containers 