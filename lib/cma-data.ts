/**
 * Capital Market Assumptions (CMA) Mock Data
 * Based on typical institutional wealth management assumptions
 */

import { AssetClass, CorrelationMatrix, PortfolioHoldings } from './portfolio-types';

// Core asset classes available in "Core" mode
export const CORE_ASSETS = new Set([
  'GLOBAL CASH',
  'GLOBAL GOVERNMENT',
  'GLOBAL AGGREGATE',
  'HIGH YIELD',
  'GOLD',
  'GLOBAL',
  'EM',
]);

// Additional private assets for "Core + Private" mode
export const PRIVATE_ASSETS = new Set([
  'GLOBAL CASH',
  'GLOBAL GOVERNMENT',
  'PRIVATE DEBT',
  'PRIVATE INFRASTRUCTURE',
  'REAL ESTATE',
  'ABSOLUTE RETURN HS',
  'GROWTH DIRECTIONAL HF',
  'PRIVATE EQUITY',
]);

// Full asset class universe with CMA data
export const ASSET_CLASSES: AssetClass[] = [
  // Stability bucket
  { name: 'GLOBAL CASH', expectedReturn: 0.030, risk: 0.005, riskAllocation: 'STABILITY', capMax: 1.0 },
  { name: 'GLOBAL GOVERNMENT', expectedReturn: 0.035, risk: 0.045, riskAllocation: 'STABILITY', capMax: 1.0 },
  { name: 'GLOBAL AGGREGATE', expectedReturn: 0.040, risk: 0.055, riskAllocation: 'STABILITY', capMax: 1.0 },
  { name: 'PRIVATE DEBT', expectedReturn: 0.055, risk: 0.065, riskAllocation: 'STABILITY', capMax: 0.15 },

  // Diversified bucket
  { name: 'HIGH YIELD', expectedReturn: 0.055, risk: 0.085, riskAllocation: 'DIVERSIFIED', capMax: 0.20 },
  { name: 'GOLD', expectedReturn: 0.040, risk: 0.150, riskAllocation: 'DIVERSIFIED', capMax: 0.10 },
  { name: 'REAL ESTATE', expectedReturn: 0.055, risk: 0.120, riskAllocation: 'DIVERSIFIED', capMax: 0.15 },
  { name: 'PRIVATE INFRASTRUCTURE', expectedReturn: 0.060, risk: 0.100, riskAllocation: 'DIVERSIFIED', capMax: 0.15 },
  { name: 'ABSOLUTE RETURN HS', expectedReturn: 0.050, risk: 0.080, riskAllocation: 'DIVERSIFIED', capMax: 0.15 },

  // Growth bucket
  { name: 'GLOBAL', expectedReturn: 0.065, risk: 0.150, riskAllocation: 'GROWTH', capMax: 1.0 },
  { name: 'EM', expectedReturn: 0.075, risk: 0.200, riskAllocation: 'GROWTH', capMax: 0.20 },
  { name: 'GROWTH DIRECTIONAL HF', expectedReturn: 0.065, risk: 0.120, riskAllocation: 'GROWTH', capMax: 0.15 },
  { name: 'PRIVATE EQUITY', expectedReturn: 0.090, risk: 0.220, riskAllocation: 'GROWTH', capMax: 0.15 },
];

// Asset name to index mapping for correlation matrix
const assetNames = ASSET_CLASSES.map(a => a.name);

