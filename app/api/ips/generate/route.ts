/**
 * IPS Document Generation API Endpoint
 * Generates Investment Policy Statement Word documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { Packer } from 'docx';
import { mapSurveyToIPS, generateIPSDocument } from '@/lib/ips';
import { MOCK_CLIENTS } from '@/lib/client-assessment-mock-data';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId parameter' },
        { status: 400 }
      );
    }

    // Find client data
    const client = MOCK_CLIENTS.find((c) => c.id === clientId);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Map survey data to IPS fields
    const ipsFields = mapSurveyToIPS(client);

    // Generate document
    const doc = generateIPSDocument(ipsFields);

    // Convert to buffer
    const buffer = await Packer.toBuffer(doc);

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const clientNameSafe = client.clientInfo.client.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `IPS_${clientNameSafe}_${timestamp}.docx`;

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(buffer);

    // Return document as download
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': uint8Array.length.toString(),
      },
    });
  } catch (error) {
    console.error('IPS generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate IPS document' },
      { status: 500 }
    );
  }
}

// Also support GET for simpler testing
export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing clientId parameter' },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const fakeRequest = {
    json: async () => ({ clientId }),
  } as NextRequest;

  return POST(fakeRequest);
}
