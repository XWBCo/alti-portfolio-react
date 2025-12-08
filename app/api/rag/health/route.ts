import { NextResponse } from "next/server";

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${RAG_SERVICE_URL}/api/v1/health`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "RAG service unhealthy" },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "RAG service not available" },
      { status: 503 }
    );
  }
}
