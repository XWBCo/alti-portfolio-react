/**
 * Python Optimization API Types
 * Types for integration with FastAPI optimization service on port 8001
 */

export type OptimizationMode = 'core' | 'core_private' | 'unconstrained';

export interface OptimizationAsset {
  name: string;
  expected_return: number;
  risk: number;
  risk_allocation: string;
}

export interface FrontierRequest {
  mode: OptimizationMode;
  num_points?: number;
  caps_template?: 'standard' | 'tight' | 'loose';
}

export interface FrontierResponse {
  frontier: Array<{
    risk: number;
    return: number;
    weights: Record<string, number>;
  }>;
  assets: OptimizationAsset[];
}

export interface BenchmarkRequest {
  equity_pct: number; // 0-1
  fixed_income_pct: number; // 0-1
}

export interface BenchmarkResponse {
  blended_return: number;
  blended_risk: number;
  equity_return: number;
  equity_risk: number;
  fixed_income_return: number;
  fixed_income_risk: number;
  equity_weight: number;
  fixed_income_weight: number;
}

export interface PortfolioInefficienciesRequest {
  weights: Record<string, number>;
  mode: OptimizationMode;
  caps_template?: 'standard' | 'tight' | 'loose';
}

export interface PortfolioInefficienciesResponse {
  current_risk: number;
  current_return: number;
  optimal_risk: number;
  optimal_return: number;
  risk_reduction: number; // Improvement %
  return_improvement: number; // Improvement %
  optimal_weights: Record<string, number>;
  inefficiency_score: number; // 0-100, higher = more inefficient
}

export interface OptimalPortfolioRequest {
  target_return?: number;
  target_risk?: number;
  mode: OptimizationMode;
  caps_template?: 'standard' | 'tight' | 'loose';
}

export interface OptimalPortfolioResponse {
  weights: Record<string, number>;
  expected_return: number;
  risk: number;
  sharpe_ratio: number;
  constraint_used: 'return' | 'risk' | 'none';
}

export interface AssetsResponse {
  assets: OptimizationAsset[];
  core_assets: string[];
  core_private_assets: string[];
  unconstrained_assets: string[];
}
