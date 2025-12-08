import { z } from 'zod';

// ============================================================================
// Financial Report Data Types
// Comprehensive schemas for client portfolio, advisor book, and firm reports
// ============================================================================

// ============================================================================
// HOLDINGS & POSITIONS
// ============================================================================

export const AssetClassEnum = z.enum([
  'equity',
  'fixed-income',
  'alternatives',
  'cash',
  'real-estate',
  'commodities',
  'crypto',
  'private-equity',
  'hedge-funds',
]);

export const GeographyEnum = z.enum([
  'us',
  'developed-intl',
  'emerging',
  'global',
  'europe',
  'asia-pacific',
  'latin-america',
]);

export const SectorEnum = z.enum([
  'technology',
  'healthcare',
  'financials',
  'consumer-discretionary',
  'consumer-staples',
  'industrials',
  'energy',
  'materials',
  'utilities',
  'real-estate',
  'communication-services',
  'other',
]);

export const HoldingSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  assetClass: AssetClassEnum,
  sector: SectorEnum.optional(),
  geography: GeographyEnum.optional(),
  quantity: z.number(),
  costBasis: z.number(),
  currentPrice: z.number(),
  currentValue: z.number(),
  weight: z.number(), // 0-100 percentage of portfolio
  gainLoss: z.number(),
  gainLossPercent: z.number(),
  dividendYield: z.number().optional(),
  peRatio: z.number().optional(),
});

export const AccountTypeEnum = z.enum([
  'brokerage',
  '401k',
  'ira',
  'roth-ira',
  'sep-ira',
  'hsa',
  '529',
  'trust',
  'checking',
  'savings',
  'mortgage',
  'annuity',
  'other',
]);

export const TaxTypeEnum = z.enum(['taxable', 'tax-deferred', 'tax-free']);

export const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: AccountTypeEnum,
  institution: z.string(),
  taxType: TaxTypeEnum,
  balance: z.number(),
  holdings: z.array(HoldingSchema).optional(),
});

// ============================================================================
// PERFORMANCE DATA
// ============================================================================

export const PerformancePointSchema = z.object({
  date: z.string(), // ISO date string
  portfolioValue: z.number(),
  benchmarkValue: z.number().optional(),
  netFlows: z.number().default(0),
});

export const PerformanceMetricsSchema = z.object({
  periodReturn: z.number(), // percentage for selected period
  periodReturnDollars: z.number(),
  mtd: z.number(), // month-to-date
  qtd: z.number(), // quarter-to-date
  ytd: z.number(), // year-to-date
  oneYear: z.number().nullable(),
  threeYear: z.number().nullable(), // annualized
  fiveYear: z.number().nullable(), // annualized
  tenYear: z.number().nullable(), // annualized
  sinceInception: z.number().nullable(),
  inceptionDate: z.string().optional(),
  volatility: z.number().nullable(), // standard deviation
  sharpeRatio: z.number().nullable(),
  maxDrawdown: z.number().nullable(),
  beta: z.number().nullable(),
  alpha: z.number().nullable(),
});

// ============================================================================
// ASSET ALLOCATION
// ============================================================================

export const AllocationSliceSchema = z.object({
  category: z.string(),
  value: z.number(), // dollar value
  weight: z.number(), // percentage 0-100
  targetWeight: z.number().optional(), // IPS target weight
  variance: z.number().optional(), // actual - target
  color: z.string().optional(),
});

export const AssetAllocationSchema = z.object({
  byAssetClass: z.array(AllocationSliceSchema),
  byGeography: z.array(AllocationSliceSchema).optional(),
  bySector: z.array(AllocationSliceSchema).optional(),
  byTaxType: z.array(AllocationSliceSchema).optional(),
  byAccount: z.array(AllocationSliceSchema).optional(),
});

// ============================================================================
// BENCHMARK DATA
// ============================================================================

export const BenchmarkSchema = z.object({
  name: z.string(),
  ticker: z.string().optional(),
  performance: PerformanceMetricsSchema,
  history: z.array(PerformancePointSchema).optional(),
});

// ============================================================================
// CLIENT REPORT DATA
// ============================================================================

export const ClientStatusEnum = z.enum(['on-track', 'needs-attention', 'at-risk']);

export const ClientInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  household: z.string(),
  entityId: z.string().optional(), // Addepar Entity ID
  advisor: z.string(),
  advisorTeam: z.object({
    investmentOfficer: z.string().optional(),
    seniorAdvisor: z.string().optional(),
    secondaryAdvisor: z.string().optional(),
    adminOfficer: z.string().optional(),
    invAssociate: z.string().optional(),
    trustOfficer: z.string().optional(),
    trustAdmin: z.string().optional(),
    clientServicesRep: z.string().optional(),
  }).optional(),
  status: ClientStatusEnum,
  riskScore: z.number().min(1).max(100).optional(),
  lastMeeting: z.string().optional(),
  nextMeeting: z.string().optional(),
  inceptionDate: z.string().optional(),
});

