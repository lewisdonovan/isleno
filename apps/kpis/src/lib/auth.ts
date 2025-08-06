import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@isleno/types/db/public';

// Types
export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
  status?: number;
}

/**
 * Validates the Supabase session from cookies and returns the user data
 * @param request - The NextRequest object
 * @returns AuthResult with user data or error information
 */
export async function validateSupabaseSession(request: NextRequest): Promise<AuthResult> {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Supabase auth error:', error);
      return {
        success: false,
        error: 'Authentication error',
        status: 401
      };
    }

    if (!session) {
      return {
        success: false,
        error: 'No active session',
        status: 401
      };
    }

    return {
      success: true,
      user: session.user
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return {
      success: false,
      error: 'Invalid session',
      status: 401
    };
  }
}

/**
 * Gets a Monday.com token for a user
 * Returns either a user-specific token or falls back to system token
 */
export async function getMondayToken(userId?: string): Promise<string | null> {
  if (userId) {
    try {
      const { supabaseServer } = await import('@isleno/supabase/server');
      const { decrypt } = await import('@/lib/encryption');
      
      const supabase = await supabaseServer();
      const { data: tokenData } = await supabase
        .from('user_monday_tokens')
        .select('monday_access_token')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (tokenData?.monday_access_token) {
        return decrypt(tokenData.monday_access_token);
      }
    } catch (error) {
      console.warn('Could not fetch user Monday token:', error);
    }
  }

  // Fall back to system token from environment
  return process.env.MONDAY_TOKEN || null;
}

/**
 * Deletes all Monday tokens for a user
 * Used when tokens are expired or unauthorized
 */
export async function deleteUserMondayTokens(userId: string): Promise<void> {
  try {
    const { supabaseServer } = await import('@isleno/supabase/server');
    const supabase = await supabaseServer();
    
    const { error } = await supabase
      .from('user_monday_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting user Monday tokens:', error);
      throw error;
    }

    console.log('Deleted all Monday tokens for user:', userId);
  } catch (error) {
    console.error('Failed to delete user Monday tokens:', error);
    throw error;
  }
}

/**
 * Executes a GraphQL request against Monday.com API.
 */
export async function mondayRequest<TData, TVariables = Record<string, unknown>>(
    token: string,
    query: string,
    variables?: TVariables,
    userId?: string
): Promise<TData> {
  const body = variables ? { query, variables } : { query }

  if (!token) {
    throw new Error(
        'No Monday.com token available. Please check your environment variables or user setup.'
    );
  }

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'API-Version': '2024-01',
    },
    body: JSON.stringify(body),
  });

  if (process.env.DEBUG_MONDAY === 'true') {
    console.log('Request', JSON.stringify(body, null, 2))
    console.log('Status', response.status)
    console.log('Raw   ', await response.clone().text())
  }

  if (!response.ok) {
    // Handle token expiration/unauthorized errors
    if ((response.status === 401 || response.status === 403) && userId) {
      console.warn(`Monday token expired for user ${userId}, deleting tokens and triggering re-auth`);
      
      try {
        await deleteUserMondayTokens(userId);
      } catch (deleteError) {
        console.error('Failed to delete expired tokens:', deleteError);
      }
      
      throw new Error('MONDAY_TOKEN_EXPIRED');
    }
    
    throw new Error(
        `Monday API error: ${response.status} ${response.statusText} - Body: ${await response.text()}`
    )
  }

  const payload = await response.json()
  if (payload.errors) {
    console.log(JSON.stringify(payload, null, 2))
    throw new Error(JSON.stringify(payload.errors))
  }

  return payload.data
}

/**
 * Validates the x-api-key header against the ISLENO_API_KEY environment variable
 * @param request - The NextRequest object
 * @returns AuthResult with success or error information
 */
export function validateApiKey(request: NextRequest): { success: boolean; error?: string; status?: number } {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.ISLENO_API_KEY;

  if (!expectedKey) {
    return {
      success: false,
      error: 'Server misconfiguration: ISLENO_API_KEY not set',
      status: 500,
    };
  }

  if (!apiKey) {
    return {
      success: false,
      error: 'Missing x-api-key header',
      status: 401,
    };
  }

  if (apiKey !== expectedKey) {
    return {
      success: false,
      error: 'Invalid API key',
      status: 403,
    };
  }

  return { success: true };
}

// Legacy function kept for compatibility - deprecated
export async function validateSession(request: NextRequest) {
  console.warn('validateSession is deprecated. Use validateSupabaseSession instead.');
  return await validateSupabaseSession(request);
}
