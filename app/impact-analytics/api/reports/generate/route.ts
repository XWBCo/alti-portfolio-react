import { NextRequest, NextResponse } from 'next/server';
import {
  generatePDFReport,
  generatePreviewHTML,
  validateReportData,
  SAMPLE_REPORT_DATA,
  generateImpactComparisonPDF,
  generateImpactComparisonPreview,
  validateImpactComparisonData,
} from '@/lib/reports';

// ============================================================================
// POST /api/reports/generate
// Generate ESG impact report or impact comparison report as PDF or HTML preview
// Query params:
//   - type: 'esg' (default) | 'impact-comparison'
//   - format: 'pdf' (default) | 'html'
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check report type
    const type = request.nextUrl.searchParams.get('type') || 'esg';
    const format = request.nextUrl.searchParams.get('format') || 'pdf';

    // Handle impact comparison report
    if (type === 'impact-comparison') {
      // Validate impact comparison data
      const comparisonData = validateImpactComparisonData(body);

      if (format === 'html') {
        // Return HTML preview
        const html = await generateImpactComparisonPreview(comparisonData);
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      }

      // Generate PDF
      const result = await generateImpactComparisonPDF(comparisonData);

      // Return PDF file
      const filename = `impact-comparison-${comparisonData.clientName.replace(/\s+/g, '-').toLowerCase()}-${result.generatedAt.split('T')[0]}.pdf`;

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
    }

    // Handle standard ESG report (backward compatibility)
    // Validate request data
    const reportData = validateReportData(body);

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
// Query params:
//   - type: 'esg' (default) | 'impact-comparison'
//   - format: 'pdf' (default) | 'html'
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') || 'esg';
    const format = request.nextUrl.searchParams.get('format') || 'pdf';

    // Handle impact comparison sample
    if (type === 'impact-comparison') {
      // Import sample data dynamically to avoid circular dependencies
      const { SAMPLE_IMPACT_COMPARISON_DATA } = await import('@/lib/reports');

      if (format === 'html') {
        const html = await generateImpactComparisonPreview(SAMPLE_IMPACT_COMPARISON_DATA);
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      }

      const result = await generateImpactComparisonPDF(SAMPLE_IMPACT_COMPARISON_DATA);
      const filename = `impact-comparison-sample-${result.generatedAt.split('T')[0]}.pdf`;
      const pdfBytes = new Uint8Array(result.pdf);

      return new NextResponse(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Generated-At': result.generatedAt,
          'X-Page-Count': result.pageCount.toString(),
        },
      });
    }

    // Handle standard ESG sample (backward compatibility)
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
