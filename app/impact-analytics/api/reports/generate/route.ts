import { NextRequest, NextResponse } from 'next/server';
import {
  generatePDFReport,
  generatePreviewHTML,
  validateReportData,
  SAMPLE_REPORT_DATA,
} from '@/lib/reports';

// ============================================================================
// POST /api/reports/generate
// Generate ESG impact report as PDF or HTML preview
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const reportData = validateReportData(body);

    // Check output format
    const format = request.nextUrl.searchParams.get('format') || 'pdf';

    if (format === 'html') {
      // Return HTML preview
      const html = await generatePreviewHTML(reportData);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // Generate PDF
    const result = await generatePDFReport(reportData);

    // Return PDF file
    const filename = `esg-report-${reportData.client_name.replace(/\s+/g, '-').toLowerCase()}-${result.generatedAt.split('T')[0]}.pdf`;

    // Convert Buffer to Uint8Array for Next.js 16 compatibility
    const pdfBytes = new Uint8Array(result.pdf);

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Generated-At': result.generatedAt,
        'X-Page-Count': result.pageCount.toString(),
      },
    });
  } catch (error) {
    console.error('[API] Report generation error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid report data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/reports/generate
// Generate sample report for testing
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get('format') || 'pdf';

    if (format === 'html') {
      // Return HTML preview
      const html = await generatePreviewHTML(SAMPLE_REPORT_DATA);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // Generate PDF with sample data
    const result = await generatePDFReport(SAMPLE_REPORT_DATA);

    const filename = `esg-report-sample-${result.generatedAt.split('T')[0]}.pdf`;

    // Convert Buffer to Uint8Array for Next.js 16 compatibility
    const pdfBytes = new Uint8Array(result.pdf);

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Generated-At': result.generatedAt,
        'X-Page-Count': result.pageCount.toString(),
      },
    });
  } catch (error) {
    console.error('[API] Sample report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sample report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
