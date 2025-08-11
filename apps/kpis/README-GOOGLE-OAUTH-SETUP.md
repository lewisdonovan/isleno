# Google OAuth Setup Guide

This document outlines the steps to configure Google OAuth authentication in your Supabase project.

## 1. Configure Google OAuth Provider in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to Authentication → Providers
4. Find Google and click "Enable"
5. You'll need to provide:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

## 2. Set up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to APIs & Services → Library
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - For development: `https://your-project-ref.supabase.co/auth/v1/callback`
     - For production: `https://your-production-domain.com/auth/v1/callback`

## 3. Configure Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

**Note**: For OAuth redirects, the application automatically uses Vercel's built-in `VERCEL_PROJECT_PRODUCTION_URL` environment variable in production, with a fallback to `http://localhost:3000` for local development. No additional configuration is needed for production deployments on Vercel.

## 4. Update Supabase Site URL

In your Supabase dashboard:
1. Go to Settings → General
2. Set the Site URL to your application's domain:
   - Development: `http://localhost:3000`
   - Production: `https://your-production-domain.com`

## 5. Test the Authentication Flow

1. Start your development server: `npm run dev --workspace @isleno/kpis`
2. Navigate to `/auth/login`
3. Click "Continue with Google"
4. Complete the OAuth flow
5. You should be redirected to the dashboard

## Key Files Modified

- `/packages/supabase/` - New Supabase frontend client package
- `/apps/kpis/src/app/auth/login/page.tsx` - Updated to use Google OAuth
- `/apps/kpis/src/app/auth/callback/page.tsx` - New OAuth callback handler
- `/apps/kpis/src/hooks/useCurrentUser.ts` - Updated to use Supabase auth
- `/apps/kpis/src/components/navigation.tsx` - Updated auth logic
- `/apps/kpis/src/components/app-sidebar.tsx` - Updated auth logic
- `/apps/kpis/src/middleware.ts` - Already using Supabase auth

## Removed Files

- Monday OAuth routes (`/api/auth/monday/*`)
- Custom auth status route (`/api/auth/status`)

## Notes

- User data is now accessed via `user.user_metadata` from Google OAuth
- Avatar images come from `user.user_metadata.avatar_url`
- User names come from `user.user_metadata.full_name`
- The middleware automatically handles authentication redirects
- Sessions are managed entirely by Supabase 