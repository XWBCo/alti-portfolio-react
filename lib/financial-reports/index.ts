/**
 * Financial Reports Module
 *
 * Comprehensive financial report generation for wealth management:
 * - Client Portfolio Reports
 * - Advisor Book Reports
 * - Firm-wide Analytics
 *
 * @module lib/financial-reports
 */

// ============================================================================
// Types & Schemas
// ============================================================================

export {
  // Enums
  AssetClassEnum,
  GeographyEnum,
  SectorEnum,
  AccountTypeEnum,
  TaxTypeEnum,
  ClientStatusEnum,
  ReportTypeEnum,
  ReportFormatEnum,
  PageSizeEnum,
  OrientationEnum,

  // Core Schemas
  HoldingSchema,
  AccountSchema,
  PerformancePointSchema,
  PerformanceMetricsSchema,
  AllocationSliceSchema,
  AssetAllocationSchema,
  BenchmarkSchema,
  ClientInfoSchema,
  ClientReportDataSchema,
  ClientSummarySchema,
  AdvisorReportDataSchema,
  AdvisorSummarySchema,
  TeamSummarySchema,
  ClientSegmentSchema,
  AUMHistoryPointSchema,
  FirmReportDataSchema,

  // Config Schemas
  ThemeColorsSchema,
  ReportSectionsSchema,
  ReportConfigSchema,
  GenerateReportRequestSchema,
  GenerateReportResponseSchema,

  // TypeScript Types
  type AssetClass,
  type Geography,
  type Sector,
  type Holding,
  type AccountType,
  type TaxType,
  type Account,
  type PerformancePoint,
  type PerformanceMetrics,
  type AllocationSlice,
  type AssetAllocation,
  type Benchmark,
  type ClientStatus,
  type ClientInfo,
  type ClientReportData,
  type ClientSummary,
  type AdvisorReportData,
  type AdvisorSummary,
  type TeamSummary,
  type ClientSegment,
  type AUMHistoryPoint,
  type FirmReportData,
  type ReportType,
  type ReportFormat,
  type PageSize,
  type Orientation,
  type ThemeColors,
  type ReportSections,
  type ReportConfig,
  type GenerateReportRequest,
  type GenerateReportResponse,

  // Color Constants
  ASSET_CLASS_COLORS,
  GEOGRAPHY_COLORS,
  STATUS_COLORS,
} from './types';

// ============================================================================
// Mock Data Generators
// ============================================================================

export {
  generateClientReportData,
  generateAdvisorReportData,
  generateFirmReportData,
  SAMPLE_CLIENT_REPORT,
  SAMPLE_ADVISOR_REPORT,
  SAMPLE_FIRM_REPORT,
} from './mock-data';

// ============================================================================
// Chart Generators
// ============================================================================

export {
  generateDonutChartSVG,
  generateLineChartSVG,
  generateBarChartSVG,
  generateHorizontalBarChartSVG,
  generateAreaChartSVG,
  generateAllFinancialCharts,
  type DonutChartOptions,
  type LineChartOptions,
  type BarChartOptions,
  type BarData,
  type HorizontalBarData,
  type HorizontalBarOptions,
  type AreaChartOptions,
  type FinancialReportCharts,
} from './charts/svg-charts';

// ============================================================================
// Template Utilities
// ============================================================================

export {
  getBaseStyles,
  renderHeader,
  renderMetricCard,
  renderMetricsRow,
  renderTable,
  renderFooter,
  renderStatusBadge,
  wrapDocument,
  formatCurrency,
  formatCurrencyFull,
  formatPercent,
  formatPercentPlain,
  formatNumber,
  formatDateDisplay,
  formatDateShort,
  type HeaderProps,
  type MetricCardProps,
  type TableColumn,
  type TableProps,
  type FooterProps,
} from './templates/shared';

// ============================================================================
// Report Templates
// ============================================================================

export {
  generateClientPortfolioHTML,
  type ClientReportOptions,
} from './templates/client-portfolio';

export { generateAdvisorBookHTML } from './templates/advisor-book';
export { generateFirmAnalyticsHTML } from './templates/firm-analytics';

// ============================================================================
// PDF Generation
// ============================================================================

export {
  generateClientReportPDF,
  generateAdvisorReportPDF,
  generateFirmReportPDF,
  generateReport,
  generateClientPreviewHTML,
  closeBrowser,
  type PDFOptions,
  type GenerateReportResult,
  type ReportData,
} from './generators/pdf-generator';

// ============================================================================
// Export Generators (Excel & CSV)
// ============================================================================

export {
  generateClientReportExcel,
  generateAdvisorReportExcel,
  generateFirmReportExcel,
  generateClientReportCSV,
  generateClientReportCombinedCSV,
  generateAdvisorReportCSV,
  generateFirmReportCSV,
  type ClientCSVExport,
} from './exports';
