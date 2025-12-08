// Authentication types for AlTi Portfolio

export type UserRole = 'user' | 'admin' | 'developer';

export interface User {
  email: string;
  name: string;
  roles: UserRole[];
  authMethod: 'saml' | 'password' | 'dev-bypass' | 'guest';
  authenticatedAt: string;
  isGuest?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  isGuest?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Session stored in httpOnly cookie
export interface SessionData {
  user: User;
  expiresAt: number; // Unix timestamp
}
