/**
 * Portfolio Mapper Utilities
 * Maps security-level holdings to asset class allocations
 */

import type { PortfolioHoldings } from './portfolio-types';
import type { Portfolio, SecurityMetadata } from './data-loader';

// Tier3 to Asset Class mapping (aligns with CMA asset classes)
const TIER3_TO_ASSET_CLASS: Record<string, string> = {
  'Equity': 'US EQUITIES',
  'Investment Grade Bonds': 'GLOBAL BONDS',
  'Credit': 'HIGH YIELD',
  'Absolute Return': 'ABSOLUTE RETURN HFS',
  'Real Assets': 'INFRASTRUCTURE',
  'Alternative Growth': 'PRIVATE EQUITY',
  'Cash & Cash Equivalents': 'CASH',
  'Private Debt': 'PRIVATE DEBT',
  'Private Equity': 'PRIVATE EQUITY',
  'Alternative Credit': 'HIGH YIELD',
  'Commodities': 'GENERAL COMMODITIES',
  'Mixed Allocation': 'DIVERSIFIED',
  '-': 'OTHER',
};

// Fallback mapping by security name patterns
function inferAssetClass(securityName: string): string {
  const name = securityName.toUpperCase();

  if (name.includes('EQUITY') || name.includes('STOCK') || name.includes('S&P') || name.includes('ACWI')) {
    return 'US EQUITIES';
  }
  if (name.includes('BOND') || name.includes('TREASURY') || name.includes('GOVT')) {
    return 'GLOBAL BONDS';
  }
  if (name.includes('HIGH YIELD') || name.includes('HY ')) {
    return 'HIGH YIELD';
  }
  if (name.includes('GOLD')) {
    return 'GOLD';
  }
  if (name.includes('BITCOIN') || name.includes('CRYPTO')) {
    return 'BITCOIN';
  }
  if (name.includes('COMMODITY') || name.includes('OIL') || name.includes('URANIUM')) {
    return 'GENERAL COMMODITIES';
  }
  if (name.includes('REAL ESTATE') || name.includes('REIT')) {
    return 'REITS';
  }
  if (name.includes('INFRASTRUCTURE')) {
    return 'INFRASTRUCTURE';
  }
  if (name.includes('CASH') || name.includes('MONEY MARKET') || name.includes('LIQUIDITY')) {
    return 'CASH';
  }
  if (name.includes('PRIVATE DEBT') || name.includes('TRADE FINANCE')) {
    return 'PRIVATE DEBT';
  }
  if (name.includes('PRIVATE EQUITY') || name.includes('PE ')) {
    return 'PRIVATE EQUITY';
  }
  if (name.includes('EMERGING') || name.includes('EM ')) {
    return 'EM EQUITIES';
  }

  return 'OTHER';
}

/**
 * Map API portfolio to PortfolioHoldings format
 * Aggregates security-level holdings to asset class allocations
 */
export function mapPortfolioToAllocations(
  portfolio: Portfolio,
  metadata?: SecurityMetadata[]
): PortfolioHoldings {
  const allocations: Record<string, number> = {};

  // Build metadata lookup
  const metadataMap = new Map<string, SecurityMetadata>();
  if (metadata) {
    for (const m of metadata) {
      metadataMap.set(m.security, m);
      metadataMap.set(m.tier4, m);
    }
  }

  for (const holding of portfolio.holdings) {
    let assetClass: string;

    // Try to find metadata for this security
    const meta = metadataMap.get(holding.security);

    if (meta && meta.tier3 && meta.tier3 !== '-') {
      assetClass = TIER3_TO_ASSET_CLASS[meta.tier3] || meta.tier3.toUpperCase();
    } else {
      // Fallback to inference from name
      assetClass = inferAssetClass(holding.security);
    }

    // Aggregate by asset class
    allocations[assetClass] = (allocations[assetClass] || 0) + holding.weight;
  }

  return {
    name: portfolio.name,
    allocations,
  };
}

/**
 * Map multiple portfolios
 */
export function mapPortfoliosToAllocations(
  portfolios: Portfolio[],
  metadata?: SecurityMetadata[]
): PortfolioHoldings[] {
  return portfolios.map(p => mapPortfolioToAllocations(p, metadata));
}

/**
 * Get portfolio summary statistics
 */
export function getPortfolioSummary(portfolio: Portfolio): {
  holdingsCount: number;
  totalWeight: number;
  topHoldings: { security: string; weight: number }[];
} {
  const sorted = [...portfolio.holdings].sort((a, b) => b.weight - a.weight);

  return {
    holdingsCount: portfolio.holdings.length,
    totalWeight: portfolio.totalWeight,
    topHoldings: sorted.slice(0, 5),
  };
}
