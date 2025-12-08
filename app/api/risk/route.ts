/**
 * Risk API Proxy Route
 * Forwards requests to Python FastAPI service
 */

import { NextRequest, NextResponse } from 'next/server';

const RISK_API_URL = process.env.RISK_API_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, ...data } = body;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    const response = await fetch(`${RISK_API_URL}/api/risk/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `API error: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Risk API proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to risk service' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get available assets
    const response = await fetch(`${RISK_API_URL}/assets`);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to get assets' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('Risk API proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to risk service' },
      { status: 500 }
    );
  }
}
