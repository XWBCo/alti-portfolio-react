import { chromium, type Browser } from 'playwright';
import { generateAllChartsSVG, type ReportCharts } from './svg-charts';
import { generateReportHTML } from './template';
import type { ReportData, ThemeColors } from './types';

// ============================================================================
// PDF Generator using Playwright
// Converts HTML report to PDF with proper A4 landscape formatting
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
  format: 'A4',
  landscape: true,
  printBackground: true,
  margin: {
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
  },
};

// ============================================================================
// Main PDF Generation Function
// ============================================================================

export interface GenerateReportResult {
  pdf: Buffer;
  html: string;
  generatedAt: string;
  pageCount: number;
}

export async function generatePDFReport(
  data: ReportData,
  options: PDFOptions = {}
): Promise<GenerateReportResult> {
  const startTime = Date.now();

  // Merge theme colors with defaults
  const colors: ThemeColors = {
    strongColor: '#A638B5',
    onTrackColor: '#0A598C',
    focusColor: '#DBCB23',
    portfolioColor: '#00E7D7',
    benchmarkColor: '#0F94A6',
    ...data.theme_colors,
  };

  // Step 1: Generate all charts using SVG (synchronous, no native modules)
  console.log('[PDF] Generating SVG charts...');
  const chartStartTime = Date.now();
  const charts = generateAllChartsSVG(data.metrics, data.benchmark, colors);
  console.log(`[PDF] Charts generated in ${Date.now() - chartStartTime}ms`);

  // Step 2: Generate HTML from template
  console.log('[PDF] Generating HTML template...');
  const html = generateReportHTML(data, charts);

  // Step 3: Convert HTML to PDF using Playwright
  console.log('[PDF] Converting to PDF...');
  const pdfStartTime = Date.now();

  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Set content and wait for images to load
    await page.setContent(html, {
      waitUntil: 'networkidle',
    });

    // Brief wait for SVG rendering
    await page.waitForTimeout(100);

    // Generate PDF
    const mergedOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
    const pdf = await page.pdf({
      format: mergedOptions.format,
      landscape: mergedOptions.landscape,
      printBackground: mergedOptions.printBackground,
      margin: mergedOptions.margin,
    });

    console.log(`[PDF] PDF generated in ${Date.now() - pdfStartTime}ms`);

    // Count pages (estimate based on config)
    const pageCount = [
      data.config?.includeClimate !== false,
      data.config?.includeNaturalCapital !== false,
      data.config?.includeSocial !== false || data.config?.includeGovernance !== false,
      data.config?.includeHeatmap !== false,
    ].filter(Boolean).length;

    const totalTime = Date.now() - startTime;
    console.log(`[PDF] Total generation time: ${totalTime}ms`);

    return {
      pdf,
      html,
      generatedAt: new Date().toISOString(),
      pageCount,
    };
  } finally {
    await context.close();
  }
}

// ============================================================================
// Preview HTML Generation (no PDF conversion)
// ============================================================================

export async function generatePreviewHTML(data: ReportData): Promise<string> {
  const colors: ThemeColors = {
    strongColor: '#A638B5',
    onTrackColor: '#0A598C',
    focusColor: '#DBCB23',
    portfolioColor: '#00E7D7',
    benchmarkColor: '#0F94A6',
    ...data.theme_colors,
  };

  const charts = generateAllChartsSVG(data.metrics, data.benchmark, colors);
  return generateReportHTML(data, charts);
}

// ============================================================================
// Utility: Validate Report Data
// ============================================================================

import { ReportDataSchema } from './types';

export function validateReportData(data: unknown): ReportData {
  return ReportDataSchema.parse(data);
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
