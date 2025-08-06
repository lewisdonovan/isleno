# Monday Token Flow Documentation

## Overview

This document describes the improved Monday.com token handling flow that ensures proper token management and automatic re-authentication when tokens expire.

## Key Changes

### 1. Token Storage Strategy

- **Multiple tokens allowed**: The database no longer enforces uniqueness on `user_id` in the `user_monday_tokens` table
- **Most recent token used**: The `getMondayToken` function now fetches the most recent token using `ORDER BY updated_at DESC LIMIT 1`
- **Cleanup on new auth**: When a user re-authenticates, all existing tokens are deleted before inserting the new one

### 2. Token Expiration Handling

- **Automatic detection**: The `mondayRequest` function detects 401/403 status codes from Monday.com API
- **Token cleanup**: When expiration is detected, all tokens for the user are automatically deleted from the database
- **Re-authentication flow**: A specific `MONDAY_TOKEN_EXPIRED` error is thrown to trigger the re-auth flow

### 3. Frontend Integration

- **Automatic redirect**: When `MONDAY_TOKEN_EXPIRED` is detected, users are automatically redirected to `/api/auth/monday/login`
- **Seamless experience**: Users don't need to manually re-authenticate - the flow is transparent
- **Utility functions**: `fetchWithTokenExpirationHandling` provides consistent error handling across the frontend

## Implementation Details

### Backend Changes

1. **`getMondayToken` function** (`apps/kpis/src/lib/auth.ts`):
   - Now uses `ORDER BY updated_at DESC LIMIT 1` to get the most recent token
   - Added `deleteUserMondayTokens` function for cleanup

2. **`mondayRequest` function** (`apps/kpis/src/lib/auth.ts`):
   - Added `userId` parameter to track which user's token is being used
   - Detects 401/403 responses and deletes expired tokens
   - Throws `MONDAY_TOKEN_EXPIRED` error for frontend handling

3. **Auth callback** (`apps/kpis/src/app/api/auth/monday/callback/route.ts`):
   - Deletes all existing tokens before inserting new one
   - Ensures clean token state for each user

4. **API routes**:
   - All Monday API routes now handle `MONDAY_TOKEN_EXPIRED` errors
   - Return specific error responses that frontend can detect

### Frontend Changes

1. **`useMondayLinking` hook** (`apps/kpis/src/hooks/useMondayLinking.ts`):
   - Detects `MONDAY_TOKEN_EXPIRED` errors and redirects to login
   - Provides seamless token status checking

2. **`ProjectsDataService`** (`apps/kpis/src/lib/services/projectsDataService.ts`):
   - Uses `fetchWithTokenExpirationHandling` for automatic error handling
   - Redirects users when tokens expire during data fetching

3. **Token utilities** (`apps/kpis/src/lib/utils/mondayTokenUtils.ts`):
   - Provides consistent error handling across the application
   - Automatically redirects users when tokens expire

## Flow Diagram

```
User Action → Monday API Call → Token Valid? → Continue
                    ↓
              Token Expired (401/403)
                    ↓
            Delete all user tokens
                    ↓
            Throw MONDAY_TOKEN_EXPIRED
                    ↓
        Frontend catches error
                    ↓
        Redirect to /api/auth/monday/login
                    ↓
        User re-authenticates
                    ↓
        New token stored, old tokens cleaned up
                    ↓
        User continues with new token
```

## Benefits

1. **No database re-architecture**: Works with existing schema
2. **Automatic cleanup**: Prevents token accumulation
3. **Seamless UX**: Users don't need to manually re-authenticate
4. **Robust error handling**: Consistent across all Monday API calls
5. **Future-proof**: Handles multiple tokens gracefully

## Testing

To test the flow:

1. Connect a Monday account
2. Wait for token to expire (or manually delete from database)
3. Try to access Monday data
4. Verify automatic redirect to login
5. Re-authenticate and verify continued functionality

## Error Codes

- `MONDAY_TOKEN_EXPIRED`: Token has expired and been deleted, user needs to re-authenticate
- `No Monday.com token available`: User has never connected their Monday account
- Standard HTTP errors: Other API errors (network, server, etc.) 