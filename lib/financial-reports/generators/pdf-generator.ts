import { chromium, type Browser } from 'playwright';
import type {
  ClientReportData,
  AdvisorReportData,
  FirmReportData,
  ReportConfig,
  ThemeColors,
} from '../types';
import { generateClientPortfolioHTML } from '../templates/client-portfolio';

// ============================================================================
// PDF Generator for Financial Reports
// Uses Playwright for HTML-to-PDF conversion
// ============================================================================

// Singleton browser instance for performance
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// ============================================================================
// PDF Generation Options
// ============================================================================

export interface PDFOptions {
  format?: 'A4' | 'Letter';
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

const DEFAULT_PDF_OPTIONS: PDFOptions = {
  format: 'Letter',
  landscape: true,  // Industry standard: 11" x 8.5" landscape
  printBackground: true,
  margin: {
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
  },
};

// ============================================================================
// Report Generation Result
// ============================================================================

export interface GenerateReportResult {
  pdf: Buffer;
  html: string;
  generatedAt: string;
  pageCount: number;
  reportType: string;
}

// ============================================================================
// Generate Client Portfolio PDF
// ============================================================================

export async function generateClientReportPDF(
  data: ClientReportData,
  config?: Partial<ReportConfig>
): Promise<GenerateReportResult> {
  const startTime = Date.now();

  // Generate HTML
  console.log('[PDF] Generating client report HTML...');
  const html = generateClientPortfolioHTML(data, {
    sections: config?.sections,
    themeColors: config?.themeColors,
    firmName: config?.firmName,
    includeDisclaimer: config?.includeDisclaimer,
  });

  // Convert to PDF
  console.log('[PDF] Converting to PDF...');
  const pdfResult = await htmlToPDF(html, {
    format: config?.pageSize || 'Letter',
    landscape: config?.orientation === 'landscape',
  });

  const totalTime = Date.now() - startTime;
  console.log(`[PDF] Client report generated in ${totalTime}ms`);

  return {
    pdf: pdfResult.pdf,
    html,
    generatedAt: new Date().toISOString(),
    pageCount: pdfResult.pageCount,
    reportType: 'client-portfolio',
  };
}

// ============================================================================
// Generate Advisor Book PDF (stub for future implementation)
// ============================================================================

export async function generateAdvisorReportPDF(
  data: AdvisorReportData,
  config?: Partial<ReportConfig>
): Promise<GenerateReportResult> {
  // TODO: Implement advisor book template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Advisor Book Report</title>
      <style>
        body { font-family: Inter, sans-serif; padding: 48px; }
        h1 { color: #1F2937; }
        p { color: #6B7280; }
      </style>
    </head>
    <body>
      <h1>${data.advisorName} - Book Report</h1>
      <p>Total AUM: $${(data.totalAUM / 1e9).toFixed(2)}B</p>
      <p>Total Clients: ${data.totalClients}</p>
      <p>Report Date: ${data.reportDate}</p>
      <p style="margin-top: 24px; color: #9CA3AF;">Full advisor book template coming soon.</p>
    </body>
    </html>
  `;

  const pdfResult = await htmlToPDF(html, {
    format: config?.pageSize || 'Letter',
    landscape: config?.orientation === 'landscape',
  });

  return {
    pdf: pdfResult.pdf,
    html,
    generatedAt: new Date().toISOString(),
    pageCount: pdfResult.pageCount,
    reportType: 'advisor-book',
  };
}

// ============================================================================
// Generate Firm Analytics PDF (stub for future implementation)
// ============================================================================

export async function generateFirmReportPDF(
  data: FirmReportData,
  config?: Partial<ReportConfig>
): Promise<GenerateReportResult> {
  // TODO: Implement firm analytics template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Firm Analytics Report</title>
      <style>
        body { font-family: Inter, sans-serif; padding: 48px; }
        h1 { color: #1F2937; }
        p { color: #6B7280; }
      </style>
    </head>
    <body>
      <h1>${data.firmName} - Firm Analytics</h1>
      <p>Total AUM: $${(data.totalAUM / 1e9).toFixed(2)}B</p>
      <p>Total Clients: ${data.totalClients}</p>
      <p>Total Advisors: ${data.totalAdvisors}</p>
      <p>YTD Return: ${data.firmYTDReturn.toFixed(1)}%</p>
      <p>Report Date: ${data.reportDate}</p>
      <p style="margin-top: 24px; color: #9CA3AF;">Full firm analytics template coming soon.</p>
    </body>
    </html>
  `;

  const pdfResult = await htmlToPDF(html, {
    format: config?.pageSize || 'Letter',
    landscape: config?.orientation === 'landscape',
  });

  return {
    pdf: pdfResult.pdf,
    html,
    generatedAt: new Date().toISOString(),
    pageCount: pdfResult.pageCount,
    reportType: 'firm-analytics',
  };
}

// ============================================================================
// Core HTML to PDF Conversion
// ============================================================================

interface PDFConversionResult {
  pdf: Buffer;
  pageCount: number;
}

async function htmlToPDF(
  html: string,
  options: PDFOptions = {}
): Promise<PDFConversionResult> {
  const mergedOptions = { ...DEFAULT_PDF_OPTIONS, ...options };

  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Set content and wait for everything to load
    await page.setContent(html, {
      waitUntil: 'networkidle',
    });

    // Brief wait for SVG rendering
    await page.waitForTimeout(100);

    // Generate PDF
    const pdf = await page.pdf({
      format: mergedOptions.format,
      landscape: mergedOptions.landscape,
      printBackground: mergedOptions.printBackground,
      margin: mergedOptions.margin,
    });

    // Estimate page count (rough calculation based on content height)
    const pageCount = await page.evaluate(() => {
      const pages = document.querySelectorAll('.page');
      return pages.length || 1;
    });

    return { pdf, pageCount };
  } finally {
    await context.close();
  }
}

// ============================================================================
// Preview HTML Generation (no PDF conversion)
// ============================================================================

export function generateClientPreviewHTML(
  data: ClientReportData,
  config?: Partial<ReportConfig>
): string {
  return generateClientPortfolioHTML(data, {
    sections: config?.sections,
    themeColors: config?.themeColors,
    firmName: config?.firmName,
    includeDisclaimer: config?.includeDisclaimer,
  });
}

// ============================================================================
// Unified Report Generator
// ============================================================================

export type ReportData = ClientReportData | AdvisorReportData | FirmReportData;

export async function generateReport(
  reportType: 'client-portfolio' | 'advisor-book' | 'firm-analytics',
  data: ReportData,
  config?: Partial<ReportConfig>
): Promise<GenerateReportResult> {
  switch (reportType) {
    case 'client-portfolio':
      return generateClientReportPDF(data as ClientReportData, config);
    case 'advisor-book':
      return generateAdvisorReportPDF(data as AdvisorReportData, config);
    case 'firm-analytics':
      return generateFirmReportPDF(data as FirmReportData, config);
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

// ============================================================================
// Cleanup on process exit
// ============================================================================

if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await closeBrowser();
  });

  process.on('SIGINT', async () => {
    await closeBrowser();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closeBrowser();
    process.exit(0);
  });
}
