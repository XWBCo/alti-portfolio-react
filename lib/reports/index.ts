// ============================================================================
// ESG Report Engine - Public API
// ============================================================================

// Types
export type {
  ClimateMetrics,
  NaturalCapitalMetrics,
  SocialMetrics,
  GovernanceMetrics,
  PortfolioMetrics,
  BenchmarkMetrics,
  ThemeColors,
  AssetData,
  ReportConfig,
  ReportData,
} from './types';

// Schemas for validation
export {
  ClimateMetricsSchema,
  NaturalCapitalMetricsSchema,
  SocialMetricsSchema,
  GovernanceMetricsSchema,
  PortfolioMetricsSchema,
  BenchmarkMetricsSchema,
  ThemeColorsSchema,
  AssetDataSchema,
  ReportConfigSchema,
  ReportDataSchema,
} from './types';

// Sample data for testing
export {
  SAMPLE_BENCHMARK,
  SAMPLE_PORTFOLIO_METRICS,
  SAMPLE_REPORT_DATA,
} from './types';

// SVG Chart generation
export type { ReportCharts } from './svg-charts';
export {
  generateBarChartSVG,
  generateHorizontalBarChartSVG,
  generateDonutChartSVG,
  generateAllChartsSVG,
  svgToDataUri,
} from './svg-charts';

// Template generation
export { generateReportHTML } from './template';

// PDF generation
export type { PDFOptions, GenerateReportResult } from './pdf-generator';
export {
  generatePDFReport,
  generatePreviewHTML,
  validateReportData,
  closeBrowser,
} from './pdf-generator';

// ============================================================================
// Impact Comparison Report - Public API
// ============================================================================

// Re-export from impact-comparison-template when it exists
// These are placeholder exports that will be implemented in impact-comparison-template.ts
export type {
  ImpactComparisonData,
} from './impact-comparison-template';

export type {
  ImpactReportConfig,
} from './impact-comparison-types';

export {
  ImpactComparisonDataSchema,
  SAMPLE_IMPACT_COMPARISON_DATA,
} from './impact-comparison-template';

export {
  generateImpactComparisonHTML,
  generateImpactComparisonPDF,
  generateImpactComparisonPreview,
  validateImpactComparisonData,
} from './impact-comparison-template';
