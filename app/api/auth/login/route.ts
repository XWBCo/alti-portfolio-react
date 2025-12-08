// POST /api/auth/login - Email/password authentication

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, IronSessionData } from '@/lib/auth/session';
import { USER_CREDENTIALS, getRolesForEmail } from '@/lib/auth/config';
import { User, AuthResponse } from '@/lib/auth/types';

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const body = await request.json();
    const { email, password, isGuest } = body;

    // Handle guest login
    if (isGuest) {
      const user: User = {
        email: 'guest@alti-global.com',
        name: 'Guest',
        roles: ['user'],
        authMethod: 'guest',
        authenticatedAt: new Date().toISOString(),
        isGuest: true,
      };

      const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
      session.user = user;
      session.expiresAt = Date.now() + (sessionOptions.cookieOptions?.maxAge || 1800) * 1000;
      await session.save();

      return NextResponse.json({ success: true, user });
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const storedPassword = USER_CREDENTIALS[normalizedEmail];

    if (!storedPassword || storedPassword !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create user object
    const user: User = {
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      roles: getRolesForEmail(normalizedEmail),
      authMethod: 'password',
      authenticatedAt: new Date().toISOString(),
    };

    // Set session
    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
    session.user = user;
    session.expiresAt = Date.now() + (sessionOptions.cookieOptions?.maxAge || 1800) * 1000;
    await session.save();

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
