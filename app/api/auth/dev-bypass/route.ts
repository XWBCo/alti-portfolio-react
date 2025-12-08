// POST /api/auth/dev-bypass - Instant login for development

import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, IronSessionData } from '@/lib/auth/session';
import { DEV_BYPASS_USER, isDev } from '@/lib/auth/config';
import { AuthResponse } from '@/lib/auth/types';

export async function POST(): Promise<NextResponse<AuthResponse>> {
  // Dev bypass enabled for testing (remove isDev check for production testing)
  try {
    const user = {
      ...DEV_BYPASS_USER,
      authenticatedAt: new Date().toISOString(),
    };

    // Set session
    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
    session.user = user;
    session.expiresAt = Date.now() + (sessionOptions.cookieOptions?.maxAge || 86400) * 1000;
    await session.save();

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Dev bypass error:', error);
    return NextResponse.json(
      { success: false, error: 'Dev bypass failed' },
      { status: 500 }
    );
  }
}