// Correlation matrix (symmetric, diagonal = 1)
// Simplified but realistic correlations
export const CORRELATION_MATRIX: CorrelationMatrix = {
  'GLOBAL CASH': {
    'GLOBAL CASH': 1.00, 'GLOBAL GOVERNMENT': 0.20, 'GLOBAL AGGREGATE': 0.15, 'PRIVATE DEBT': 0.10,
    'HIGH YIELD': 0.05, 'GOLD': -0.05, 'REAL ESTATE': 0.05, 'PRIVATE INFRASTRUCTURE': 0.05,
    'ABSOLUTE RETURN HS': 0.10, 'GLOBAL': -0.05, 'EM': -0.05, 'GROWTH DIRECTIONAL HF': 0.05, 'PRIVATE EQUITY': -0.05
  },
  'GLOBAL GOVERNMENT': {
    'GLOBAL CASH': 0.20, 'GLOBAL GOVERNMENT': 1.00, 'GLOBAL AGGREGATE': 0.85, 'PRIVATE DEBT': 0.30,
    'HIGH YIELD': 0.25, 'GOLD': 0.15, 'REAL ESTATE': 0.10, 'PRIVATE INFRASTRUCTURE': 0.15,
    'ABSOLUTE RETURN HS': 0.20, 'GLOBAL': -0.20, 'EM': -0.15, 'GROWTH DIRECTIONAL HF': 0.10, 'PRIVATE EQUITY': -0.15
  },
  'GLOBAL AGGREGATE': {
    'GLOBAL CASH': 0.15, 'GLOBAL GOVERNMENT': 0.85, 'GLOBAL AGGREGATE': 1.00, 'PRIVATE DEBT': 0.40,
    'HIGH YIELD': 0.45, 'GOLD': 0.10, 'REAL ESTATE': 0.15, 'PRIVATE INFRASTRUCTURE': 0.20,
    'ABSOLUTE RETURN HS': 0.25, 'GLOBAL': -0.10, 'EM': -0.05, 'GROWTH DIRECTIONAL HF': 0.15, 'PRIVATE EQUITY': -0.10
  },
  'PRIVATE DEBT': {
    'GLOBAL CASH': 0.10, 'GLOBAL GOVERNMENT': 0.30, 'GLOBAL AGGREGATE': 0.40, 'PRIVATE DEBT': 1.00,
    'HIGH YIELD': 0.55, 'GOLD': 0.05, 'REAL ESTATE': 0.35, 'PRIVATE INFRASTRUCTURE': 0.40,
    'ABSOLUTE RETURN HS': 0.35, 'GLOBAL': 0.20, 'EM': 0.25, 'GROWTH DIRECTIONAL HF': 0.30, 'PRIVATE EQUITY': 0.35
  },
  'HIGH YIELD': {
    'GLOBAL CASH': 0.05, 'GLOBAL GOVERNMENT': 0.25, 'GLOBAL AGGREGATE': 0.45, 'PRIVATE DEBT': 0.55,
    'HIGH YIELD': 1.00, 'GOLD': 0.05, 'REAL ESTATE': 0.40, 'PRIVATE INFRASTRUCTURE': 0.35,
    'ABSOLUTE RETURN HS': 0.45, 'GLOBAL': 0.60, 'EM': 0.55, 'GROWTH DIRECTIONAL HF': 0.50, 'PRIVATE EQUITY': 0.50
  },
  'GOLD': {
    'GLOBAL CASH': -0.05, 'GLOBAL GOVERNMENT': 0.15, 'GLOBAL AGGREGATE': 0.10, 'PRIVATE DEBT': 0.05,
    'HIGH YIELD': 0.05, 'GOLD': 1.00, 'REAL ESTATE': 0.10, 'PRIVATE INFRASTRUCTURE': 0.05,
    'ABSOLUTE RETURN HS': 0.15, 'GLOBAL': 0.05, 'EM': 0.10, 'GROWTH DIRECTIONAL HF': 0.10, 'PRIVATE EQUITY': 0.05
  },
  'REAL ESTATE': {
    'GLOBAL CASH': 0.05, 'GLOBAL GOVERNMENT': 0.10, 'GLOBAL AGGREGATE': 0.15, 'PRIVATE DEBT': 0.35,
    'HIGH YIELD': 0.40, 'GOLD': 0.10, 'REAL ESTATE': 1.00, 'PRIVATE INFRASTRUCTURE': 0.55,
    'ABSOLUTE RETURN HS': 0.35, 'GLOBAL': 0.50, 'EM': 0.45, 'GROWTH DIRECTIONAL HF': 0.40, 'PRIVATE EQUITY': 0.55
  },
  'PRIVATE INFRASTRUCTURE': {
    'GLOBAL CASH': 0.05, 'GLOBAL GOVERNMENT': 0.15, 'GLOBAL AGGREGATE': 0.20, 'PRIVATE DEBT': 0.40,
    'HIGH YIELD': 0.35, 'GOLD': 0.05, 'REAL ESTATE': 0.55, 'PRIVATE INFRASTRUCTURE': 1.00,
    'ABSOLUTE RETURN HS': 0.30, 'GLOBAL': 0.40, 'EM': 0.35, 'GROWTH DIRECTIONAL HF': 0.35, 'PRIVATE EQUITY': 0.50
  },
  'ABSOLUTE RETURN HS': {
    'GLOBAL CASH': 0.10, 'GLOBAL GOVERNMENT': 0.20, 'GLOBAL AGGREGATE': 0.25, 'PRIVATE DEBT': 0.35,
    'HIGH YIELD': 0.45, 'GOLD': 0.15, 'REAL ESTATE': 0.35, 'PRIVATE INFRASTRUCTURE': 0.30,
    'ABSOLUTE RETURN HS': 1.00, 'GLOBAL': 0.45, 'EM': 0.40, 'GROWTH DIRECTIONAL HF': 0.65, 'PRIVATE EQUITY': 0.40
  },
  'GLOBAL': {
    'GLOBAL CASH': -0.05, 'GLOBAL GOVERNMENT': -0.20, 'GLOBAL AGGREGATE': -0.10, 'PRIVATE DEBT': 0.20,
    'HIGH YIELD': 0.60, 'GOLD': 0.05, 'REAL ESTATE': 0.50, 'PRIVATE INFRASTRUCTURE': 0.40,
    'ABSOLUTE RETURN HS': 0.45, 'GLOBAL': 1.00, 'EM': 0.75, 'GROWTH DIRECTIONAL HF': 0.70, 'PRIVATE EQUITY': 0.70
  },
  'EM': {
    'GLOBAL CASH': -0.05, 'GLOBAL GOVERNMENT': -0.15, 'GLOBAL AGGREGATE': -0.05, 'PRIVATE DEBT': 0.25,
    'HIGH YIELD': 0.55, 'GOLD': 0.10, 'REAL ESTATE': 0.45, 'PRIVATE INFRASTRUCTURE': 0.35,
    'ABSOLUTE RETURN HS': 0.40, 'GLOBAL': 0.75, 'EM': 1.00, 'GROWTH DIRECTIONAL HF': 0.60, 'PRIVATE EQUITY': 0.65
  },
  'GROWTH DIRECTIONAL HF': {
    'GLOBAL CASH': 0.05, 'GLOBAL GOVERNMENT': 0.10, 'GLOBAL AGGREGATE': 0.15, 'PRIVATE DEBT': 0.30,
    'HIGH YIELD': 0.50, 'GOLD': 0.10, 'REAL ESTATE': 0.40, 'PRIVATE INFRASTRUCTURE': 0.35,
    'ABSOLUTE RETURN HS': 0.65, 'GLOBAL': 0.70, 'EM': 0.60, 'GROWTH DIRECTIONAL HF': 1.00, 'PRIVATE EQUITY': 0.55
  },
  'PRIVATE EQUITY': {
    'GLOBAL CASH': -0.05, 'GLOBAL GOVERNMENT': -0.15, 'GLOBAL AGGREGATE': -0.10, 'PRIVATE DEBT': 0.35,
    'HIGH YIELD': 0.50, 'GOLD': 0.05, 'REAL ESTATE': 0.55, 'PRIVATE INFRASTRUCTURE': 0.50,
    'ABSOLUTE RETURN HS': 0.40, 'GLOBAL': 0.70, 'EM': 0.65, 'GROWTH DIRECTIONAL HF': 0.55, 'PRIVATE EQUITY': 1.00
  },
};

