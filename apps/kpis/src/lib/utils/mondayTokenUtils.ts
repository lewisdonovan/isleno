/**
 * Utility functions for handling Monday token expiration
 */

/**
 * Checks if an error response indicates a Monday token expiration
 */
export function isMondayTokenExpiredError(response: Response): boolean {
  return response.status === 401;
}

/**
 * Handles Monday token expiration by redirecting to the login flow
 */
export function handleMondayTokenExpiration(): void {
  console.log('Monday token expired, redirecting to login');
  window.location.href = '/api/auth/monday/login';
}

/**
 * Wraps a fetch call to handle Monday token expiration automatically
 */
export async function fetchWithTokenExpirationHandling(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include'
  });

  if (isMondayTokenExpiredError(response)) {
    try {
      const errorData = await response.json();
      if (errorData.error === 'MONDAY_TOKEN_EXPIRED') {
        handleMondayTokenExpiration();
        throw new Error('MONDAY_TOKEN_EXPIRED');
      }
    } catch (parseError) {
      // If we can't parse the error, assume it's a token expiration
      handleMondayTokenExpiration();
      throw new Error('MONDAY_TOKEN_EXPIRED');
    }
  }

  return response;
} 