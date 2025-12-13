import { z } from 'zod';

// ============================================================================
// Impact Comparison Report Data Types
// Based on HTML structure: alti-impact-dashboard.html
// Compares current portfolio vs. AlTi Impact allocation
// ============================================================================

/**
 * Portfolio metrics for impact comparison
 * Includes climate, ESG scores, and specific social/governance details
 */
export const PortfolioMetricsSchema = z.object({
  // Climate metrics
  climateAlignment: z.number(), // °C (e.g., 2.27 for current, 1.6 for impact)
  carbonIntensityScope12: z.number(), // tCO₂e/$M (Scope 1+2: Direct + Energy)
  carbonIntensityScope3: z.number(), // tCO₂e/$M (Scope 3: Supply Chain)
  netZeroCoverage: z.number(), // percentage (0-100)
  sbtiValidated: z.number(), // percentage (0-100) - Science Based Targets initiative

  // ESG Scores (0-100 scale)
  esgScore: z.number(),
  environmentalScore: z.number(),
  socialScore: z.number(),
  governanceScore: z.number(),

  // Social details (percentages)
  femaleBoardRepresentation: z.number(), // percentage (0-100)
  humanRightsPolicy: z.number(), // percentage (0-100)

  // Governance details (scores 0-100)
  boardIndependence: z.number(),
  antiBriberyPolicy: z.number(),
});

/**
 * SDG (Sustainable Development Goals) contribution data
 */
export const SDGScoreSchema = z.object({
  sdgId: z.number().min(1).max(17), // UN SDG number (1-17)
  sdgName: z.string(), // e.g., "Affordable & Clean Energy"
  value: z.number(), // positive or negative percentage (revenue exposure)
  isPositive: z.boolean(), // whether this is a positive or negative contribution
  color: z.string().optional(), // SDG official color code (e.g., "#FCC30B" for SDG 7)
});

/**
 * Holding data for nature-positive and social impact investments
 */
export const HoldingSchema = z.object({
  name: z.string(), // e.g., "BTG Timber OEF", "Avanath Affordable Housing"
  weight: z.number(), // percentage weight in portfolio (0-100)
  category: z.enum(['nature_positive', 'social_impact']).optional(),
});

/**
 * Complete impact comparison data structure
 */
export const ImpactComparisonDataSchema = z.object({
  clientName: z.string(),
  reportDate: z.string(), // ISO date string or formatted date (e.g., "2024-03-15")

  // Portfolio comparison
  currentPortfolio: PortfolioMetricsSchema,
  impactPortfolio: PortfolioMetricsSchema,

  // SDG data
  positiveSDGs: z.array(SDGScoreSchema), // Top positive contributions
  negativeSDGs: z.array(SDGScoreSchema), // Areas for improvement
  netSDGImpact: z.number(), // Net positive revenue alignment percentage

  // Holdings highlights
  naturePositiveHoldings: z.array(HoldingSchema), // Nature-positive investments
  socialImpactHoldings: z.array(HoldingSchema), // Social impact investments

  // Data coverage (percentages)
  esgDataCoverage: z.number(), // percentage of portfolio with ESG data (0-100)
  sdgDataCoverage: z.number(), // percentage of portfolio with SDG data (0-100)
});

/**
 * Report configuration for impact comparison
 */
export const ImpactReportConfigSchema = z.object({
  includeScorecard: z.boolean().default(true), // Impact scorecard with improvements
  includeTOC: z.boolean().default(true), // Table of contents
  includeClimate: z.boolean().default(true), // Climate action & temperature alignment
  includeCarbon: z.boolean().default(true), // Carbon footprint analysis
  includeSocialGov: z.boolean().default(true), // People & principles (Social + Governance)
  includeSDG: z.boolean().default(true), // SDG impact snapshot
  includeAppendix: z.boolean().default(true), // Detailed metrics & methodology
});

// ============================================================================
// TypeScript Types (inferred from Zod schemas)
// ============================================================================

export type PortfolioMetrics = z.infer<typeof PortfolioMetricsSchema>;
export type SDGScore = z.infer<typeof SDGScoreSchema>;
export type Holding = z.infer<typeof HoldingSchema>;
export type ImpactComparisonData = z.infer<typeof ImpactComparisonDataSchema>;
export type ImpactReportConfig = z.infer<typeof ImpactReportConfigSchema>;

// ============================================================================
// Sample Data for Testing
// ============================================================================

/**
 * Sample current (pre-impact) portfolio metrics
 */
export const SAMPLE_CURRENT_PORTFOLIO: PortfolioMetrics = {
  // Climate metrics
  climateAlignment: 2.27,
  carbonIntensityScope12: 240,
  carbonIntensityScope3: 1315,
  netZeroCoverage: 58,
  sbtiValidated: 34,

  // ESG Scores
  esgScore: 70,
  environmentalScore: 65,
  socialScore: 68,
  governanceScore: 72,

  // Social details
  femaleBoardRepresentation: 54,
  humanRightsPolicy: 82,

  // Governance details
  boardIndependence: 77.5,
  antiBriberyPolicy: 94.6,
};

/**
 * Sample AlTi Impact portfolio metrics (improved)
 */
