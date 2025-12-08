// POST /api/auth/logout - Clear session

import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, IronSessionData } from '@/lib/auth/session';

export async function POST(): Promise<NextResponse> {
  try {
    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
    session.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
