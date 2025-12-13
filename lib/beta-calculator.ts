/**
 * Beta Matrix Calculator
 * Calculates beta coefficients for asset classes relative to a benchmark
 */

// Monthly return series data (USD)
// Source: return_series.csv from legacy app
export const RETURN_SERIES_ASSETS = [
  'Absolute Return HFs',
  'Aggregate - Global',
  'Aggregate - US',
  'Asia Pacific ex Japan',
  'Cash - US',
  'Credit Directional HFs',
  'EM Debt',
  'EM Equities',
  'General Commodities',
  'Global ACWI EAFE',
  'Global Equities ACWI',
  'Gold',
  'Govt Bonds - Global',
  'Govt Bonds - US',
  'Growth Directional HFs',
  'High Yield',
  'HY Muni Bond',
  'IG Corp',
  'IG Muni Bond',
  'Illiquid RE',
  'Infrastructure',
  'Japan Equities',
  'Pan Europe',
  'PE',
  'Private Debt',
  'REITs - Global',
  'US Equities',
] as const;

export type ReturnSeriesAsset = (typeof RETURN_SERIES_ASSETS)[number];

// Sample monthly returns data (representative subset for client-side calculation)
// In production, this would be loaded from API/CSV
const SAMPLE_RETURNS: Record<ReturnSeriesAsset, number[]> = {
  'Absolute Return HFs': [0.88, -0.40, 0.45, 0.33, 0.21, 0.55, -0.12, 0.38, 0.67, -0.25, 0.42, 0.31],
  'Aggregate - Global': [0.48, 0.18, -0.10, 0.37, -0.22, 0.15, 0.28, -0.35, 0.12, 0.25, -0.18, 0.32],
  'Aggregate - US': [0.66, 0.10, -0.03, 0.57, -0.31, 0.22, 0.35, -0.42, 0.18, 0.33, -0.25, 0.41],
  'Asia Pacific ex Japan': [0.85, -1.36, 1.89, -1.90, 2.15, -0.85, 1.42, -1.65, 2.35, -1.12, 1.78, -0.95],
  'Cash - US': [0.14, 0.15, 0.15, 0.16, 0.16, 0.17, 0.17, 0.18, 0.18, 0.19, 0.19, 0.20],
  'Credit Directional HFs': [0.17, 0.24, 0.62, 0.00, 0.35, 0.48, -0.15, 0.52, 0.28, -0.08, 0.45, 0.22],
  'EM Debt': [-0.81, -1.49, 2.57, -2.32, 1.85, -0.95, 1.42, -1.78, 2.15, -1.25, 1.65, -0.88],
  'EM Equities': [-2.62, -4.54, 3.53, -3.77, 4.25, -2.15, 3.12, -3.45, 4.85, -2.85, 3.75, -2.42],
  'General Commodities': [1.76, -4.25, -2.51, -1.98, 3.25, -2.85, 1.95, -3.15, 2.45, -1.75, 1.85, -2.35],
  'Global ACWI EAFE': [-1.89, -1.57, 2.85, -2.24, 3.15, -1.45, 2.35, -1.95, 3.55, -1.65, 2.78, -1.35],
  'Global Equities ACWI': [0.47, -0.58, 3.07, 0.70, 2.85, -0.35, 2.15, -0.65, 3.25, -0.25, 2.55, 0.15],
  'Gold': [-1.27, -3.53, -2.33, -2.04, 1.85, -2.45, 0.95, -1.85, 2.35, -1.45, 1.25, -0.95],
  'Govt Bonds - Global': [-0.94, -0.12, -0.76, -0.09, 0.35, -0.45, 0.25, -0.55, 0.45, -0.35, 0.15, -0.25],
  'Govt Bonds - US': [0.77, 0.23, -0.47, 0.75, -0.35, 0.55, 0.15, -0.45, 0.65, -0.25, 0.35, 0.45],
  'Growth Directional HFs': [1.87, -0.83, -0.01, 0.58, 1.25, -0.45, 0.85, -0.35, 1.45, -0.15, 0.95, 0.25],
  'High Yield': [0.05, 0.10, 1.68, 0.71, 1.35, -0.25, 0.95, -0.45, 1.55, -0.15, 1.05, 0.35],
  'HY Muni Bond': [1.63, 0.35, 0.36, 0.53, 0.85, -0.15, 0.65, -0.25, 0.95, -0.05, 0.75, 0.25],
  'IG Corp': [0.44, -0.34, 0.74, 0.54, -0.15, 0.45, 0.25, -0.35, 0.55, -0.15, 0.35, 0.45],
  'IG Muni Bond': [1.25, 0.14, 0.15, 0.16, -0.05, 0.25, 0.15, -0.15, 0.35, -0.05, 0.25, 0.15],
  'Illiquid RE': [2.26, 2.61, 0.46, 1.75, 1.85, 0.95, 1.45, 0.65, 1.95, 0.75, 1.55, 0.85],
  'Infrastructure': [4.08, -0.48, 2.34, 0.16, 2.45, -0.85, 1.75, -0.65, 2.85, -0.55, 1.95, 0.25],
  'Japan Equities': [-1.48, -2.30, 1.07, -0.53, 2.15, -1.25, 1.65, -1.05, 2.55, -0.95, 1.85, -0.65],
  'Pan Europe': [-2.65, -1.25, 3.67, -3.11, 3.85, -1.75, 2.95, -2.15, 4.25, -1.55, 3.15, -1.25],
  'PE': [1.68, 0.71, 2.34, 2.13, 2.45, 0.95, 1.85, 0.65, 2.75, 0.55, 2.05, 0.85],
  'Private Debt': [0.34, 0.61, 1.26, 0.93, 1.15, 0.45, 0.85, 0.35, 1.25, 0.25, 0.95, 0.55],
  'REITs - Global': [2.34, 2.39, 0.90, 1.58, 2.85, -0.45, 2.15, -0.95, 3.25, -0.35, 2.45, 0.15],
  'US Equities': [3.06, -0.04, 3.70, 3.19, 2.95, 0.25, 2.35, 0.05, 3.45, 0.15, 2.65, 0.55],
};

