/**
 * Portfolio Model Types & Data
 * Based on Investment Objectives December 2025
 */

export type RiskProfileId =
  | 'conservative'
  | 'balanced'
  | 'moderate_growth'
  | 'growth'
  | 'long_term_growth';

export type PortfolioType = 'traditional' | 'endowment';

export interface RiskProfile {
  id: RiskProfileId;
  name: string;
  growthPercentage: number;
  stabilityPercentage: number;
  tailRisk: string;
  cpiPlus: number;
  benchmark: string;
  description: string;
}

export interface AllocationBand {
  min: number;
  max: number;
}

export interface RiskProfileBands {
  stability: AllocationBand;
  diversified: AllocationBand;
  growth: AllocationBand;
}

export interface AssetAllocation {
  category: string;
  subcategory: string;
  fund: string;
  ticker?: string;
  allocation: number;
  secondary?: string;
}

export interface PortfolioModel {
  riskProfile: RiskProfileId;
  portfolioType: PortfolioType;
  allocations: AssetAllocation[];
  totalStability: number;
  totalDiversified: number;
  totalGrowth: number;
}

// Risk Profile Definitions
export const RISK_PROFILES: Record<RiskProfileId, RiskProfile> = {
  conservative: {
    id: 'conservative',
    name: 'Conservative',
    growthPercentage: 30,
    stabilityPercentage: 70,
    tailRisk: '-10% to -12%',
    cpiPlus: 2,
    benchmark: '30/70 ACWI/Muni',
    description: 'Capital preservation with modest growth potential',
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    growthPercentage: 50,
    stabilityPercentage: 50,
    tailRisk: '-14% to -16%',
    cpiPlus: 3,
    benchmark: '50/50 ACWI/Muni',
    description: 'Equal balance between growth and stability',
  },
  moderate_growth: {
    id: 'moderate_growth',
    name: 'Moderate Growth',
    growthPercentage: 60,
    stabilityPercentage: 40,
    tailRisk: '-16% to -18%',
    cpiPlus: 4,
    benchmark: '60/40 ACWI/Muni',
    description: 'Growth-oriented with meaningful downside protection',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    growthPercentage: 70,
    stabilityPercentage: 30,
    tailRisk: '-18% to -20%',
    cpiPlus: 5,
    benchmark: '70/30 ACWI/Muni',
    description: 'Emphasis on long-term capital appreciation',
  },
  long_term_growth: {
    id: 'long_term_growth',
    name: 'Long-Term Growth',
    growthPercentage: 80,
    stabilityPercentage: 20,
    tailRisk: '-23% to -25%',
    cpiPlus: 6,
    benchmark: '80/20 ACWI/Muni',
    description: 'Maximum growth potential for extended time horizons',
  },
};

// Allocation Bands (SAA-TAA)
export const ALLOCATION_BANDS: Record<RiskProfileId, RiskProfileBands> = {
  conservative: {
    stability: { min: 0.35, max: 0.55 },
    diversified: { min: 0.10, max: 0.30 },
    growth: { min: 0.20, max: 0.40 },
  },
  balanced: {
    stability: { min: 0.20, max: 0.40 },
    diversified: { min: 0.10, max: 0.30 },
    growth: { min: 0.40, max: 0.60 },
  },
  moderate_growth: {
    stability: { min: 0.15, max: 0.35 },
    diversified: { min: 0.10, max: 0.30 },
    growth: { min: 0.45, max: 0.65 },
  },
  growth: {
    stability: { min: 0.10, max: 0.30 },
    diversified: { min: 0.10, max: 0.30 },
    growth: { min: 0.55, max: 0.75 },
  },
  long_term_growth: {
    stability: { min: 0.00, max: 0.15 },
    diversified: { min: 0.10, max: 0.30 },
    growth: { min: 0.65, max: 0.85 },
  },
};

