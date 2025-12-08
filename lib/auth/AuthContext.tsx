'use client';

// Auth context provider for React components

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, AuthResponse } from './types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  devBypass: () => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check session on mount
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data: AuthState = await res.json();
      setState({ ...data, isLoading: false });
    } catch {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Email/password login
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data: AuthResponse = await res.json();

      if (data.success && data.user) {
        setState({ user: data.user, isAuthenticated: true, isLoading: false });
      } else {
        setState(s => ({ ...s, isLoading: false }));
      }
      return data;
    } catch (error) {
      setState(s => ({ ...s, isLoading: false }));
      return { success: false, error: 'Login failed' };
    }
  };

  // Dev bypass - instant login
  const devBypass = async (): Promise<AuthResponse> => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const res = await fetch('/api/auth/dev-bypass', { method: 'POST' });
      const data: AuthResponse = await res.json();

      if (data.success && data.user) {
        setState({ user: data.user, isAuthenticated: true, isLoading: false });
      } else {
        setState(s => ({ ...s, isLoading: false }));
      }
      return data;
    } catch (error) {
      setState(s => ({ ...s, isLoading: false }));
      return { success: false, error: 'Dev bypass failed' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, devBypass, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Hook to check if user has a specific role
export function useHasRole(role: User['roles'][number]): boolean {
  const { user } = useAuth();
  return user?.roles.includes(role) ?? false;
}
