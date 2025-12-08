// Authentication configuration

import { User, UserRole } from './types';

// Environment detection
export const isDev = process.env.NODE_ENV === 'development';

// Developer emails - get Analytics Dashboard access
export const DEVELOPER_EMAILS = new Set([
  'xavier.court@alti-global.com',
  'joao.abrantes@alti-global.com',
  'alex.hokanson@alti-global.com',
  'user@alti-global.com',
  'dev@localhost', // Dev bypass user
]);

// Admin email - full Qualtrics survey access
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase() || 'admin@alti-global.com';

// Credentials for email/password login (production uses env vars)
export const USER_CREDENTIALS: Record<string, string> = {
  'user@alti-global.com': process.env.USER_PASSWORD || 'AnotherStrong_Password456!',
  'admin@alti-global.com': process.env.ADMIN_PASSWORD || 'AdminPassword123!',
  // Dev bypass - any password works in dev mode
  'dev@localhost': 'dev',
};

// Session config
export const SESSION_CONFIG = {
  cookieName: 'alti-session',
  maxAge: 30 * 60, // 30 minutes (SEC Regulation S-P)
  // In dev mode, extend to 24 hours for convenience
  devMaxAge: 24 * 60 * 60,
};

// Dev bypass user - instant login during development
export const DEV_BYPASS_USER: User = {
  email: 'dev@localhost',
  name: 'Developer',
  roles: ['developer', 'admin'], // Full access in dev
  authMethod: 'dev-bypass',
  authenticatedAt: new Date().toISOString(),
};

// Determine roles based on email
export function getRolesForEmail(email: string): UserRole[] {
  const normalizedEmail = email.toLowerCase();
  const roles: UserRole[] = ['user'];

  if (DEVELOPER_EMAILS.has(normalizedEmail)) {
    roles.push('developer');
  }

  if (normalizedEmail === ADMIN_EMAIL) {
    roles.push('admin');
  }

  return roles;
}

// Check if user has required role
export function hasRole(user: User | null, role: UserRole): boolean {
  return user?.roles.includes(role) ?? false;
}

// Check if user can access a route
export function canAccessRoute(user: User | null, pathname: string): boolean {
  if (!user) return false;

  // Analytics requires developer role
  if (pathname.startsWith('/analytics')) {
    return hasRole(user, 'developer');
  }

  // All other routes accessible to authenticated users
  return true;
}

// SAML configuration (for production)
export const SAML_CONFIG = {
  entryPoint: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/saml2`,
  issuer: process.env.SAML_ISSUER || 'https://plotly.alti-global.com/saml/metadata',
  callbackUrl: process.env.SAML_CALLBACK_URL || '/api/auth/saml/callback',
  cert: process.env.AZURE_SAML_CERT || '',
};