// Traditional Portfolio Models
export const TRADITIONAL_PORTFOLIOS: Record<RiskProfileId, PortfolioModel> = {
  conservative: {
    riskProfile: 'conservative',
    portfolioType: 'traditional',
    totalStability: 0.595,
    totalDiversified: 0.105,
    totalGrowth: 0.30,
    allocations: [
      // Stability
      { category: 'Stability', subcategory: 'Cash', fund: 'Fidelity Treasury', ticker: 'FRBXX', allocation: 0.025 },
      { category: 'Stability', subcategory: 'US Government', fund: 'Vanguard Intermediate Treasury', ticker: 'VFIUX', allocation: 0.045 },
      { category: 'Stability', subcategory: 'US Government', fund: 'iShares 0-5yr TIPS', ticker: 'STIP', allocation: 0.03 },
      { category: 'Stability', subcategory: 'Municipal Bonds', fund: 'PIMCO Municipal SMA', allocation: 0.495 },
      // Diversified
      { category: 'Diversified', subcategory: 'Credit', fund: 'PIMCO Income Fund', ticker: 'PIMIX', allocation: 0.055 },
      { category: 'Diversified', subcategory: 'Commodities', fund: 'iShares Gold Trust', ticker: 'IAU', allocation: 0.05 },
      // Growth
      { category: 'Growth', subcategory: 'Global Equities', fund: 'GQG Global', ticker: 'GQRIX', allocation: 0.045 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Parametric S&P 1500', ticker: 'ITOT', allocation: 0.125 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Primecap', ticker: 'POAGX', allocation: 0.03 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Energy Income Partners ETF', ticker: 'EIPX', allocation: 0.02 },
      { category: 'Growth', subcategory: 'International Equities', fund: 'Artisan International Value', ticker: 'APHKX', allocation: 0.055 },
      { category: 'Growth', subcategory: 'Emerging Markets', fund: 'DFA Emerging Markets', ticker: 'DFEMX', allocation: 0.025 },
    ],
  },
  balanced: {
    riskProfile: 'balanced',
    portfolioType: 'traditional',
    totalStability: 0.395,
    totalDiversified: 0.105,
    totalGrowth: 0.50,
    allocations: [
      // Stability
      { category: 'Stability', subcategory: 'Cash', fund: 'Fidelity Treasury', ticker: 'FRBXX', allocation: 0.05 },
      { category: 'Stability', subcategory: 'US Government', fund: 'Vanguard Intermediate Treasury', ticker: 'VFIUX', allocation: 0.025 },
      { category: 'Stability', subcategory: 'Municipal Bonds', fund: 'PIMCO Municipal SMA', allocation: 0.32 },
      // Diversified
      { category: 'Diversified', subcategory: 'Credit', fund: 'PIMCO Income Fund', ticker: 'PIMIX', allocation: 0.055 },
      { category: 'Diversified', subcategory: 'Commodities', fund: 'iShares Gold Trust', ticker: 'IAU', allocation: 0.05 },
      // Growth
      { category: 'Growth', subcategory: 'Global Equities', fund: 'GQG Global', ticker: 'GQRIX', allocation: 0.07 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Parametric S&P 1500', ticker: 'ITOT', allocation: 0.21 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Primecap', ticker: 'POAGX', allocation: 0.05 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Energy Income Partners ETF', ticker: 'EIPX', allocation: 0.035 },
      { category: 'Growth', subcategory: 'International Equities', fund: 'Artisan International Value', ticker: 'APHKX', allocation: 0.095 },
      { category: 'Growth', subcategory: 'Emerging Markets', fund: 'DFA Emerging Markets', ticker: 'DFEMX', allocation: 0.04 },
    ],
  },
  moderate_growth: {
    riskProfile: 'moderate_growth',
    portfolioType: 'traditional',
    totalStability: 0.315,
    totalDiversified: 0.085,
    totalGrowth: 0.60,
    allocations: [
      // Stability
      { category: 'Stability', subcategory: 'Cash', fund: 'Fidelity Treasury', ticker: 'FRBXX', allocation: 0.05 },
      { category: 'Stability', subcategory: 'US Government', fund: 'Vanguard Intermediate Treasury', ticker: 'VFIUX', allocation: 0.045 },
      { category: 'Stability', subcategory: 'Municipal Bonds', fund: 'PIMCO Municipal SMA', allocation: 0.22 },
      // Diversified
      { category: 'Diversified', subcategory: 'Credit', fund: 'PIMCO Income Fund', ticker: 'PIMIX', allocation: 0.035 },
      { category: 'Diversified', subcategory: 'Commodities', fund: 'iShares Gold Trust', ticker: 'IAU', allocation: 0.05 },
      // Growth
      { category: 'Growth', subcategory: 'Global Equities', fund: 'GQG Global', ticker: 'GQRIX', allocation: 0.085 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Parametric S&P 1500', ticker: 'ITOT', allocation: 0.25 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Primecap', ticker: 'POAGX', allocation: 0.06 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Energy Income Partners ETF', ticker: 'EIPX', allocation: 0.04 },
      { category: 'Growth', subcategory: 'International Equities', fund: 'Artisan International Value', ticker: 'APHKX', allocation: 0.115 },
      { category: 'Growth', subcategory: 'Emerging Markets', fund: 'DFA Emerging Markets', ticker: 'DFEMX', allocation: 0.05 },
    ],
  },
  growth: {
    riskProfile: 'growth',
    portfolioType: 'traditional',
    totalStability: 0.245,
    totalDiversified: 0.055,
    totalGrowth: 0.70,
    allocations: [
      // Stability
      { category: 'Stability', subcategory: 'Cash', fund: 'Fidelity Treasury', ticker: 'FRBXX', allocation: 0.04 },
      { category: 'Stability', subcategory: 'US Government', fund: 'Vanguard Intermediate Treasury', ticker: 'VFIUX', allocation: 0.045 },
      { category: 'Stability', subcategory: 'Municipal Bonds', fund: 'PIMCO Municipal SMA', allocation: 0.16 },
      // Diversified
      { category: 'Diversified', subcategory: 'Credit', fund: 'PIMCO Income Fund', ticker: 'PIMIX', allocation: 0.055 },
      // Growth
      { category: 'Growth', subcategory: 'Global Equities', fund: 'GQG Global', ticker: 'GQRIX', allocation: 0.10 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Parametric S&P 1500', ticker: 'ITOT', allocation: 0.29 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Primecap', ticker: 'POAGX', allocation: 0.07 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Energy Income Partners ETF', ticker: 'EIPX', allocation: 0.045 },
      { category: 'Growth', subcategory: 'International Equities', fund: 'Artisan International Value', ticker: 'APHKX', allocation: 0.135 },
      { category: 'Growth', subcategory: 'Emerging Markets', fund: 'DFA Emerging Markets', ticker: 'DFEMX', allocation: 0.06 },
    ],
  },
  long_term_growth: {
    riskProfile: 'long_term_growth',
    portfolioType: 'traditional',
    totalStability: 0.18,
    totalDiversified: 0.02,
    totalGrowth: 0.80,
    allocations: [
      // Stability
      { category: 'Stability', subcategory: 'Cash', fund: 'Fidelity Treasury', ticker: 'FRBXX', allocation: 0.05 },
      { category: 'Stability', subcategory: 'US Government', fund: 'Vanguard Intermediate Treasury', ticker: 'VFIUX', allocation: 0.05 },
      { category: 'Stability', subcategory: 'Municipal Bonds', fund: 'PIMCO Municipal SMA', allocation: 0.08 },
      // Diversified
      { category: 'Diversified', subcategory: 'Credit', fund: 'PIMCO Income Fund', ticker: 'PIMIX', allocation: 0.02 },
      // Growth
      { category: 'Growth', subcategory: 'Global Equities', fund: 'GQG Global', ticker: 'GQRIX', allocation: 0.115 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Parametric S&P 1500', ticker: 'ITOT', allocation: 0.335 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Primecap', ticker: 'POAGX', allocation: 0.08 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Energy Income Partners ETF', ticker: 'EIPX', allocation: 0.05 },
      { category: 'Growth', subcategory: 'International Equities', fund: 'Artisan International Value', ticker: 'APHKX', allocation: 0.155 },
      { category: 'Growth', subcategory: 'Emerging Markets', fund: 'DFA Emerging Markets', ticker: 'DFEMX', allocation: 0.065 },
    ],
  },
};

// Endowment Portfolio Models (no Conservative option)
export const ENDOWMENT_PORTFOLIOS: Partial<Record<RiskProfileId, PortfolioModel>> = {
  balanced: {
    riskProfile: 'balanced',
    portfolioType: 'endowment',
    totalStability: 0.24,
    totalDiversified: 0.26,
    totalGrowth: 0.50,
    allocations: [
      // Stability
      { category: 'Stability', subcategory: 'Cash', fund: 'Fidelity Treasury', ticker: 'FRBXX', allocation: 0.02 },
      { category: 'Stability', subcategory: 'US Government', fund: 'Vanguard Intermediate Treasury', ticker: 'VFIUX', allocation: 0.02 },
      { category: 'Stability', subcategory: 'Municipal Bonds', fund: 'PIMCO Municipal SMA', allocation: 0.20 },
      // Diversified
      { category: 'Diversified', subcategory: 'Credit', fund: 'Municipal High Income Fund', allocation: 0.05 },
      { category: 'Diversified', subcategory: 'Credit', fund: 'Private Credit', allocation: 0.03, secondary: 'Apollo & Fortress' },
      { category: 'Diversified', subcategory: 'Absolute Return', fund: 'Multi-Strategy', allocation: 0.08, secondary: 'Lapis' },
      { category: 'Diversified', subcategory: 'Commodities', fund: 'iShares Gold Trust', ticker: 'IAU', allocation: 0.03 },
      { category: 'Diversified', subcategory: 'Real Assets', fund: 'Brookfield Infrastructure Income', allocation: 0.03 },
      { category: 'Diversified', subcategory: 'Real Assets', fund: 'Tax Advantaged Real Estate', allocation: 0.04 },
      // Growth
      { category: 'Growth', subcategory: 'Global Equities', fund: 'Global Alpha Fund', allocation: 0.09 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Parametric S&P 1500', allocation: 0.16 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Energy Infrastructure & Utility Fund', allocation: 0.02 },
      { category: 'Growth', subcategory: 'International Equities', fund: 'International Value', allocation: 0.08 },
      { category: 'Growth', subcategory: 'Emerging Markets', fund: 'Emerging Markets', allocation: 0.05 },
      { category: 'Growth', subcategory: 'Private Equity', fund: 'Private Equity', allocation: 0.10 },
    ],
  },
  moderate_growth: {
    riskProfile: 'moderate_growth',
    portfolioType: 'endowment',
    totalStability: 0.16,
    totalDiversified: 0.24,
    totalGrowth: 0.60,
    allocations: [
      // Stability
      { category: 'Stability', subcategory: 'Cash', fund: 'Fidelity Treasury', ticker: 'FRBXX', allocation: 0.01 },
      { category: 'Stability', subcategory: 'US Government', fund: 'Vanguard Intermediate Treasury', ticker: 'VFIUX', allocation: 0.02 },
      { category: 'Stability', subcategory: 'Municipal Bonds', fund: 'PIMCO Municipal SMA', allocation: 0.13 },
      // Diversified
      { category: 'Diversified', subcategory: 'Credit', fund: 'Municipal High Income Fund', allocation: 0.03 },
      { category: 'Diversified', subcategory: 'Credit', fund: 'Private Credit', allocation: 0.04 },
      { category: 'Diversified', subcategory: 'Absolute Return', fund: 'Multi-Strategy', allocation: 0.08 },
      { category: 'Diversified', subcategory: 'Real Assets', fund: 'Ares Infrastructure', allocation: 0.025 },
      { category: 'Diversified', subcategory: 'Real Assets', fund: 'Blackstone Infrastructure', allocation: 0.025 },
      { category: 'Diversified', subcategory: 'Real Assets', fund: 'Tax Advantaged Real Estate', allocation: 0.04 },
      // Growth
      { category: 'Growth', subcategory: 'Global Equities', fund: 'Global Alpha Fund', allocation: 0.115 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Parametric S&P 1500', allocation: 0.205 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Energy Infrastructure & Utility Fund', allocation: 0.025 },
      { category: 'Growth', subcategory: 'International Equities', fund: 'International Value', allocation: 0.10 },
      { category: 'Growth', subcategory: 'Emerging Markets', fund: 'Emerging Markets', allocation: 0.055 },
      { category: 'Growth', subcategory: 'Private Equity', fund: 'Private Equity', allocation: 0.10 },
    ],
  },
  growth: {
    riskProfile: 'growth',
    portfolioType: 'endowment',
    totalStability: 0.075,
    totalDiversified: 0.225,
    totalGrowth: 0.70,
    allocations: [
      // Stability
      { category: 'Stability', subcategory: 'Cash', fund: 'Fidelity Treasury', ticker: 'FRBXX', allocation: 0.005 },
      { category: 'Stability', subcategory: 'US Government', fund: 'Vanguard Intermediate Treasury', ticker: 'VFIUX', allocation: 0.02 },
      { category: 'Stability', subcategory: 'Municipal Bonds', fund: 'PIMCO Municipal SMA', allocation: 0.05 },
      // Diversified
      { category: 'Diversified', subcategory: 'Credit', fund: 'Municipal High Income Fund', allocation: 0.02 },
      { category: 'Diversified', subcategory: 'Credit', fund: 'Private Credit', allocation: 0.035 },
      { category: 'Diversified', subcategory: 'Absolute Return', fund: 'Multi-Strategy', allocation: 0.08 },
      { category: 'Diversified', subcategory: 'Real Assets', fund: 'Ares Infrastructure', allocation: 0.025 },
      { category: 'Diversified', subcategory: 'Real Assets', fund: 'Blackstone Infrastructure', allocation: 0.025 },
      { category: 'Diversified', subcategory: 'Real Assets', fund: 'Tax Advantaged Real Estate', allocation: 0.04 },
      // Growth
      { category: 'Growth', subcategory: 'Global Equities', fund: 'Global Alpha Fund', allocation: 0.14 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Parametric S&P 1500', allocation: 0.25 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Energy Infrastructure & Utility Fund', allocation: 0.03 },
      { category: 'Growth', subcategory: 'International Equities', fund: 'International Value', allocation: 0.12 },
      { category: 'Growth', subcategory: 'Emerging Markets', fund: 'Emerging Markets', allocation: 0.06 },
      { category: 'Growth', subcategory: 'Private Equity', fund: 'Private Equity', allocation: 0.10 },
    ],
  },
  long_term_growth: {
    riskProfile: 'long_term_growth',
    portfolioType: 'endowment',
    totalStability: 0.025,
    totalDiversified: 0.175,
    totalGrowth: 0.80,
    allocations: [
      // Stability
      { category: 'Stability', subcategory: 'Cash', fund: 'Fidelity Treasury', ticker: 'FRBXX', allocation: 0.005 },
      { category: 'Stability', subcategory: 'Municipal Bonds', fund: 'PIMCO Municipal SMA', allocation: 0.02 },
      // Diversified
      { category: 'Diversified', subcategory: 'Credit', fund: 'Private Credit', allocation: 0.035 },
      { category: 'Diversified', subcategory: 'Absolute Return', fund: 'Multi-Strategy', allocation: 0.055 },
      { category: 'Diversified', subcategory: 'Real Assets', fund: 'Ares Infrastructure', allocation: 0.025 },
      { category: 'Diversified', subcategory: 'Real Assets', fund: 'Blackstone Infrastructure', allocation: 0.025 },
      { category: 'Diversified', subcategory: 'Real Assets', fund: 'Tax Advantaged Real Estate', allocation: 0.035 },
      // Growth
      { category: 'Growth', subcategory: 'Global Equities', fund: 'Global Alpha Fund', allocation: 0.165 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Parametric S&P 1500', allocation: 0.30 },
      { category: 'Growth', subcategory: 'US Equities', fund: 'Energy Infrastructure & Utility Fund', allocation: 0.035 },
      { category: 'Growth', subcategory: 'International Equities', fund: 'International Value', allocation: 0.14 },
      { category: 'Growth', subcategory: 'Emerging Markets', fund: 'Emerging Markets', allocation: 0.06 },
      { category: 'Growth', subcategory: 'Private Equity', fund: 'Private Equity', allocation: 0.10 },
    ],
  },
};

// Helper to get portfolio by risk profile and type
export function getPortfolioModel(
  riskProfile: RiskProfileId,
  portfolioType: PortfolioType
): PortfolioModel | undefined {
  if (portfolioType === 'traditional') {
    return TRADITIONAL_PORTFOLIOS[riskProfile];
  }
  return ENDOWMENT_PORTFOLIOS[riskProfile];
}

// Helper to get available risk profiles for a portfolio type
export function getAvailableRiskProfiles(portfolioType: PortfolioType): RiskProfileId[] {
  if (portfolioType === 'traditional') {
    return Object.keys(TRADITIONAL_PORTFOLIOS) as RiskProfileId[];
  }
  return Object.keys(ENDOWMENT_PORTFOLIOS) as RiskProfileId[];
}

// Helper to aggregate allocations by category
export function getAllocationsByCategory(allocations: AssetAllocation[]): Record<string, number> {
  return allocations.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.allocation;
      return acc;
    },
    {} as Record<string, number>
  );
}
