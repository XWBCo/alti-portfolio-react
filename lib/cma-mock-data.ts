/**
 * Capital Market Assumptions Mock Data
 * Based on AlTi 2025 CMA data (cma_data.csv)
 */

import type { CMAAsset, Purpose } from './cma-types';

// Full CMA dataset (39 asset classes)
export const CMA_ASSETS: CMAAsset[] = [
  // Stability - Cash
  { purpose: 'Stability', group: 'Cash', assetClass: 'US Cash', forecastReturn: 0.0337, forecastVolatility: 0.0067 },
  { purpose: 'Stability', group: 'Cash', assetClass: 'Global Cash', forecastReturn: 0.0210, forecastVolatility: 0.0060 },

  // Stability - Government & Municipal Bonds
  { purpose: 'Stability', group: 'Government & Municipal Bonds', assetClass: 'US Government', forecastReturn: 0.0420, forecastVolatility: 0.0579 },
  { purpose: 'Stability', group: 'Government & Municipal Bonds', assetClass: 'Global Government', forecastReturn: 0.0428, forecastVolatility: 0.0600 },
  { purpose: 'Stability', group: 'Government & Municipal Bonds', assetClass: 'US Municipal', forecastReturn: 0.0390, forecastVolatility: 0.0471 },
  { purpose: 'Stability', group: 'Government & Municipal Bonds', assetClass: 'US Inflation-Linked', forecastReturn: 0.0430, forecastVolatility: 0.0566 },
  { purpose: 'Stability', group: 'Government & Municipal Bonds', assetClass: 'Global Inflation-Linked', forecastReturn: 0.0445, forecastVolatility: 0.0720 },

  // Stability - Corporates & MBS
  { purpose: 'Stability', group: 'Corporates & MBS', assetClass: 'US Aggregate', forecastReturn: 0.0461, forecastVolatility: 0.0505 },
  { purpose: 'Stability', group: 'Corporates & MBS', assetClass: 'Global Aggregate', forecastReturn: 0.0445, forecastVolatility: 0.0500 },
  { purpose: 'Stability', group: 'Corporates & MBS', assetClass: 'IG Corporate', forecastReturn: 0.0497, forecastVolatility: 0.0719 },
  { purpose: 'Stability', group: 'Corporates & MBS', assetClass: 'MBS', forecastReturn: 0.0500, forecastVolatility: 0.0521 },

  // Diversified - Other Credit
  { purpose: 'Diversified', group: 'Other Credit', assetClass: 'High Yield', forecastReturn: 0.0590, forecastVolatility: 0.0885 },
  { purpose: 'Diversified', group: 'Other Credit', assetClass: 'HY Muni Bond', forecastReturn: 0.0570, forecastVolatility: 0.0861 },
  { purpose: 'Diversified', group: 'Other Credit', assetClass: 'EM Debt', forecastReturn: 0.0580, forecastVolatility: 0.0920 },
  { purpose: 'Diversified', group: 'Other Credit', assetClass: 'Loans', forecastReturn: 0.0600, forecastVolatility: 0.0780 },
  { purpose: 'Diversified', group: 'Other Credit', assetClass: 'Private Debt', forecastReturn: 0.0880, forecastVolatility: 0.1180 },
  { purpose: 'Diversified', group: 'Other Credit', assetClass: 'Credit Direct. HFs', forecastReturn: 0.0668, forecastVolatility: 0.0723 },

  // Diversified - Absolute Return
  { purpose: 'Diversified', group: 'Absolute Return', assetClass: 'Absolute Return HFs', forecastReturn: 0.0555, forecastVolatility: 0.0681 },

  // Diversified - Real Assets
  { purpose: 'Diversified', group: 'Real Assets', assetClass: 'Gold', forecastReturn: 0.0335, forecastVolatility: 0.1676 },
  { purpose: 'Diversified', group: 'Real Assets', assetClass: 'General Commodities', forecastReturn: 0.0490, forecastVolatility: 0.1665 },
  { purpose: 'Diversified', group: 'Real Assets', assetClass: 'Private Infrastructure*', forecastReturn: 0.0920, forecastVolatility: 0.1140 },
  { purpose: 'Diversified', group: 'Real Assets', assetClass: 'Listed Infrastructure', forecastReturn: 0.0754, forecastVolatility: 0.1583 },
  { purpose: 'Diversified', group: 'Real Assets', assetClass: 'Illiquid Real Estate', forecastReturn: 0.0866, forecastVolatility: 0.1358 },

  // Growth - Alternative Growth
  { purpose: 'Growth', group: 'Alternative Growth', assetClass: 'Growth Direct. HFs', forecastReturn: 0.0560, forecastVolatility: 0.0850 },
  { purpose: 'Growth', group: 'Alternative Growth', assetClass: 'US REITs', forecastReturn: 0.0722, forecastVolatility: 0.1899 },
  { purpose: 'Growth', group: 'Alternative Growth', assetClass: 'Global REITs', forecastReturn: 0.0707, forecastVolatility: 0.1790 },
  { purpose: 'Growth', group: 'Alternative Growth', assetClass: 'Private Equity', forecastReturn: 0.1221, forecastVolatility: 0.2200 },

  // Growth - Equities
  { purpose: 'Growth', group: 'Equities', assetClass: 'Global', forecastReturn: 0.0668, forecastVolatility: 0.1580 },
  { purpose: 'Growth', group: 'Equities', assetClass: 'Global Dev.', forecastReturn: 0.0656, forecastVolatility: 0.1574 },
  { purpose: 'Growth', group: 'Equities', assetClass: 'Global EAFE', forecastReturn: 0.0821, forecastVolatility: 0.1740 },
  { purpose: 'Growth', group: 'Equities', assetClass: 'Global Dev. EAFE', forecastReturn: 0.0819, forecastVolatility: 0.1667 },
  { purpose: 'Growth', group: 'Equities', assetClass: 'US', forecastReturn: 0.0600, forecastVolatility: 0.1620 },
  { purpose: 'Growth', group: 'Equities', assetClass: 'Pan Europe', forecastReturn: 0.0815, forecastVolatility: 0.1903 },
  { purpose: 'Growth', group: 'Equities', assetClass: 'Japan', forecastReturn: 0.0880, forecastVolatility: 0.1810 },
  { purpose: 'Growth', group: 'Equities', assetClass: 'Asia Pacific ex Japan', forecastReturn: 0.0735, forecastVolatility: 0.2079 },
  { purpose: 'Growth', group: 'Equities', assetClass: 'EM', forecastReturn: 0.0795, forecastVolatility: 0.2151 },
  { purpose: 'Growth', group: 'Equities', assetClass: 'US SMID', forecastReturn: 0.0675, forecastVolatility: 0.2020 },
  { purpose: 'Growth', group: 'Equities', assetClass: 'Global SMID', forecastReturn: 0.0857, forecastVolatility: 0.1802 },
];

// Group definitions for filtering
export const PURPOSE_GROUPS: Record<Purpose, string[]> = {
  Stability: ['Cash', 'Government & Municipal Bonds', 'Corporates & MBS'],
  Diversified: ['Other Credit', 'Absolute Return', 'Real Assets'],
  Growth: ['Alternative Growth', 'Equities'],
};

// Get assets by purpose
export function getAssetsByPurpose(purpose: Purpose): CMAAsset[] {
  return CMA_ASSETS.filter(a => a.purpose === purpose);
}

// Get unique groups
export function getUniqueGroups(): string[] {
  return [...new Set(CMA_ASSETS.map(a => a.group))];
}

// Count assets by purpose
export function countByPurpose(): Record<Purpose, number> {
  return {
    Stability: CMA_ASSETS.filter(a => a.purpose === 'Stability').length,
    Diversified: CMA_ASSETS.filter(a => a.purpose === 'Diversified').length,
    Growth: CMA_ASSETS.filter(a => a.purpose === 'Growth').length,
  };
}
