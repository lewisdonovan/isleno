import Cookies from 'js-cookie';

export interface OAuthCallbackResult {
  success?: boolean;
  error?: string;
  errorType?: string;
  message?: string;
}

export class OAuthService {
  /**
   * Processes OAuth callback results from URL parameters
   */
  static processOAuthCallback(): OAuthCallbackResult | null {
    const urlParams = new URLSearchParams(window.location.search);
    const mondayLinked = urlParams.get('mondayLinked');
    const mondayError = urlParams.get('mondayError');
    const errorMessage = urlParams.get('message');

    if (mondayLinked === 'true') {
      return { success: true };
    } else if (mondayError) {
      return {
        success: false,
        error: mondayError,
        errorType: mondayError,
        message: errorMessage || mondayError
      };
    }

    return null;
  }

  /**
   * Cleans up OAuth callback parameters from URL
   */
  static cleanupUrl(): void {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  /**
   * Generates OAuth state and stores it in cookies
   */
  static generateOAuthState(): string {
    const state = crypto.randomUUID();
    Cookies.set('monday_oauth_state', state, { expires: 1 }); // Expires in 1 day
    return state;
  }

  /**
   * Builds Monday.com OAuth authorization URL
   */
  static buildMondayAuthUrl(clientId: string, redirectUri: string, state: string): string {
    return `https://auth.monday.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  /**
   * Checks if user has Monday.com token
   */
  static async checkMondayToken(): Promise<boolean> {
    try {
      const response = await fetch('/api/integrations/monday/me');
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Validates OAuth environment configuration
   */
  static validateOAuthConfig(): { valid: boolean; clientId?: string; redirectUri?: string } {
    const clientId = process.env.NEXT_PUBLIC_MONDAY_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_MONDAY_REDIRECT_URI;
    
    return {
      valid: !!(clientId && redirectUri),
      clientId,
      redirectUri
    };
  }

  /**
   * Initiates OAuth flow with proper state management
   */
  static initiateOAuthFlow(): void {
    const config = this.validateOAuthConfig();
    
    if (!config.valid) {
      throw new Error('OAuth configuration missing');
    }

    const state = this.generateOAuthState();
    const authUrl = this.buildMondayAuthUrl(config.clientId!, config.redirectUri!, state);
    window.location.href = authUrl;
  }
} 