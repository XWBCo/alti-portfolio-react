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
// Sample portfolios using real asset names from CMA data
export const SAMPLE_RISK_PORTFOLIOS: { name: string; weights: PortfolioWeights }[] = [
  {
    name: 'Balanced 60/40',
    weights: {
      'Global': 0.30,           // Global equity
      'US': 0.15,               // US equity
      'EM': 0.10,               // Emerging markets equity
      'Pan Europe': 0.05,       // European equity
      'Global Aggregate': 0.20, // Global bonds
      'High Yield': 0.10,       // High yield bonds
      'Global Cash': 0.05,      // Cash
      'Gold': 0.05,             // Gold
    }
  },
  {
    name: 'Conservative Income',
    weights: {
      'Global Aggregate': 0.30,
      'US Aggregate': 0.20,
      'IG Corporate': 0.15,
      'High Yield': 0.10,
      'Global Government': 0.10,
      'Global Cash': 0.10,
      'Gold': 0.05,
    }
  },
  {
    name: 'Growth Equity',
    weights: {
      'Global': 0.35,
      'US': 0.25,
      'EM': 0.15,
      'Japan': 0.10,
      'Pan Europe': 0.10,
      'Global Cash': 0.05,
    }
  },
  {
    name: 'All Weather',
    weights: {
      'Global': 0.30,
      'Global Aggregate': 0.20,
      'US Government': 0.15,
      'Gold': 0.10,
      'General Commodities': 0.10,
      'Global REITs': 0.10,
      'Global Cash': 0.05,
    }
  },
  {
    name: 'High Yield Focus',
    weights: {
      'High Yield': 0.30,
      'EM Debt': 0.20,
      'Loans': 0.15,
      'IG Corporate': 0.15,
      'Global': 0.10,
      'Global Cash': 0.10,
    }
  },
  {
    name: 'US Focused',
    weights: {
      'US': 0.40,
      'US SMID': 0.15,
      'US Aggregate': 0.20,
      'US Government': 0.10,
      'US REITs': 0.10,
      'US Cash': 0.05,
    }
  },
  {
    name: 'Global Diversified',
    weights: {
      'Global': 0.20,
      'US': 0.15,
      'EM': 0.10,
      'Pan Europe': 0.05,
      'Japan': 0.05,
      'Global Aggregate': 0.15,
      'High Yield': 0.10,
      'Gold': 0.05,
      'Global REITs': 0.10,
      'Global Cash': 0.05,
    }
  },
  {
    name: 'Minimum Volatility',
    weights: {
      'Global Cash': 0.20,
      'US Cash': 0.10,
      'Global Government': 0.25,
      'US Government': 0.15,
      'Global Aggregate': 0.20,
      'Gold': 0.10,
    }
  },
];

export const SAMPLE_BENCHMARK: PortfolioWeights = {
  'Global': 0.40,
  'Global Aggregate': 0.30,
  'US': 0.10,
  'EM': 0.05,
  'High Yield': 0.05,
  'Gold': 0.05,
  'Global Cash': 0.05,
};
