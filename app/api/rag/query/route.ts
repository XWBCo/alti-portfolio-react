/**
 * API Route: Proxy RAG queries to Python backend.
 */

import { NextRequest, NextResponse } from "next/server";

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${RAG_SERVICE_URL}/api/v1/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `RAG service error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("RAG query failed:", error);
    return NextResponse.json(
      {
        error:
          "RAG service unavailable. Make sure the Python backend is running on port 8000.",
      },
      { status: 502 }
    );
  }
}
