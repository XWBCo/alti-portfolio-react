/**
 * Monte Carlo Simulation Engine
 * Ported from Python (dashboard/apps/monte_carlo.py) to TypeScript
 * Enhanced with historical bootstrap option using real return series
 */

import type {
  SimulationParams,
  SimulationResult,
  SimulationProbabilities,
  PiecewiseParams
} from './types';

// Historical return series cache (populated via API)
let historicalReturnsCache: { assetClasses: string[]; returns: number[][] } | null = null;

/**
 * Set historical returns data (call from page after fetching from API)
 */
export function setHistoricalReturns(data: { assetClasses: string[]; returns: number[][] }) {
  historicalReturnsCache = data;
}

/**
 * Get available asset classes from historical data
 */
export function getAvailableAssetClasses(): string[] {
  return historicalReturnsCache?.assetClasses || [];
}

/**
 * Get historical returns for a specific asset class
 */
export function getHistoricalReturns(assetClass: string): number[] {
  if (!historicalReturnsCache) return [];
  const idx = historicalReturnsCache.assetClasses.indexOf(assetClass);
  if (idx === -1) return [];
  return historicalReturnsCache.returns.map(row => row[idx] / 100); // Convert % to decimal
}

/**
 * Bootstrap sample from historical returns
 */
function bootstrapSample(returns: number[], count: number): number[] {
  if (returns.length === 0) return new Array(count).fill(0);
  const samples: number[] = [];
  for (let i = 0; i < count; i++) {
    const randomIdx = Math.floor(Math.random() * returns.length);
    samples.push(returns[randomIdx]);
  }
  return samples;
}

/**
 * Calculate statistics from historical returns
 */
export function calculateHistoricalStats(assetClass: string): {
  mean: number;
  volatility: number;
  periods: number;
} | null {
  const returns = getHistoricalReturns(assetClass);
  if (returns.length === 0) return null;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);

  // Annualize (assuming monthly data)
  return {
    mean: mean * 12,
    volatility: volatility * Math.sqrt(12),
    periods: returns.length,
  };
}

/**
 * Generate normally distributed random numbers using Box-Muller transform
 */
function randomNormal(mean: number, stdDev: number, count: number): number[] {
  const results: number[] = [];
  for (let i = 0; i < count; i += 2) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    results.push(mean + stdDev * z0);
    if (i + 1 < count) {
      results.push(mean + stdDev * z1);
    }
  }
  return results.slice(0, count);
}

/**
 * Calculate percentile of an array
 */
function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
}

/**
 * Calculate median of an array
 */
function median(arr: number[]): number {
  return percentile(arr, 50);
}

/**
 * Run Monte Carlo simulation of portfolio evolution
 */
export function runSimulation(params: SimulationParams): SimulationResult {
  const {
    initialValue,
    annualReturn,
    annualVolatility,
    quarterlyFixedSpending,
    quarterlyPercentSpending,
    durationYears,
    numSimulations,
    inflationRate,
    afterTaxRate = 0,
    oneTimeSpend = 0,
    oneTimeQuarter = 1,
    customSpending = {},
  } = params;

  const numQuarters = durationYears * 4;
  // Apply after-tax rate (subtract tax drag from gross return)
  const netAnnualReturn = annualReturn - afterTaxRate;
  const quarterlyMean = Math.pow(1 + netAnnualReturn, 0.25) - 1;
  const quarterlyVol = annualVolatility / Math.sqrt(4);

  // Initialize paths array
  const paths: number[][] = [];
  for (let sim = 0; sim < numSimulations; sim++) {
    paths.push(new Array(numQuarters + 1).fill(0));
    paths[sim][0] = initialValue;
  }

  // Run simulation for each quarter
  for (let t = 1; t <= numQuarters; t++) {
    const randomReturns = randomNormal(quarterlyMean, quarterlyVol, numSimulations);

    for (let sim = 0; sim < numSimulations; sim++) {
      const prevValue = paths[sim][t - 1];

      // Calculate spending
      const baseSpending = quarterlyFixedSpending + (prevValue * quarterlyPercentSpending);
      const oneTimeAmount = t === oneTimeQuarter ? oneTimeSpend : 0;
      const customAmount = customSpending[t] || 0;
      const totalSpending = baseSpending + oneTimeAmount + customAmount;

      // Calculate new value
      const newValue = prevValue * (1 + randomReturns[sim]) - totalSpending;
      paths[sim][t] = Math.max(newValue, 0);  // Portfolio can't go negative
    }
  }

  // Calculate statistics
  const medianLine: number[] = [];
  const p25Line: number[] = [];
  const p75Line: number[] = [];
  const p5Line: number[] = [];
  const p95Line: number[] = [];
  const years: number[] = [];
  const inflationLine: number[] = [];
  const quarterlyInflation = inflationRate / 4;

  for (let t = 0; t <= numQuarters; t++) {
    const valuesAtT = paths.map(path => path[t]);
    medianLine.push(median(valuesAtT));
    p25Line.push(percentile(valuesAtT, 25));
    p75Line.push(percentile(valuesAtT, 75));
    p5Line.push(percentile(valuesAtT, 5));
    p95Line.push(percentile(valuesAtT, 95));
    years.push(t / 4);
    inflationLine.push(initialValue * Math.pow(1 + quarterlyInflation, t));
  }

  // Calculate final value statistics
  const finalValues = paths.map(path => path[numQuarters]);
  const inflationBenchmark = initialValue * Math.pow(1 + quarterlyInflation, numQuarters);

  const probabilities: SimulationProbabilities = {
    outperformInflation: finalValues.filter(v => v > inflationBenchmark).length / numSimulations,
    significantLoss: finalValues.filter(v => v < 0.5 * initialValue).length / numSimulations,
    portfolioDepletion: finalValues.filter(v => v === 0).length / numSimulations,
    maintainValue: finalValues.filter(v => v >= initialValue).length / numSimulations,
  };

  return {
    paths,
    median: medianLine,
    percentile25: p25Line,
    percentile75: p75Line,
    percentile5: p5Line,
    percentile95: p95Line,
    years,
    inflationLine,
    finalValues,
    probabilities,
  };
}

