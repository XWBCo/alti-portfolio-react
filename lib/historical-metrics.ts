/**
 * Historical Metrics Calculator
 * Calculates historical performance metrics for portfolios
 */

export interface HistoricalMetrics {
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  sortinoRatio: number;
  informationRatio: number | null;
}

/**
 * Calculate annualized return from monthly returns
 */
export function calculateAnnualizedReturn(monthlyReturns: number[]): number {
  if (monthlyReturns.length === 0) return 0;

  const cumulativeReturn = monthlyReturns.reduce((acc, r) => acc * (1 + r), 1);
  const years = monthlyReturns.length / 12;
  return Math.pow(cumulativeReturn, 1 / years) - 1;
}

/**
 * Calculate annualized volatility from monthly returns
 */
export function calculateAnnualizedVolatility(monthlyReturns: number[]): number {
  if (monthlyReturns.length < 2) return 0;

  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const variance = monthlyReturns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (monthlyReturns.length - 1);
  const monthlyVol = Math.sqrt(variance);
  return monthlyVol * Math.sqrt(12); // Annualize
}

/**
 * Calculate Sharpe Ratio
 */
export function calculateSharpeRatio(
  annualizedReturn: number,
  annualizedVolatility: number,
  riskFreeRate: number = 0.03
): number {
  if (annualizedVolatility === 0) return 0;
  return (annualizedReturn - riskFreeRate) / annualizedVolatility;
}

/**
 * Calculate Maximum Drawdown
 */
export function calculateMaxDrawdown(monthlyReturns: number[]): number {
  if (monthlyReturns.length === 0) return 0;

  let peak = 1;
  let maxDD = 0;
  let cumulative = 1;

  for (const r of monthlyReturns) {
    cumulative *= (1 + r);
    if (cumulative > peak) {
      peak = cumulative;
    }
    const drawdown = (peak - cumulative) / peak;
    if (drawdown > maxDD) {
      maxDD = drawdown;
    }
  }

  return maxDD;
}

/**
 * Calculate Calmar Ratio (annualized return / max drawdown)
 */
export function calculateCalmarRatio(annualizedReturn: number, maxDrawdown: number): number {
  if (maxDrawdown === 0) return 0;
  return annualizedReturn / maxDrawdown;
}

/**
 * Calculate Sortino Ratio (return vs downside deviation)
 */
export function calculateSortinoRatio(
  monthlyReturns: number[],
  riskFreeRate: number = 0.03
): number {
  if (monthlyReturns.length < 2) return 0;

  const monthlyRf = Math.pow(1 + riskFreeRate, 1/12) - 1;
  const excessReturns = monthlyReturns.map(r => r - monthlyRf);
  const negativeReturns = excessReturns.filter(r => r < 0);

  if (negativeReturns.length === 0) return 0;

  const downsideVariance = negativeReturns.reduce((acc, r) => acc + r * r, 0) / negativeReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(12);

  if (downsideDeviation === 0) return 0;

  const annualizedReturn = calculateAnnualizedReturn(monthlyReturns);
  return (annualizedReturn - riskFreeRate) / downsideDeviation;
}

/**
 * Calculate Information Ratio (vs benchmark)
 */
export function calculateInformationRatio(
  portfolioReturns: number[],
  benchmarkReturns: number[]
): number | null {
  if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 2) {
    return null;
  }

  const activeReturns = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
  const meanActive = activeReturns.reduce((a, b) => a + b, 0) / activeReturns.length;
  const trackingVariance = activeReturns.reduce((acc, r) => acc + Math.pow(r - meanActive, 2), 0) / (activeReturns.length - 1);
  const trackingError = Math.sqrt(trackingVariance) * Math.sqrt(12);

  if (trackingError === 0) return null;

  const annualizedActiveReturn = meanActive * 12;
  return annualizedActiveReturn / trackingError;
}

/**
 * Calculate all historical metrics
 */
export function calculateHistoricalMetrics(
  monthlyReturns: number[],
  benchmarkReturns?: number[],
  riskFreeRate: number = 0.03
): HistoricalMetrics {
  const annualizedReturn = calculateAnnualizedReturn(monthlyReturns);
  const annualizedVolatility = calculateAnnualizedVolatility(monthlyReturns);
  const sharpeRatio = calculateSharpeRatio(annualizedReturn, annualizedVolatility, riskFreeRate);
  const maxDrawdown = calculateMaxDrawdown(monthlyReturns);
  const calmarRatio = calculateCalmarRatio(annualizedReturn, maxDrawdown);
  const sortinoRatio = calculateSortinoRatio(monthlyReturns, riskFreeRate);
  const informationRatio = benchmarkReturns
    ? calculateInformationRatio(monthlyReturns, benchmarkReturns)
    : null;

  return {
    annualizedReturn,
    annualizedVolatility,
    sharpeRatio,
    maxDrawdown,
    calmarRatio,
    sortinoRatio,
    informationRatio,
  };
}

/**
 * Generate simulated historical returns for demonstration
 * In production, this would load actual return series data
 */
export function generateSimulatedReturns(
  expectedReturn: number,
  expectedRisk: number,
  months: number = 60
): number[] {
  const monthlyReturn = Math.pow(1 + expectedReturn, 1/12) - 1;
  const monthlyVol = expectedRisk / Math.sqrt(12);

  const returns: number[] = [];
  for (let i = 0; i < months; i++) {
    // Box-Muller for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    returns.push(monthlyReturn + monthlyVol * z);
  }

  return returns;
}
