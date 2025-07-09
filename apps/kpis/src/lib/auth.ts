import { NextRequest } from 'next/server';
import { UserSession } from '@/types/auth';

export interface AuthResult {
  success: boolean;
  session?: UserSession;
  error?: string;
  status?: number;
}

/**
 * Validates the session from cookies and returns the session data
 * @param request - The NextRequest object
 * @returns AuthResult with session data or error information
 */
export function validateSession(request: NextRequest): AuthResult {
  try {
    // Get session from cookies
    const sessionCookie = request.cookies.get('monday_session');
    if (!sessionCookie) {
      return {
        success: false,
        error: 'Unauthorized - No session found',
        status: 401
      };
    }

    const session: UserSession = JSON.parse(sessionCookie.value);
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      return {
        success: false,
        error: 'Session expired',
        status: 401
      };
    }

    return {
      success: true,
      session
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
 * Creates a Monday.com API request with the user's session token
 * @param session - The user session containing the access token
 * @param query - The GraphQL query to execute
 * @returns Promise with the API response
 */
/**
 * Executes a GraphQL request against Monday.com API.
 */
export async function mondayRequest<TData, TVariables = Record<string, unknown>>(
    session: UserSession,
    query: string,
    variables?: TVariables
): Promise<TData> {
  const body = variables ? { query, variables } : { query }

  const mondayToken = session?.accessToken || process.env.MONDAY_TOKEN;

  if (!mondayToken) {
    throw new Error(
        'There is no Monday.com token available. Please check your environment variables or session.'
    );
  }

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: mondayToken,
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
    throw new Error(
        `Monday API error: ${response.status} ${response.statusText} - Body: ${await response.text()}`
    )
  }

  const payload = await response.json()
  if (payload.errors) {
    throw new Error(JSON.stringify(payload.errors))
  }

  return payload.data
}