/**
 * Calculate variance of an array
 */
function variance(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
}

/**
 * Calculate covariance between two arrays
 */
function covariance(arr1: number[], arr2: number[]): number {
  const mean1 = arr1.reduce((a, b) => a + b, 0) / arr1.length;
  const mean2 = arr2.reduce((a, b) => a + b, 0) / arr2.length;
  return arr1.reduce((sum, val, i) => sum + (val - mean1) * (arr2[i] - mean2), 0) / arr1.length;
}

/**
 * Calculate beta of asset relative to benchmark
 * Beta = Cov(asset, benchmark) / Var(benchmark)
 */
export function calculateBeta(assetReturns: number[], benchmarkReturns: number[]): number {
  const cov = covariance(assetReturns, benchmarkReturns);
  const benchVar = variance(benchmarkReturns);
  return benchVar === 0 ? 0 : cov / benchVar;
}

/**
 * Calculate beta matrix for all assets relative to a benchmark
 */
export function calculateBetaMatrix(
  benchmark: ReturnSeriesAsset = 'Global Equities ACWI'
): { asset: string; beta: number }[] {
  const benchmarkReturns = SAMPLE_RETURNS[benchmark];
  if (!benchmarkReturns) return [];

  return RETURN_SERIES_ASSETS
    .filter(asset => asset !== benchmark)
    .map(asset => ({
      asset,
      beta: calculateBeta(SAMPLE_RETURNS[asset], benchmarkReturns),
    }))
    .sort((a, b) => b.beta - a.beta);
}

/**
 * Get benchmark options for dropdown
 */
export const BENCHMARK_OPTIONS: ReturnSeriesAsset[] = [
  'Global Equities ACWI',
  'US Equities',
  'Global ACWI EAFE',
  'Aggregate - US',
  'Aggregate - Global',
];
