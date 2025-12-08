import { NextRequest, NextResponse } from 'next/server';

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

// Use v2 (LangGraph) endpoint if available, fallback to v1
const USE_V2_ENDPOINT = process.env.USE_LANGGRAPH !== 'false';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Determine which endpoint to use
    const endpoint = USE_V2_ENDPOINT ? '/api/v1/v2/query' : '/api/v1/query';

    // Build request based on endpoint version
    const requestBody = USE_V2_ENDPOINT
      ? {
          query: body.query,
          thread_id: body.thread_id,
          archetype: body.archetype,
          region: body.region || 'US',
        }
      : {
          query: body.query,
          mode: body.mode || 'compact',
          top_k: body.top_k || 5,
          min_similarity: body.min_similarity || 0.3,
        };

    const response = await fetch(`${RAG_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // If v2 fails, try v1 as fallback
      if (USE_V2_ENDPOINT) {
        console.warn('V2 endpoint failed, falling back to v1');
        const fallbackResponse = await fetch(`${RAG_SERVICE_URL}/api/v1/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: body.query,
            mode: body.mode || 'compact',
            top_k: body.top_k || 5,
            min_similarity: body.min_similarity || 0.3,
          }),
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          return NextResponse.json(data);
        }
      }

      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to get response from RAG service', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