export const ClientReportDataSchema = z.object({
  // Report metadata
  reportDate: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  generatedAt: z.string().optional(),

  // Client info
  client: ClientInfoSchema,

  // Summary metrics
  totalAUM: z.number(),
  netWorth: z.number().optional(),
  periodGainLoss: z.number(),
  periodGainLossPercent: z.number(),

  // Value change components (for waterfall chart)
  contributions: z.number().optional(),
  withdrawals: z.number().optional(),
  income: z.number().optional(),

  // Detailed data
  accounts: z.array(AccountSchema),
  holdings: z.array(HoldingSchema),
  allocation: AssetAllocationSchema,
  performance: PerformanceMetricsSchema,
  performanceHistory: z.array(PerformancePointSchema),

  // Benchmarks
  benchmark: BenchmarkSchema.optional(),
  secondaryBenchmark: BenchmarkSchema.optional(),
});

// ============================================================================
// ADVISOR BOOK REPORT
// ============================================================================

export const ClientSummarySchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  household: z.string(),
  entityId: z.string().optional(),
  aum: z.number(),
  lastMeeting: z.string().optional(),
  nextMeeting: z.string().optional(),
  status: ClientStatusEnum,
  ytdReturn: z.number(),
  mtdReturn: z.number().optional(),
  planHealth: z.number().optional(), // 0-100 probability of success
  riskScore: z.number().optional(),
});

export const AdvisorReportDataSchema = z.object({
  // Report metadata
  reportDate: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),

  // Advisor info
  advisorId: z.string(),
  advisorName: z.string(),
  team: z.string().optional(),
  role: z.string().optional(),

  // Book metrics
  totalAUM: z.number(),
  totalClients: z.number(),
  avgClientAUM: z.number(),
  medianClientAUM: z.number().optional(),
  clientsByStatus: z.object({
    onTrack: z.number(),
    needsAttention: z.number(),
    atRisk: z.number(),
  }),

  // Performance
  bookYTDReturn: z.number().optional(),
  bookMTDReturn: z.number().optional(),

  // Flows
  ytdNetFlows: z.number().optional(),
  mtdNetFlows: z.number().optional(),

  // Client list
  clients: z.array(ClientSummarySchema),

  // Aggregated allocation
  bookAllocation: AssetAllocationSchema.optional(),

  // Revenue (if applicable)
  annualRevenue: z.number().optional(),
  avgFeeRate: z.number().optional(), // basis points
});

// ============================================================================
// FIRM-WIDE ANALYTICS
// ============================================================================

export const AdvisorSummarySchema = z.object({
  advisorId: z.string(),
  advisorName: z.string(),
  team: z.string(),
  role: z.string().optional(),
  totalAUM: z.number(),
  clientCount: z.number(),
  avgClientAUM: z.number(),
  ytdPerformance: z.number().optional(),
  ytdNetFlows: z.number().optional(),
  newClientsYTD: z.number().optional(),
});

export const TeamSummarySchema = z.object({
  teamName: z.string(),
  totalAUM: z.number(),
  clientCount: z.number(),
  advisorCount: z.number(),
  ytdPerformance: z.number().optional(),
  ytdNetFlows: z.number().optional(),
});

export const ClientSegmentSchema = z.object({
  segment: z.string(), // UHNW, HNW, Affluent, etc.
  minAUM: z.number(),
  maxAUM: z.number().optional(),
  clientCount: z.number(),
  totalAUM: z.number(),
  avgAUM: z.number(),
});

export const AUMHistoryPointSchema = z.object({
  date: z.string(),
  aum: z.number(),
  netFlows: z.number().optional(),
  marketChange: z.number().optional(),
});

export const FirmReportDataSchema = z.object({
  // Report metadata
  firmName: z.string(),
  reportDate: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),

  // Firm totals
  totalAUM: z.number(),
  totalClients: z.number(),
  totalAdvisors: z.number(),
  totalHouseholds: z.number().optional(),
  avgClientAUM: z.number(),
  medianClientAUM: z.number().optional(),

  // Flows
  ytdNetFlows: z.number(),
  mtdNetFlows: z.number(),
  ytdNewClients: z.number().optional(),
  ytdClosedClients: z.number().optional(),

  // Performance
  firmYTDReturn: z.number(),
  firmMTDReturn: z.number(),
  firmQTDReturn: z.number().optional(),

  // Segmentation
  aumByAdvisor: z.array(AdvisorSummarySchema),
  aumByTeam: z.array(TeamSummarySchema).optional(),
  aumBySegment: z.array(ClientSegmentSchema).optional(),

  // Trends
  aumHistory: z.array(AUMHistoryPointSchema),

  // Firm allocation
  firmAllocation: AssetAllocationSchema.optional(),
});

// ============================================================================
// REPORT CONFIGURATION
// ============================================================================

export const ReportTypeEnum = z.enum([
  'client-portfolio',
  'advisor-book',
  'firm-analytics',
]);

export const ReportFormatEnum = z.enum(['pdf', 'html', 'excel', 'csv']);

export const PageSizeEnum = z.enum(['A4', 'Letter']);

export const OrientationEnum = z.enum(['portrait', 'landscape']);

