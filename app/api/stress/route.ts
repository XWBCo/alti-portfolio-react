/**
 * Stress Testing API Route
 * Proxy to Python FastAPI stress testing endpoints
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint") || "scenarios";

  try {
    const response = await fetch(`${API_BASE_URL}/api/stress/${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "API request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Stress API error:", error);
    return NextResponse.json(
      { error: "Failed to connect to stress testing API" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint") || "apply";

  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/stress/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "API request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Stress API error:", error);
    return NextResponse.json(
      { error: "Failed to connect to stress testing API" },
      { status: 500 }
    );
  }
}