/**
 * Run Monte Carlo simulation with piecewise return/volatility changes
 */
export function runSimulationPiecewise(
  params: SimulationParams,
  piecewise: PiecewiseParams
): SimulationResult {
  const {
    initialValue,
    quarterlyFixedSpending,
    quarterlyPercentSpending,
    durationYears,
    numSimulations,
    inflationRate,
    afterTaxRate = 0,
    oneTimeSpend = 0,
    oneTimeQuarter = 1,
    customSpending = {},
  } = params;

  const {
    returnInitial,
    returnUpdate1,
    returnUpdate2,
    volInitial,
    volUpdate1,
    volUpdate2,
    update1Year,
    update2Year,
    startYear = new Date().getFullYear(),
  } = piecewise;

  const numQuarters = durationYears * 4;

  // Calculate threshold quarters
  const yearToQuarter = (year: number | undefined): number => {
    if (year === undefined) return numQuarters + 1;
    return Math.max(1, 4 * (year - startYear));
  };

  const u1Quarter = yearToQuarter(update1Year);
  const u2Quarter = Math.max(u1Quarter + 1, yearToQuarter(update2Year));

  // Apply after-tax rate to returns (subtract tax drag from gross returns)
  const netReturnInitial = returnInitial - afterTaxRate;
  const netReturnUpdate1 = (returnUpdate1 ?? returnInitial) - afterTaxRate;
  const netReturnUpdate2 = (returnUpdate2 ?? returnUpdate1 ?? returnInitial) - afterTaxRate;

  // Precompute quarterly parameters for each phase (using net returns)
  const phases = {
    initial: {
      mean: Math.pow(1 + netReturnInitial, 0.25) - 1,
      vol: volInitial / Math.sqrt(4),
    },
    update1: {
      mean: Math.pow(1 + netReturnUpdate1, 0.25) - 1,
      vol: (volUpdate1 ?? volInitial) / Math.sqrt(4),
    },
    update2: {
      mean: Math.pow(1 + netReturnUpdate2, 0.25) - 1,
      vol: (volUpdate2 ?? volUpdate1 ?? volInitial) / Math.sqrt(4),
    },
  };

  // Initialize paths
  const paths: number[][] = [];
  for (let sim = 0; sim < numSimulations; sim++) {
    paths.push(new Array(numQuarters + 1).fill(0));
    paths[sim][0] = initialValue;
  }

  // Run simulation
  for (let t = 1; t <= numQuarters; t++) {
    // Select phase parameters
    let phase: typeof phases.initial;
    if (t < u1Quarter) {
      phase = phases.initial;
    } else if (t < u2Quarter) {
      phase = phases.update1;
    } else {
      phase = phases.update2;
    }

    const randomReturns = randomNormal(phase.mean, phase.vol, numSimulations);

    for (let sim = 0; sim < numSimulations; sim++) {
      const prevValue = paths[sim][t - 1];
      const baseSpending = quarterlyFixedSpending + (prevValue * quarterlyPercentSpending);
      const oneTimeAmount = t === oneTimeQuarter ? oneTimeSpend : 0;
      const customAmount = customSpending[t] || 0;
      const totalSpending = baseSpending + oneTimeAmount + customAmount;

      const newValue = prevValue * (1 + randomReturns[sim]) - totalSpending;
      paths[sim][t] = Math.max(newValue, 0);
    }
  }

  // Calculate statistics (same as basic simulation)
  const medianLine: number[] = [];
  const p25Line: number[] = [];
  const p75Line: number[] = [];
  const p5Line: number[] = [];
  const p95Line: number[] = [];
  const years: number[] = [];
  const inflationLine: number[] = [];
  const quarterlyInflation = inflationRate / 4;

  for (let t = 0; t <= numQuarters; t++) {
    const valuesAtT = paths.map(path => path[t]);
    medianLine.push(median(valuesAtT));
    p25Line.push(percentile(valuesAtT, 25));
    p75Line.push(percentile(valuesAtT, 75));
    p5Line.push(percentile(valuesAtT, 5));
    p95Line.push(percentile(valuesAtT, 95));
    years.push(t / 4);
    inflationLine.push(initialValue * Math.pow(1 + quarterlyInflation, t));
  }

  const finalValues = paths.map(path => path[numQuarters]);
  const inflationBenchmark = initialValue * Math.pow(1 + quarterlyInflation, numQuarters);

  const probabilities: SimulationProbabilities = {
    outperformInflation: finalValues.filter(v => v > inflationBenchmark).length / numSimulations,
    significantLoss: finalValues.filter(v => v < 0.5 * initialValue).length / numSimulations,
    portfolioDepletion: finalValues.filter(v => v === 0).length / numSimulations,
    maintainValue: finalValues.filter(v => v >= initialValue).length / numSimulations,
  };

  return {
    paths,
    median: medianLine,
    percentile25: p25Line,
    percentile75: p75Line,
    percentile5: p5Line,
    percentile95: p95Line,
    years,
    inflationLine,
    finalValues,
    probabilities,
  };
}

