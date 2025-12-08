/**
 * Clarity AI Score Fetching
 * ESG Impact, Climate/TCFD, SDG, Exposures
 */

import { clarityGet } from './client';
import type {
  EsgImpactSummaryResponse,
  EsgImpactScoresByIdResponse,
  TcfdValuesResponse,
  SdgSummaryResponse,
  ExposuresResponse,
} from './types';

// ============================================
// ESG Impact
// ============================================

/**
 * Get ESG Impact summary (Total ESG, E, S, G scores)
 * Rate Limit: 4,000 req/min
 */
export async function getEsgImpactSummary(
  portfolioId: string
): Promise<EsgImpactSummaryResponse> {
  return clarityGet<EsgImpactSummaryResponse>(
    `/public/portfolios/${portfolioId}/esg-impact/summary`
  );
}

/**
 * Get specific ESG Impact scores by ID
 * Rate Limit: 4,000 req/min
 */
export async function getEsgImpactScoresById(
  portfolioId: string,
  scoreIds: string[]
): Promise<EsgImpactScoresByIdResponse> {
  return clarityGet<EsgImpactScoresByIdResponse>(
    `/public/portfolios/${portfolioId}/esg-impact/scores-by-id`,
    { scoreId: scoreIds }
  );
}

// ============================================
// Climate / TCFD
// ============================================

/**
 * Get TCFD (Task Force on Climate-related Financial Disclosures) values
 * Rate Limit: 1,000 req/min
 */
export async function getTcfdValues(
  portfolioId: string,
  valueIds?: string[]
): Promise<TcfdValuesResponse> {
  const params: Record<string, string | string[]> = {};
  if (valueIds?.length) {
    params.valueId = valueIds;
  }

  return clarityGet<TcfdValuesResponse>(
    `/public/portfolios/${portfolioId}/tcfd/values-by-id`,
    params
  );
}

// ============================================
// SDG (Sustainable Development Goals)
// ============================================

/**
 * Get SDG alignment summary
 * Rate Limit: 1,500 req/min
 */
export async function getSdgSummary(
  portfolioId: string
): Promise<SdgSummaryResponse> {
  return clarityGet<SdgSummaryResponse>(
    `/public/portfolios/${portfolioId}/sdg/summary`
  );
}

// ============================================
// Exposures
// ============================================

/**
 * Get portfolio exposures (underlying positions with scores)
 * Rate Limit: 3,500 req/min
 */
export async function getExposures(
  portfolioId: string
): Promise<ExposuresResponse> {
  return clarityGet<ExposuresResponse>(
    `/public/portfolios/${portfolioId}/exposures/exposures-by-id`
  );
}

// ============================================
// Aggregated Fetch
// ============================================

export interface AllScoresResult {
  esgImpact: EsgImpactSummaryResponse;
  tcfd: TcfdValuesResponse;
  sdg: SdgSummaryResponse;
  exposures: ExposuresResponse;
}

/**
 * Fetch all scores for a portfolio
 * Runs ESG Impact first, then Climate + SDG in parallel, then Exposures
 */
export async function getAllScores(portfolioId: string): Promise<AllScoresResult> {
  // Phase 1: ESG Impact (most important, show first)
  const esgImpact = await getEsgImpactSummary(portfolioId);

  // Phase 2: Climate + SDG in parallel
  const [tcfd, sdg] = await Promise.all([
    getTcfdValues(portfolioId),
    getSdgSummary(portfolioId),
  ]);

  // Phase 3: Exposures (detailed breakdown)
  const exposures = await getExposures(portfolioId);

  return { esgImpact, tcfd, sdg, exposures };
}

// ============================================
// Score Extraction Helpers
// ============================================

/**
 * Extract overall ESG score from summary response
 */
export function extractOverallEsgScore(
  response: EsgImpactSummaryResponse
): number | null {
  const esgScore = response.scores.find(
    s => s.treeLevel === 'TOTAL' && s.id === 'ESG'
  );
  return esgScore?.score ?? null;
}

/**
 * Extract pillar scores (E, S, G) from summary response
 */
export function extractPillarScores(
  response: EsgImpactSummaryResponse
): { environmental: number | null; social: number | null; governance: number | null } {
  const findPillar = (id: string) =>
    response.scores.find(s => s.treeLevel === 'PILLAR' && s.id === id)?.score ?? null;

  return {
    environmental: findPillar('ENVIRONMENTAL'),
    social: findPillar('SOCIAL'),
    governance: findPillar('GOVERNANCE'),
  };
}

/**
 * Extract temperature rating from TCFD values
 */
export function extractTemperatureRating(
  response: TcfdValuesResponse
): number | null {
  const tempRating = response.values.find(
    v => v.id.includes('TEMP_RATING') || v.id.includes('TEMPERATURE')
  );
  return tempRating?.value ?? null;
}

/**
 * Extract net zero coverage from TCFD values
 */
export function extractNetZeroCoverage(
  response: TcfdValuesResponse
): number | null {
  const netZero = response.values.find(
    v => v.id.includes('NET_ZERO') || v.id.includes('NETZERO')
  );
  return netZero?.value ?? null;
}
