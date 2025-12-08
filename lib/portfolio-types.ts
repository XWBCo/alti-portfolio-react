/**
 * Portfolio Evaluation Types
 * TypeScript interfaces for portfolio optimization and efficient frontier
 */

export type RiskAllocation = 'STABILITY' | 'DIVERSIFIED' | 'GROWTH';

export interface AssetClass {
  name: string;
  expectedReturn: number; // Annual expected return (e.g., 0.065 = 6.5%)
  risk: number; // Annual standard deviation (e.g., 0.15 = 15%)
  riskAllocation: RiskAllocation;
  capMax: number; // Maximum weight constraint (0-1)
}

export interface PortfolioHoldings {
  name: string;
  allocations: Record<string, number>; // assetClass name -> weight (0-1)
}

export interface FrontierPoint {
  risk: number;
  return: number;
  allocations: Record<string, number>;
}

export interface PortfolioMetrics {
  expectedReturn: number;
  risk: number;
  var95: number; // 95% Value at Risk
  cvar95: number; // 95% Conditional VaR (Expected Shortfall)
  sharpeRatio: number; // Return / Risk
}

export interface PortfolioWithMetrics extends PortfolioHoldings {
  metrics: PortfolioMetrics;
}

export interface EfficientFrontierResult {
  frontier: FrontierPoint[];
  portfolios: PortfolioWithMetrics[];
}

export interface OptimizationParams {
  mode: 'core' | 'core_private' | 'unconstrained';
  capsTemplate: 'standard' | 'tight' | 'loose';
  numPoints?: number; // Number of frontier points (default: 30)
}

// CSV Upload types
export interface ParsedPortfolioCSV {
  assetClasses: string[];
  portfolioNames: string[];
  allocations: Record<string, Record<string, number>>; // portfolioName -> assetClass -> weight
}

// Chart data types for Recharts
export interface FrontierChartPoint {
  risk: number;
  return: number;
  type: 'frontier' | 'portfolio';
  name?: string;
  allocations?: Record<string, number>;
}

// Correlation matrix type
export type CorrelationMatrix = Record<string, Record<string, number>>;
