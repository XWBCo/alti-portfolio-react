// ESG Score Calculator - Weighted Average Calculations

import type { ESGScore, PortfolioHolding, WeightedESGResult } from './types';

export function calculateWeightedESG(
  holdings: PortfolioHolding[],
  isinScores: Map<string, ESGScore>,
  cusipScores: Map<string, ESGScore>
): WeightedESGResult {
  let totalValue = 0;
  let coveredValue = 0;

  let weightedEnv = 0;
  let weightedSoc = 0;
  let weightedGov = 0;

  const holdingsWithScores: Array<PortfolioHolding & { esgScore: ESGScore | null }> = [];

  for (const holding of holdings) {
    totalValue += holding.value;

    // Try ISIN first, then CUSIP
    let score: ESGScore | null = null;

    if (holding.isin && isinScores.has(holding.isin)) {
      score = isinScores.get(holding.isin)!;
    } else if (holding.cusip && cusipScores.has(holding.cusip)) {
      score = cusipScores.get(holding.cusip)!;
    }

    holdingsWithScores.push({ ...holding, esgScore: score });

    if (score && score.overallScore !== null) {
      coveredValue += holding.value;

      if (score.environmentalScore !== null) {
        weightedEnv += holding.value * score.environmentalScore;
      }
      if (score.socialScore !== null) {
        weightedSoc += holding.value * score.socialScore;
      }
      if (score.governanceScore !== null) {
        weightedGov += holding.value * score.governanceScore;
      }
    }
  }

  const coverage = totalValue > 0 ? (coveredValue / totalValue) * 100 : 0;

  // Calculate weighted averages (only on covered value)
  const envScore = coveredValue > 0 ? weightedEnv / coveredValue : null;
  const socScore = coveredValue > 0 ? weightedSoc / coveredValue : null;
  const govScore = coveredValue > 0 ? weightedGov / coveredValue : null;

  // Overall is average of E, S, G
  const validScores = [envScore, socScore, govScore].filter(s => s !== null) as number[];
  const overallScore = validScores.length > 0
    ? validScores.reduce((a, b) => a + b, 0) / validScores.length
    : null;

  return {
    totalValue,
    coveredValue,
    coverage,
    overallScore: overallScore !== null ? Math.round(overallScore * 10) / 10 : null,
    environmentalScore: envScore !== null ? Math.round(envScore * 10) / 10 : null,
    socialScore: socScore !== null ? Math.round(socScore * 10) / 10 : null,
    governanceScore: govScore !== null ? Math.round(govScore * 10) / 10 : null,
    holdings: holdingsWithScores,
  };
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function getESGRating(score: number | null): string {
  if (score === null) return 'N/A';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 50) return 'Below Average';
  return 'Poor';
}

export function getESGColor(score: number | null): string {
  if (score === null) return '#9CA3AF'; // Gray
  if (score >= 80) return '#10B981'; // Green
  if (score >= 70) return '#34D399'; // Light green
  if (score >= 60) return '#FBBF24'; // Yellow
  if (score >= 50) return '#F97316'; // Orange
  return '#EF4444'; // Red
}
