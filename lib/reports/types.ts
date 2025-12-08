import { z } from 'zod';

// ============================================================================
// ESG Report Data Types
// Based on Flask template structure: new_esg_report.html
// ============================================================================

/**
 * Climate metrics for temperature alignment and financed emissions
 * Arrays contain [primary_metric, secondary_metric]
 */
export const ClimateMetricsSchema = z.object({
  // Temperature Rating °C - how closely investments align with Paris Agreement
  climate_scope12: z.tuple([z.number(), z.number()]), // [Temp Rating Scope 1+2, Carbon Intensity 1+2]
  climate_scope3: z.tuple([z.number(), z.number()]),  // [Financed Intensity Scope 3, Carbon Intensity Scope 3]

  // Climate performance scores (0-100)
  climate_performance_env: z.tuple([z.number(), z.number()]), // [Environmental Score, Net Zero Target]
  climate_performance_temp: z.tuple([z.number(), z.number()]), // [Temp Rating 1+2, Temp Rating 3]
});

/**
 * Natural capital metrics for ecosystem impact
 * Arrays contain [primary_metric, secondary_metric]
 */
export const NaturalCapitalMetricsSchema = z.object({
  natural_capital: z.tuple([z.number(), z.number()]), // [Land Use & Biodiversity, Biodiversity Reduction]
  water_recycled_ratio: z.number(), // Single percentage value
  waste_recycling_ratio: z.number(), // Single percentage value
});

/**
 * Social metrics for workforce and diversity
 * Array contains [score, gap, diversity_pct, targets]
 */
export const SocialMetricsSchema = z.object({
  social: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  // [Social Score, Gender Pay Gap, Female Board Members %, Diversity Targets]
});

/**
 * Governance metrics for board composition and ethics
 * Array contains [score, non_exec_pct, independent_pct, anti_bribery]
 */
export const GovernanceMetricsSchema = z.object({
  governance: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  // [Governance Score, Non-Executive Board %, Independent Board %, Anti-Bribery Score]
});

/**
 * Combined portfolio metrics
 */
export const PortfolioMetricsSchema = z.object({
  ...ClimateMetricsSchema.shape,
  ...NaturalCapitalMetricsSchema.shape,
  ...SocialMetricsSchema.shape,
  ...GovernanceMetricsSchema.shape,
});

/**
 * Benchmark data (same structure as portfolio metrics)
 */
export const BenchmarkMetricsSchema = PortfolioMetricsSchema;

/**
 * Theme colors for heatmap performance indicators
 */
export const ThemeColorsSchema = z.object({
  strongColor: z.string().default('#A638B5'),   // Purple - better than benchmark
  onTrackColor: z.string().default('#0A598C'),  // Blue - within range of benchmark
  focusColor: z.string().default('#DBCB23'),    // Yellow - below benchmark
  portfolioColor: z.string().default('#00E7D7'), // Teal - portfolio value
  benchmarkColor: z.string().default('#0F94A6'), // Dark teal - benchmark value
});

/**
 * Individual asset data for underlying holdings table
 */
export const AssetDataSchema = z.object({
  identifier: z.string(), // ISIN, CUSIP, SEDOL, or internal code
  name: z.string(),
  weight: z.number(), // Percentage weight in portfolio (0-100)
  type: z.enum(['us_fund', 'intl_fund', 'lp', 'sma']),
  metrics: PortfolioMetricsSchema.partial().optional(), // Individual asset ESG metrics (may be incomplete)
});

/**
 * Report configuration options
 */
export const ReportConfigSchema = z.object({
  includeClimate: z.boolean().default(true),
  includeNaturalCapital: z.boolean().default(true),
  includeSocial: z.boolean().default(true),
  includeGovernance: z.boolean().default(true),
  includeHeatmap: z.boolean().default(true),
  benchmarkName: z.string().default('MSCI ACWI'),
  reportYear: z.number().default(new Date().getFullYear()),
});