// Sample portfolios for demonstration
export const SAMPLE_PORTFOLIOS: PortfolioHoldings[] = [
  {
    name: 'Conservative',
    allocations: {
      'GLOBAL CASH': 0.10,
      'GLOBAL GOVERNMENT': 0.35,
      'GLOBAL AGGREGATE': 0.25,
      'HIGH YIELD': 0.05,
      'GOLD': 0.05,
      'GLOBAL': 0.15,
      'EM': 0.05,
    }
  },
  {
    name: 'Moderate',
    allocations: {
      'GLOBAL CASH': 0.05,
      'GLOBAL GOVERNMENT': 0.20,
      'GLOBAL AGGREGATE': 0.15,
      'HIGH YIELD': 0.10,
      'GOLD': 0.05,
      'GLOBAL': 0.35,
      'EM': 0.10,
    }
  },
  {
    name: 'Aggressive',
    allocations: {
      'GLOBAL CASH': 0.02,
      'GLOBAL GOVERNMENT': 0.08,
      'GLOBAL AGGREGATE': 0.10,
      'HIGH YIELD': 0.10,
      'GOLD': 0.05,
      'GLOBAL': 0.50,
      'EM': 0.15,
    }
  },
];

// Helper to get filtered assets by mode
export function getAssetsByMode(mode: 'core' | 'core_private' | 'unconstrained'): AssetClass[] {
  if (mode === 'unconstrained') {
    return ASSET_CLASSES;
  }

  const allowedSet = mode === 'core' ? CORE_ASSETS : new Set([...CORE_ASSETS, ...PRIVATE_ASSETS]);
  return ASSET_CLASSES.filter(asset => allowedSet.has(asset.name));
}

// Helper to apply caps template
export function applyCapsTemplate(
  assets: AssetClass[],
  template: 'standard' | 'tight' | 'loose'
): AssetClass[] {
  return assets.map(asset => {
    let effectiveCap = asset.capMax;
    if (template === 'tight') {
      effectiveCap = Math.min(asset.capMax, 0.25);
    } else if (template === 'loose') {
      effectiveCap = Math.min(asset.capMax, 1.0);
    }
    return { ...asset, capMax: effectiveCap };
  });
}

// Get correlation between two assets
export function getCorrelation(asset1: string, asset2: string): number {
  return CORRELATION_MATRIX[asset1]?.[asset2] ?? 0;
}
