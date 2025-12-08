// GET /api/auth/session - Get current session

import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, IronSessionData } from '@/lib/auth/session';
import { AuthState } from '@/lib/auth/types';

export async function GET(): Promise<NextResponse<AuthState>> {
  try {
    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);

    if (!session.user || !session.expiresAt || session.expiresAt < Date.now()) {
      return NextResponse.json({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }

    return NextResponse.json({
      user: session.user,
      isAuthenticated: true,
      isLoading: false,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }
}
