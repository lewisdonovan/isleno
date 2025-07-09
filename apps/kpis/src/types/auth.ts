// OAuth configuration
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// OAuth state for security
export interface OAuthState {
  state: string;
  timestamp: number;
}

// OAuth token response
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

// User session data
export interface UserSession {
  accessToken: string;
  userId: string;
  accountId: string;
  expiresAt: number;
}

// Monday.com user data
export interface MondayUser {
  id: string;
  name: string;
  email: string;
  photo_thumb?: string;
  photo_thumb_small?: string;
  photo_original?: string;
  is_guest?: boolean;
  enabled?: boolean;
} 