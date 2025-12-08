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