export const ThemeColorsSchema = z.object({
  primary: z.string().default('#00f0db'),
  secondary: z.string().default('#00d6c3'),
  accent: z.string().default('#005793'),
  positive: z.string().default('#10B981'),
  negative: z.string().default('#EF4444'),
  neutral: z.string().default('#6B7280'),
  background: z.string().default('#FFFFFF'),
  text: z.string().default('#1F2937'),
});

export const ReportSectionsSchema = z.object({
  coverPage: z.boolean().default(true),
  summary: z.boolean().default(true),
  performance: z.boolean().default(true),
  allocation: z.boolean().default(true),
  holdings: z.boolean().default(true),
  accounts: z.boolean().default(true),
  benchmark: z.boolean().default(true),
  projections: z.boolean().default(false),
  taxAnalysis: z.boolean().default(false),
});

export const ReportConfigSchema = z.object({
  reportType: ReportTypeEnum,
  format: ReportFormatEnum.default('pdf'),
  sections: ReportSectionsSchema.optional(),
  themeColors: ThemeColorsSchema.optional(),
  pageSize: PageSizeEnum.default('Letter'),
  orientation: OrientationEnum.default('portrait'),
  includeDisclaimer: z.boolean().default(true),
  includeBranding: z.boolean().default(true),
  firmLogo: z.string().optional(),
  firmName: z.string().default('AlTi Tiedemann Global'),
});

// ============================================================================
// API REQUEST/RESPONSE
// ============================================================================

export const GenerateReportRequestSchema = z.object({
  config: ReportConfigSchema,
  data: z.union([
    ClientReportDataSchema,
    AdvisorReportDataSchema,
    FirmReportDataSchema,
  ]),
});

export const GenerateReportResponseSchema = z.object({
  success: z.boolean(),
  format: ReportFormatEnum,
  generatedAt: z.string(),
  pageCount: z.number().optional(),
  fileSize: z.number().optional(),
  downloadUrl: z.string().optional(),
  error: z.string().optional(),
});

// ============================================================================
// TypeScript Types (inferred from Zod schemas)
// ============================================================================

export type AssetClass = z.infer<typeof AssetClassEnum>;
export type Geography = z.infer<typeof GeographyEnum>;
export type Sector = z.infer<typeof SectorEnum>;
export type Holding = z.infer<typeof HoldingSchema>;
export type AccountType = z.infer<typeof AccountTypeEnum>;
export type TaxType = z.infer<typeof TaxTypeEnum>;
export type Account = z.infer<typeof AccountSchema>;
export type PerformancePoint = z.infer<typeof PerformancePointSchema>;
export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
export type AllocationSlice = z.infer<typeof AllocationSliceSchema>;
export type AssetAllocation = z.infer<typeof AssetAllocationSchema>;
export type Benchmark = z.infer<typeof BenchmarkSchema>;
export type ClientStatus = z.infer<typeof ClientStatusEnum>;
export type ClientInfo = z.infer<typeof ClientInfoSchema>;
export type ClientReportData = z.infer<typeof ClientReportDataSchema>;
export type ClientSummary = z.infer<typeof ClientSummarySchema>;
export type AdvisorReportData = z.infer<typeof AdvisorReportDataSchema>;
export type AdvisorSummary = z.infer<typeof AdvisorSummarySchema>;
export type TeamSummary = z.infer<typeof TeamSummarySchema>;
export type ClientSegment = z.infer<typeof ClientSegmentSchema>;
export type AUMHistoryPoint = z.infer<typeof AUMHistoryPointSchema>;
export type FirmReportData = z.infer<typeof FirmReportDataSchema>;
export type ReportType = z.infer<typeof ReportTypeEnum>;
export type ReportFormat = z.infer<typeof ReportFormatEnum>;
export type PageSize = z.infer<typeof PageSizeEnum>;
export type Orientation = z.infer<typeof OrientationEnum>;
export type ThemeColors = z.infer<typeof ThemeColorsSchema>;
export type ReportSections = z.infer<typeof ReportSectionsSchema>;
export type ReportConfig = z.infer<typeof ReportConfigSchema>;
export type GenerateReportRequest = z.infer<typeof GenerateReportRequestSchema>;
export type GenerateReportResponse = z.infer<typeof GenerateReportResponseSchema>;

// ============================================================================
// Utility: Chart Color Palette
// ============================================================================

export const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  'equity': '#00E7D7',
  'fixed-income': '#0F94A6',
  'alternatives': '#A638B5',
  'cash': '#6B7280',
  'real-estate': '#F59E0B',
  'commodities': '#EF4444',
  'crypto': '#8B5CF6',
  'private-equity': '#0A598C',
  'hedge-funds': '#EC4899',
};

export const GEOGRAPHY_COLORS: Record<Geography, string> = {
  'us': '#00E7D7',
  'developed-intl': '#0F94A6',
  'emerging': '#A638B5',
  'global': '#6B7280',
  'europe': '#F59E0B',
  'asia-pacific': '#EF4444',
  'latin-america': '#8B5CF6',
};

export const STATUS_COLORS: Record<ClientStatus, string> = {
  'on-track': '#10B981',
  'needs-attention': '#F59E0B',
  'at-risk': '#EF4444',
};
