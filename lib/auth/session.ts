// Session management using iron-session

import { SessionOptions } from 'iron-session';
import { User } from './types';
import { SESSION_CONFIG, isDev } from './config';

// Session data structure
export interface IronSessionData {
  user?: User;
  expiresAt?: number;
}

// Iron session options
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_dev',
  cookieName: SESSION_CONFIG.cookieName,
  cookieOptions: {
    secure: !isDev, // HTTPS only in production
    httpOnly: true, // Prevent XSS
    sameSite: 'lax', // CSRF protection
    maxAge: isDev ? SESSION_CONFIG.devMaxAge : SESSION_CONFIG.maxAge,
  },
};

// Type declaration for iron-session
declare module 'iron-session' {
  interface IronSessionData {
    user?: User;
    expiresAt?: number;
  }
}
