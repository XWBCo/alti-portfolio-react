/**
 * Optimization API Proxy Route
 * Forwards requests to Python FastAPI optimization service
 */

import { NextRequest, NextResponse } from 'next/server';

const RISK_API_URL = process.env.RISK_API_URL || 'http://localhost:8001';

// Map frontend caps_template values to Python API values
const CAPS_TEMPLATE_MAP: Record<string, string> = {
  'standard': 'std',
  'tight': 'tight',
  'loose': 'loose',
};

// Helper to unwrap API response data
function unwrapResponse(result: { success?: boolean; data?: unknown }) {
  if (result.success && result.data) {
    return result.data;
  }
  return result;
}

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

    // Transform caps_template from frontend format to API format
    if (data.caps_template && CAPS_TEMPLATE_MAP[data.caps_template]) {
      data.caps_template = CAPS_TEMPLATE_MAP[data.caps_template];
    }

    const response = await fetch(`${RISK_API_URL}/api/optimization/${endpoint}`, {
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
    return NextResponse.json(unwrapResponse(result));

  } catch (error) {
    console.error('Optimization API proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to optimization service' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get available assets for optimization
    const response = await fetch(`${RISK_API_URL}/api/optimization/assets`);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to get optimization assets' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(unwrapResponse(result));

  } catch (error) {
    console.error('Optimization API proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to optimization service' },
      { status: 500 }
    );
  }
}
