/**
 * SSE Endpoint for Portfolio Analysis
 *
 * Streams real-time progress updates as scores are fetched from Clarity AI.
 * Uses Server-Sent Events for efficient unidirectional streaming.
 */

import { NextRequest } from 'next/server';
import {
  createAndWaitForPortfolio,
  getAllScores,
  deletePortfolio,
  extractOverallEsgScore,
  extractPillarScores,
  extractTemperatureRating,
  extractNetZeroCoverage,
} from '@/lib/clarity-api';
import type { Holding, StreamEvent } from '@/lib/clarity-api/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to encode SSE data
function encodeSSE(data: StreamEvent): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const holdingsRaw = searchParams.get('holdings');
  const portfolioName = searchParams.get('name') || 'Portfolio Analysis';

  if (!holdingsRaw) {
    return new Response(
      encodeSSE({ stage: 'error', progress: 0, error: 'Missing holdings parameter' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      }
    );
  }

  let holdings: Holding[];
  try {
    holdings = JSON.parse(holdingsRaw);
  } catch {
    return new Response(
      encodeSSE({ stage: 'error', progress: 0, error: 'Invalid holdings JSON' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (data: StreamEvent) => {
        controller.enqueue(encoder.encode(encodeSSE(data)));
      };

      let portfolioId: string | null = null;

      try {
        // Stage 1: Creating portfolio in Clarity AI
        emit({ stage: 'creating', progress: 0.1 });

        // Check for CLARITY_AI env vars - if not present, use mock mode
        const useMock = !process.env.CLARITY_AI_KEY || !process.env.CLARITY_AI_SECRET;

        if (useMock) {
          // Mock mode for development/demo
          await mockAnalysis(emit, holdings, portfolioName);
        } else {
          // Real Clarity AI integration
          await realAnalysis(emit, holdings, portfolioName);
        }

        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        emit({ stage: 'error', progress: 0, error: message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// Mock analysis for development/demo (no Clarity AI credentials)
async function mockAnalysis(
  emit: (data: StreamEvent) => void,
  holdings: Holding[],
  portfolioName: string
) {
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Stage 1: Creating
  await delay(800);
  emit({ stage: 'processing', progress: 0.2, data: { positionCount: holdings.length } });

  // Stage 2: Processing
  await delay(600);
  emit({ stage: 'esg_impact', progress: 0.4 });

  // Stage 3: ESG Impact
  await delay(1000);
  const mockEsgImpact = {
    portfolioName,
    totalOrganizations: holdings.length,
    coverageOrganizations: Math.floor(holdings.length * 0.92),
    coverageWeight: 0.94,
    totalCompanies: holdings.length * 45,
    esgImpactCoverage: 0.89,
    scores: [
      { id: 'ESG', pillar: 'ESG', treeLevel: 'TOTAL' as const, score: 76, metadata: 'NONE' as const },
      { id: 'ENVIRONMENTAL', pillar: 'ENVIRONMENTAL', treeLevel: 'PILLAR' as const, score: 74, metadata: 'NONE' as const },
      { id: 'SOCIAL', pillar: 'SOCIAL', treeLevel: 'PILLAR' as const, score: 72, metadata: 'NONE' as const },
      { id: 'GOVERNANCE', pillar: 'GOVERNANCE', treeLevel: 'PILLAR' as const, score: 81, metadata: 'NONE' as const },
    ],
  };
  emit({
    stage: 'climate',
    progress: 0.6,
    data: { esgImpact: mockEsgImpact },
  });

  // Stage 4: Climate + SDG
  await delay(800);
  const mockTcfd = {
    portfolioName,
    values: [
      { id: 'TEMPERATURE_RATING', value: 1.8, unit: 'C' },
      { id: 'NET_ZERO_COVERAGE', value: 67, unit: '%' },
      { id: 'CARBON_INTENSITY', value: 142.5, unit: 'tCO2e/M$' },
    ],
    coverage: 0.87,
  };
  const mockSdg = {
    portfolioName,
    sdgScores: [
      { sdgId: 7, sdgName: 'Affordable and Clean Energy', positiveRevenue: 12.4, negativeRevenue: 2.1, netRevenue: 10.3 },
      { sdgId: 13, sdgName: 'Climate Action', positiveRevenue: 8.7, negativeRevenue: 1.5, netRevenue: 7.2 },
      { sdgId: 3, sdgName: 'Good Health and Well-being', positiveRevenue: 15.2, negativeRevenue: 0.8, netRevenue: 14.4 },
    ],
    totalPositiveRevenue: 36.3,
    totalNegativeRevenue: 4.4,
  };
  emit({
    stage: 'exposures',
    progress: 0.85,
    data: { tcfd: mockTcfd, sdg: mockSdg },
  });

  // Stage 5: Exposures
  await delay(600);
  const mockExposures = {
    portfolioName,
    exposures: holdings.slice(0, 50).map((h, i) => ({
      securityId: h.id,
      securityName: h.name,
      weight: h.weight,
      esgScore: 70 + Math.floor(Math.random() * 20),
      environmentalScore: 65 + Math.floor(Math.random() * 25),
      socialScore: 68 + Math.floor(Math.random() * 20),
      governanceScore: 75 + Math.floor(Math.random() * 15),
      climateRating: 1.5 + Math.random() * 1.2,
    })),
    totalWeight: 1,
  };

  // Complete
  emit({
    stage: 'complete',
    progress: 1,
    data: {
      portfolioId: `mock-${Date.now()}`,
      portfolioName,
      positionCount: holdings.length,
      esgImpact: mockEsgImpact,
      tcfd: mockTcfd,
      sdg: mockSdg,
      exposures: mockExposures,
    },
  });
}

// Real Clarity AI analysis
async function realAnalysis(
  emit: (data: StreamEvent) => void,
  holdings: Holding[],
  portfolioName: string
) {
  // Convert holdings to Clarity API format
  const clarityHoldings = holdings.map((h) => ({
    id: h.id,
    idType: h.idType,
    name: h.name,
    ticker: h.ticker,
    weight: h.weight,
    type: h.type,
  }));

  // Stage 1 & 2: Create portfolio and wait for processing
  const portfolio = await createAndWaitForPortfolio(clarityHoldings, portfolioName);
  emit({
    stage: 'processing',
    progress: 0.2,
    data: { positionCount: holdings.length },
  });

  emit({ stage: 'esg_impact', progress: 0.4 });

  // Stage 3-5: Fetch all scores
  const scores = await getAllScores(portfolio.id);

  // Extract key metrics for preview
  const esgScore = extractOverallEsgScore(scores.esgImpact);
  const pillarScores = extractPillarScores(scores.esgImpact);
  const tempRating = extractTemperatureRating(scores.tcfd);
  const netZero = extractNetZeroCoverage(scores.tcfd);

  emit({
    stage: 'climate',
    progress: 0.6,
    data: { esgImpact: scores.esgImpact },
  });

  emit({
    stage: 'exposures',
    progress: 0.85,
    data: { tcfd: scores.tcfd, sdg: scores.sdg },
  });

  // Complete
  emit({
    stage: 'complete',
    progress: 1,
    data: {
      portfolioId: portfolio.id,
      portfolioName,
      positionCount: holdings.length,
      esgImpact: scores.esgImpact,
      tcfd: scores.tcfd,
      sdg: scores.sdg,
      exposures: scores.exposures,
    },
  });

  // Clean up: delete portfolio from Clarity AI (optional)
  // await deletePortfolio(portfolio.id);
}
