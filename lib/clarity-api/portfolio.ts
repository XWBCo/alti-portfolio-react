/**
 * Clarity AI Portfolio Management
 */

import { clarityGet, clarityPost, clarityDelete, delay } from './client';
import type {
  CreatePortfolioRequest,
  PortfolioResponse,
  Holding,
  PortfolioTotal,
} from './types';

/**
 * Create a portfolio in Clarity AI
 * Rate Limit: 10,000 req/min
 */
export async function createPortfolio(
  holdings: Holding[],
  name?: string
): Promise<PortfolioResponse> {
  const portfolioName = name || `AlTi Analysis - ${new Date().toISOString()}`;

  const request: CreatePortfolioRequest = {
    name: portfolioName,
    securitiesWeightDistribution: 'PERCENTAGE',
    securities: holdings.map(h => ({
      id: h.id,
      idType: h.idType,
      percentage: h.weight * 100, // Convert 0.032 → 3.2
    })),
    total: {
      value: 1000000, // Nominal value
      currency: 'USD',
    },
  };

  return clarityPost<PortfolioResponse>('/public/portfolios', request);
}

/**
 * Get portfolio details
 * Rate Limit: 5,000 req/min
 */
export async function getPortfolio(portfolioId: string): Promise<PortfolioResponse> {
  return clarityGet<PortfolioResponse>(`/public/portfolios/${portfolioId}`);
}

/**
 * Delete a portfolio from Clarity AI
 * Rate Limit: 10,000 req/min
 */
export async function deletePortfolio(portfolioId: string): Promise<void> {
  await clarityDelete(`/public/portfolios/${portfolioId}`);
}

/**
 * Wait for portfolio to be ready (status = CREATED)
 * Polls every 500ms until ready or timeout
 */
export async function waitForPortfolioReady(
  portfolioId: string,
  timeoutMs: number = 30000,
  pollIntervalMs: number = 500
): Promise<PortfolioResponse> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const portfolio = await getPortfolio(portfolioId);

    switch (portfolio.status) {
      case 'CREATED':
        return portfolio;

      case 'REJECTED':
        throw new Error(`Portfolio rejected: ${portfolio.cause || 'Unknown reason'}`);

      case 'DRAFT':
      case 'UPDATING':
        // Still processing, wait and retry
        await delay(pollIntervalMs);
        break;

      default:
        throw new Error(`Unknown portfolio status: ${portfolio.status}`);
    }
  }

  throw new Error(`Portfolio creation timed out after ${timeoutMs}ms`);
}

/**
 * Create portfolio and wait for it to be ready
 */
export async function createAndWaitForPortfolio(
  holdings: Holding[],
  name?: string
): Promise<PortfolioResponse> {
  const portfolio = await createPortfolio(holdings, name);
  return waitForPortfolioReady(portfolio.id);
}