/**
 * Complete report data structure
 */
export const ReportDataSchema = z.object({
  client_name: z.string(),
  report_date: z.string().optional(), // ISO date string, defaults to today
  metrics: PortfolioMetricsSchema,
  benchmark: BenchmarkMetricsSchema,
  assets: z.array(AssetDataSchema).optional(), // Underlying holdings
  theme_colors: ThemeColorsSchema.optional(),
  config: ReportConfigSchema.optional(),
});

// ============================================================================
// TypeScript Types (inferred from Zod schemas)
// ============================================================================

export type ClimateMetrics = z.infer<typeof ClimateMetricsSchema>;
export type NaturalCapitalMetrics = z.infer<typeof NaturalCapitalMetricsSchema>;
export type SocialMetrics = z.infer<typeof SocialMetricsSchema>;
export type GovernanceMetrics = z.infer<typeof GovernanceMetricsSchema>;
export type PortfolioMetrics = z.infer<typeof PortfolioMetricsSchema>;
export type BenchmarkMetrics = z.infer<typeof BenchmarkMetricsSchema>;
export type ThemeColors = z.infer<typeof ThemeColorsSchema>;
export type AssetData = z.infer<typeof AssetDataSchema>;
export type ReportConfig = z.infer<typeof ReportConfigSchema>;
export type ReportData = z.infer<typeof ReportDataSchema>;

// ============================================================================
// Sample Data for Testing
// ============================================================================

export const SAMPLE_BENCHMARK: BenchmarkMetrics = {
  climate_scope12: [1.9, 45.2],       // Temp °C, Carbon Intensity tCO2e/$M
  climate_scope3: [89.5, 156.3],      // Financed Intensity, Carbon Intensity Scope 3
  climate_performance_env: [72.0, 65.0], // Environmental Score, Net Zero Target %
  climate_performance_temp: [2.1, 2.4],  // Temp Rating 1+2, Temp Rating 3
  natural_capital: [68.0, 45.0],      // Land Use score, Biodiversity Reduction score
  water_recycled_ratio: 42.0,
  waste_recycling_ratio: 55.0,
  social: [71.0, 8.5, 32.0, 58.0],    // Social Score, Pay Gap %, Female Board %, Diversity Targets
  governance: [75.0, 78.0, 62.0, 82.0], // Gov Score, Non-Exec %, Independent %, Anti-Bribery
};

export const SAMPLE_PORTFOLIO_METRICS: PortfolioMetrics = {
  climate_scope12: [1.7, 38.5],       // Better than benchmark
  climate_scope3: [78.2, 142.1],      // Better than benchmark
  climate_performance_env: [78.5, 72.0], // Better than benchmark
  climate_performance_temp: [1.8, 2.1],  // Better than benchmark
  natural_capital: [82.0, 52.0],      // Better than benchmark
  water_recycled_ratio: 48.5,
  waste_recycling_ratio: 62.0,
  social: [76.4, 6.2, 38.0, 65.0],    // Better than benchmark
  governance: [84.2, 85.0, 72.0, 88.0], // Better than benchmark
};

export const SAMPLE_REPORT_DATA: ReportData = {
  client_name: 'AlTi Global Growth Portfolio',
  report_date: new Date().toISOString().split('T')[0],
  metrics: SAMPLE_PORTFOLIO_METRICS,
  benchmark: SAMPLE_BENCHMARK,
  theme_colors: {
    strongColor: '#A638B5',
    onTrackColor: '#0A598C',
    focusColor: '#DBCB23',
    portfolioColor: '#00E7D7',
    benchmarkColor: '#0F94A6',
  },
  config: {
    includeClimate: true,
    includeNaturalCapital: true,
    includeSocial: true,
    includeGovernance: true,
    includeHeatmap: true,
    benchmarkName: 'MSCI ACWI',
    reportYear: 2024,
  },
};
