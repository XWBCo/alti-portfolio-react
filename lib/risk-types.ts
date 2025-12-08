/**
 * Risk Contribution Types
 * TypeScript interfaces for portfolio risk analysis
 */

// Portfolio weights (asset name -> weight as decimal)
export type PortfolioWeights = Record<string, number>;

// Stress Scenarios
export interface StressScenario {
  name: string;
  start: string;
  end: string;
  description?: string;
}

export const STRESS_SCENARIOS: StressScenario[] = [
  { name: "GFC (June 2008–Feb 2009)", start: "2008-06-01", end: "2009-02-28", description: "Global Financial Crisis - market crash" },
  { name: "Extended Rally Pre (Mar 2016–Dec 2020)", start: "2016-03-01", end: "2020-12-31", description: "Bull market pre-COVID" },
  { name: "Q4 2018 Holiday Selloff (Oct–Dec 2018)", start: "2018-10-01", end: "2018-12-31", description: "Fed rate hike concerns" },
  { name: "COVID Lockdown (Feb–Mar 2020)", start: "2020-02-01", end: "2020-03-31", description: "COVID-19 market crash" },
  { name: "Post COVID Rally (Mar 2020–Dec 2021)", start: "2020-03-01", end: "2021-12-31", description: "Recovery and stimulus rally" },
  { name: "2022 Inflation / Rate Hikes", start: "2022-01-01", end: "2022-12-31", description: "Fed tightening cycle" },
  { name: "YTD (Jan 2025–Sep 2025)", start: "2025-01-01", end: "2025-09-30", description: "Year to date" },
  { name: "Latest Year (Oct 2024–Sep 2025)", start: "2024-09-01", end: "2025-09-30", description: "Trailing 12 months" },
];

// Stress scenario results
export interface StressScenarioResult {
  scenario: string;
  portfolio_return: number;
  benchmark_return?: number;
  max_drawdown: number;
  volatility: number;
  start_date: string;
  end_date: string;
}

// Risk contribution request
export interface RiskContributionsRequest {
  portfolio: PortfolioWeights;
  use_ewma?: boolean;
  ewma_decay?: number;
}

// Tracking error request
export interface TrackingErrorRequest {
  portfolio: PortfolioWeights;
  benchmark: PortfolioWeights;
  use_ewma?: boolean;
}

// PCTR/MCTR response
export interface RiskContributionsResponse {
  pctr: Record<string, number>;  // Percentage Contribution to Risk
  mctr: Record<string, number>;  // Marginal Contribution to Risk
  portfolio_vol: number;
  portfolio_vol_annualized: number;
}

// Tracking error response
export interface TrackingErrorResponse {
  tracking_error: number;
  active_weights: Record<string, number>;
  te_contributions: Record<string, number>;
}

// Factor decomposition response
export interface FactorDecompositionResponse {
  systematic_risk: number;
  specific_risk: number;
  total_risk: number;
  systematic_pct: number;
  factor_contributions: Record<string, number>;
  portfolio_factor_exposures: Record<string, number>;
}

// Diversification metrics response
export interface DiversificationResponse {
  diversification_ratio: number;
  diversification_benefit_pct: number;
  weighted_avg_correlation: number;
  portfolio_vol_annualized: number;
  weighted_avg_vol_annualized: number;
}

// Performance stats response
export interface PerformanceStats {
  cagr: number;
  volatility: number;
  sharpe: number;
  max_drawdown: number;
  total_return: number;
}

export interface PerformanceResponse {
  portfolio: PerformanceStats;
  benchmark?: PerformanceStats;
  excess?: PerformanceStats;
}

// Full analysis response
export interface FullRiskAnalysis {
  contributions: RiskContributionsResponse;
  diversification: DiversificationResponse;
  performance: PerformanceStats;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Available assets response
export interface AvailableAssets {
  assets: string[];
  factors: string[];
  date_range: {
    start: string;
    end: string;
  };
}

// Chart data types for Recharts
export interface PCTRChartData {
  name: string;
  pctr: number;
  weight: number;
}

export interface FactorExposureChartData {
  factor: string;
  portfolio: number;
  benchmark: number;
  active: number;
}

export interface DiversificationChartData {
  name: string;
  value: number;
  color: string;
}

// Risk analysis state
export interface RiskAnalysisState {
  portfolio: PortfolioWeights;
  benchmark: PortfolioWeights | null;
  contributions: RiskContributionsResponse | null;
  trackingError: TrackingErrorResponse | null;
  factorDecomposition: FactorDecompositionResponse | null;
  diversification: DiversificationResponse | null;
  performance: PerformanceResponse | null;
  isLoading: boolean;
  error: string | null;
}

// Sample portfolios for demo
export const SAMPLE_RISK_PORTFOLIOS: { name: string; weights: PortfolioWeights }[] = [
  {
    name: 'Balanced',
    weights: {
      'Asset_1': 0.15, 'Asset_2': 0.15, 'Asset_3': 0.10,
      'Asset_4': 0.10, 'Asset_5': 0.10, 'Asset_6': 0.08,
      'Asset_7': 0.08, 'Asset_8': 0.08, 'Asset_9': 0.08, 'Asset_10': 0.08,
    }
  },
  {
    name: 'Concentrated',
    weights: {
      'Asset_1': 0.30, 'Asset_2': 0.25, 'Asset_3': 0.20,
      'Asset_4': 0.15, 'Asset_5': 0.10,
    }
  },
  {
    name: 'Equal Weight',
    weights: Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`Asset_${i + 1}`, 0.05])
    )
  },
];

export const SAMPLE_BENCHMARK: PortfolioWeights = {
  'Asset_1': 0.10, 'Asset_2': 0.10, 'Asset_3': 0.10,
  'Asset_4': 0.10, 'Asset_5': 0.10, 'Asset_6': 0.10,
  'Asset_7': 0.10, 'Asset_8': 0.10, 'Asset_9': 0.10, 'Asset_10': 0.10,
};
