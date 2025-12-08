import { NextRequest, NextResponse } from 'next/server';
import {
  GenerateReportRequestSchema,
  ClientReportDataSchema,
  AdvisorReportDataSchema,
  FirmReportDataSchema,
  generateClientReportPDF,
  generateAdvisorReportPDF,
  generateFirmReportPDF,
  generateClientPreviewHTML,
  generateAdvisorBookHTML,
  generateFirmAnalyticsHTML,
  generateClientReportData,
  generateAdvisorReportData,
  generateFirmReportData,
  generateClientReportExcel,
  generateAdvisorReportExcel,
  generateFirmReportExcel,
  generateClientReportCombinedCSV,
  generateAdvisorReportCSV,
  generateFirmReportCSV,
  type ClientReportData,
  type AdvisorReportData,
  type FirmReportData,
} from '@/lib/financial-reports';

// ============================================================================
// POST /api/financial-reports/generate
// Generate a financial report in PDF, HTML, Excel, or CSV format
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const parseResult = GenerateReportRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { config, data } = parseResult.data;
    const { reportType, format } = config;

    // Route to appropriate generator based on report type
    let result;

    switch (reportType) {
      case 'client-portfolio': {
        const clientData = ClientReportDataSchema.parse(data);

        if (format === 'html') {
          const html = generateClientPreviewHTML(clientData, config);
          return new NextResponse(html, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'X-Report-Type': 'client-portfolio',
              'X-Generated-At': new Date().toISOString(),
            },
          });
        }

        if (format === 'pdf') {
          result = await generateClientReportPDF(clientData, config);
          return new NextResponse(new Uint8Array(result.pdf), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${sanitizeFilename(clientData.client.name)}-portfolio-report.pdf"`,
              'X-Report-Type': 'client-portfolio',
              'X-Generated-At': result.generatedAt,
              'X-Page-Count': String(result.pageCount),
            },
          });
        }

        // TODO: Implement Excel and CSV formats
        if (format === 'excel' || format === 'csv') {
          return NextResponse.json(
            { success: false, error: `${format.toUpperCase()} export coming soon` },
            { status: 501 }
          );
        }
        break;
      }

      case 'advisor-book': {
        const advisorData = AdvisorReportDataSchema.parse(data);

        if (format === 'pdf') {
          result = await generateAdvisorReportPDF(advisorData, config);
          return new NextResponse(new Uint8Array(result.pdf), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${sanitizeFilename(advisorData.advisorName)}-book-report.pdf"`,
              'X-Report-Type': 'advisor-book',
              'X-Generated-At': result.generatedAt,
              'X-Page-Count': String(result.pageCount),
            },
          });
        }
        break;
      }

      case 'firm-analytics': {
        const firmData = FirmReportDataSchema.parse(data);

        if (format === 'pdf') {
          result = await generateFirmReportPDF(firmData, config);
          return new NextResponse(new Uint8Array(result.pdf), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${sanitizeFilename(firmData.firmName)}-analytics-report.pdf"`,
              'X-Report-Type': 'firm-analytics',
              'X-Generated-At': result.generatedAt,
              'X-Page-Count': String(result.pageCount),
            },
          });
        }
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown report type: ${reportType}` },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported format for this report type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] Report generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/financial-reports/generate
// Get sample data or HTML preview with mock data
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'client';
  const format = searchParams.get('format') || 'json';
  const clientIndex = parseInt(searchParams.get('clientIndex') || '0', 10);
  const advisorIndex = parseInt(searchParams.get('advisorIndex') || '0', 10);

  // Phase 2 parameters - Fixed branding (no user customization)
  const sectionsParam = searchParams.get('sections');

  // Parse sections config
  let sections;
  if (sectionsParam) {
    try {
      sections = JSON.parse(sectionsParam);
    } catch {
      sections = undefined;
    }
  }

  // Build config object with fixed AlTi branding
  const config = {
    sections: sections ? {
      coverPage: true,
      summary: sections.summary ?? true,
      performance: sections.performance ?? true,
      allocation: sections.allocation ?? true,
      holdings: sections.holdings ?? true,
      accounts: sections.accounts ?? true,
      benchmark: sections.benchmark ?? true,
      projections: false,
      taxAnalysis: false,
    } : undefined,
  };

  try {
    let data;
    let html;

    switch (type) {
      case 'client':
        data = generateClientReportData(clientIndex, {
          holdingsCount: 25,
          months: 12,
        });

        if (format === 'html') {
          html = generateClientPreviewHTML(data as ClientReportData, config);
          return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }

        if (format === 'pdf') {
          const result = await generateClientReportPDF(data as ClientReportData, config);
          return new NextResponse(new Uint8Array(result.pdf), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment; filename="sample-client-report.pdf"',
            },
          });
        }

        if (format === 'excel') {
          const excel = generateClientReportExcel(data as ClientReportData);
          return new NextResponse(Buffer.from(excel), {
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': 'attachment; filename="client-portfolio-report.xlsx"',
            },
          });
        }

        if (format === 'csv') {
          const csv = generateClientReportCombinedCSV(data as ClientReportData);
          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': 'attachment; filename="client-portfolio-report.csv"',
            },
          });
        }
        break;

      case 'advisor':
        data = generateAdvisorReportData(advisorIndex);

        if (format === 'html') {
          html = generateAdvisorBookHTML(data as AdvisorReportData);
          return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }

        if (format === 'pdf') {
          const result = await generateAdvisorReportPDF(data as AdvisorReportData, {});
          return new NextResponse(new Uint8Array(result.pdf), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment; filename="sample-advisor-report.pdf"',
            },
          });
        }

        if (format === 'excel') {
          const excel = generateAdvisorReportExcel(data as AdvisorReportData);
          return new NextResponse(Buffer.from(excel), {
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': 'attachment; filename="advisor-book-report.xlsx"',
            },
          });
        }

        if (format === 'csv') {
          const csv = generateAdvisorReportCSV(data as AdvisorReportData);
          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': 'attachment; filename="advisor-book-report.csv"',
            },
          });
        }
        break;

      case 'firm':
        data = generateFirmReportData();

        if (format === 'html') {
          html = generateFirmAnalyticsHTML(data as FirmReportData);
          return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }

        if (format === 'pdf') {
          const result = await generateFirmReportPDF(data as FirmReportData, {});
          return new NextResponse(new Uint8Array(result.pdf), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment; filename="sample-firm-report.pdf"',
            },
          });
        }

        if (format === 'excel') {
          const excel = generateFirmReportExcel(data as FirmReportData);
          return new NextResponse(Buffer.from(excel), {
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': 'attachment; filename="firm-analytics-report.xlsx"',
            },
          });
        }

        if (format === 'csv') {
          const csv = generateFirmReportCSV(data as FirmReportData);
          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': 'attachment; filename="firm-analytics-report.csv"',
            },
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}. Use 'client', 'advisor', or 'firm'.` },
          { status: 400 }
        );
    }

    // Return JSON by default
    return NextResponse.json({
      success: true,
      type,
      data,
      usage: {
        endpoints: {
          'GET ?type=client&format=json': 'Get sample client report data as JSON',
          'GET ?type=client&format=html': 'Get sample client report as HTML preview',
          'GET ?type=client&format=pdf': 'Get sample client report as PDF',
          'GET ?type=advisor': 'Get sample advisor book data',
          'GET ?type=firm': 'Get sample firm analytics data',
          'POST': 'Generate report with custom data (see request schema)',
        },
      },
    });
  } catch (error) {
    console.error('[API] Mock data generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate mock data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50);
}