export const SAMPLE_IMPACT_PORTFOLIO: PortfolioMetrics = {
  // Climate metrics (significant improvements)
  climateAlignment: 1.6, // 30% improvement
  carbonIntensityScope12: 91, // 62% reduction
  carbonIntensityScope3: 708, // 46% reduction
  netZeroCoverage: 96, // 66% improvement
  sbtiValidated: 78, // 129% improvement

  // ESG Scores (all improved)
  esgScore: 82,
  environmentalScore: 78,
  socialScore: 76, // 12% improvement
  governanceScore: 84, // 17% improvement

  // Social details
  femaleBoardRepresentation: 65, // increased from 54%
  humanRightsPolicy: 95, // increased from 82%

  // Governance details
  boardIndependence: 92.0, // increased from 77.5
  antiBriberyPolicy: 99.5, // increased from 94.6
};

/**
 * Sample SDG scores (positive contributions)
 */
export const SAMPLE_POSITIVE_SDGS: SDGScore[] = [
  {
    sdgId: 7,
    sdgName: 'Affordable & Clean Energy',
    value: 8.2,
    isPositive: true,
    color: '#FCC30B',
  },
  {
    sdgId: 13,
    sdgName: 'Climate Action',
    value: 5.4,
    isPositive: true,
    color: '#3F7E44',
  },
  {
    sdgId: 3,
    sdgName: 'Good Health & Well-being',
    value: 4.1,
    isPositive: true,
    color: '#4C9F38',
  },
];

/**
 * Sample SDG scores (areas for improvement)
 */
export const SAMPLE_NEGATIVE_SDGS: SDGScore[] = [
  {
    sdgId: 12,
    sdgName: 'Responsible Consumption',
    value: -1.8,
    isPositive: false,
    color: '#BF8B2E',
  },
  {
    sdgId: 14,
    sdgName: 'Life Below Water',
    value: -0.9,
    isPositive: false,
    color: '#0A97D9',
  },
];

/**
 * Sample nature-positive holdings
 */
export const SAMPLE_NATURE_POSITIVE_HOLDINGS: Holding[] = [
  {
    name: 'BTG Timber OEF',
    weight: 3.0,
    category: 'nature_positive',
  },
  {
    name: 'Blackstone Infrastructure',
    weight: 4.0,
    category: 'nature_positive',
  },
];

/**
 * Sample social impact holdings
 */
export const SAMPLE_SOCIAL_IMPACT_HOLDINGS: Holding[] = [
  {
    name: 'Avanath Affordable Housing',
    weight: 6.0,
    category: 'social_impact',
  },
];

/**
 * Complete sample impact comparison data
 */
export const SAMPLE_IMPACT_COMPARISON_DATA: ImpactComparisonData = {
  clientName: 'John Smith',
  reportDate: '2024-03-15',

  currentPortfolio: SAMPLE_CURRENT_PORTFOLIO,
  impactPortfolio: SAMPLE_IMPACT_PORTFOLIO,

  positiveSDGs: SAMPLE_POSITIVE_SDGS,
  negativeSDGs: SAMPLE_NEGATIVE_SDGS,
  netSDGImpact: 15.0, // Net positive revenue alignment

  naturePositiveHoldings: SAMPLE_NATURE_POSITIVE_HOLDINGS,
  socialImpactHoldings: SAMPLE_SOCIAL_IMPACT_HOLDINGS,

  esgDataCoverage: 94,
  sdgDataCoverage: 87,
};

/**
 * Default report configuration
 */
export const DEFAULT_IMPACT_REPORT_CONFIG: ImpactReportConfig = {
  includeScorecard: true,
  includeTOC: true,
  includeClimate: true,
  includeCarbon: true,
  includeSocialGov: true,
  includeSDG: true,
  includeAppendix: true,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate improvement percentage between current and impact portfolio
 */
export function calculateImprovement(current: number, impact: number, lowerIsBetter: boolean = false): number {
  if (lowerIsBetter) {
    // For metrics where lower is better (e.g., carbon intensity, temperature)
    return Math.round(((current - impact) / current) * 100);
  } else {
    // For metrics where higher is better (e.g., ESG scores, coverage)
    return Math.round(((impact - current) / current) * 100);
  }
}

/**
 * Validate impact comparison data
 */
export function validateImpactComparisonData(data: unknown): ImpactComparisonData {
  return ImpactComparisonDataSchema.parse(data);
}

/**
 * Get SDG color by ID (official UN SDG colors)
 */
export const SDG_COLORS: Record<number, string> = {
  1: '#E5243B', // No Poverty
  2: '#DDA63A', // Zero Hunger
  3: '#4C9F38', // Good Health
  4: '#C5192D', // Quality Education
  5: '#FF3A21', // Gender Equality
  6: '#26BDE2', // Clean Water
  7: '#FCC30B', // Affordable Energy
  8: '#A21942', // Decent Work
  9: '#FD6925', // Industry Innovation
  10: '#DD1367', // Reduced Inequalities
  11: '#FD9D24', // Sustainable Cities
  12: '#BF8B2E', // Responsible Consumption
  13: '#3F7E44', // Climate Action
  14: '#0A97D9', // Life Below Water
  15: '#56C02B', // Life on Land
  16: '#00689D', // Peace & Justice
  17: '#19486A', // Partnerships
};

/**
 * Get improvement arrow indicator
 */
export function getImprovementIndicator(improvement: number): {
  arrow: '↑' | '↓' | '→';
  isPositive: boolean;
} {
  if (improvement > 2) {
    return { arrow: '↑', isPositive: true };
  } else if (improvement < -2) {
    return { arrow: '↓', isPositive: false };
  } else {
    return { arrow: '→', isPositive: true }; // Neutral/unchanged
  }
}