/**
 * Run Monte Carlo simulation with historical bootstrap
 * Uses actual historical returns instead of parametric normal distribution
 */
export function runSimulationBootstrap(
  params: SimulationParams,
  assetClass: string
): SimulationResult {
  const {
    initialValue,
    quarterlyFixedSpending,
    quarterlyPercentSpending,
    durationYears,
    numSimulations,
    inflationRate,
    afterTaxRate = 0,
    oneTimeSpend = 0,
    oneTimeQuarter = 1,
    customSpending = {},
  } = params;

  const historicalReturns = getHistoricalReturns(assetClass);

  // If no historical data, fall back to normal simulation
  if (historicalReturns.length === 0) {
    return runSimulation(params);
  }

  const numQuarters = durationYears * 4;
  // Convert annual after-tax rate to quarterly for bootstrap
  const quarterlyAfterTax = Math.pow(1 + afterTaxRate, 0.25) - 1;

  // Initialize paths
  const paths: number[][] = [];
  for (let sim = 0; sim < numSimulations; sim++) {
    paths.push(new Array(numQuarters + 1).fill(0));
    paths[sim][0] = initialValue;
  }

  // Run simulation using bootstrap samples
  for (let t = 1; t <= numQuarters; t++) {
    // Bootstrap sample from historical monthly returns, convert to quarterly
    const monthlyReturns = bootstrapSample(historicalReturns, numSimulations * 3);

    for (let sim = 0; sim < numSimulations; sim++) {
      const prevValue = paths[sim][t - 1];

      // Compound 3 monthly returns into 1 quarterly return
      const m1 = monthlyReturns[sim * 3];
      const m2 = monthlyReturns[sim * 3 + 1];
      const m3 = monthlyReturns[sim * 3 + 2];
      // Apply after-tax drag to the quarterly return
      const quarterlyReturn = (1 + m1) * (1 + m2) * (1 + m3) - 1 - quarterlyAfterTax;

      // Calculate spending
      const baseSpending = quarterlyFixedSpending + (prevValue * quarterlyPercentSpending);
      const oneTimeAmount = t === oneTimeQuarter ? oneTimeSpend : 0;
      const customAmount = customSpending[t] || 0;
      const totalSpending = baseSpending + oneTimeAmount + customAmount;

      // Calculate new value
      const newValue = prevValue * (1 + quarterlyReturn) - totalSpending;
      paths[sim][t] = Math.max(newValue, 0);
    }
  }

  // Calculate statistics
  const medianLine: number[] = [];
  const p25Line: number[] = [];
  const p75Line: number[] = [];
  const p5Line: number[] = [];
  const p95Line: number[] = [];
  const years: number[] = [];
  const inflationLine: number[] = [];
  const quarterlyInflation = inflationRate / 4;

  for (let t = 0; t <= numQuarters; t++) {
    const valuesAtT = paths.map(path => path[t]);
    medianLine.push(median(valuesAtT));
    p25Line.push(percentile(valuesAtT, 25));
    p75Line.push(percentile(valuesAtT, 75));
    p5Line.push(percentile(valuesAtT, 5));
    p95Line.push(percentile(valuesAtT, 95));
    years.push(t / 4);
    inflationLine.push(initialValue * Math.pow(1 + quarterlyInflation, t));
  }

  const finalValues = paths.map(path => path[numQuarters]);
  const inflationBenchmark = initialValue * Math.pow(1 + quarterlyInflation, numQuarters);

  const probabilities: SimulationProbabilities = {
    outperformInflation: finalValues.filter(v => v > inflationBenchmark).length / numSimulations,
    significantLoss: finalValues.filter(v => v < 0.5 * initialValue).length / numSimulations,
    portfolioDepletion: finalValues.filter(v => v === 0).length / numSimulations,
    maintainValue: finalValues.filter(v => v >= initialValue).length / numSimulations,
  };

  return {
    paths,
    median: medianLine,
    percentile25: p25Line,
    percentile75: p75Line,
    percentile5: p5Line,
    percentile95: p95Line,
    years,
    inflationLine,
    finalValues,
    probabilities,
  };
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Format percentage value
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
