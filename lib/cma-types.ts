/**
 * Capital Market Assumptions Types
 */

export type Currency = 'USD' | 'EUR' | 'GBP';

export type Scenario =
  | 'Base Case'
  | 'Mild Recession'
  | 'Stagflation'
  | 'Disinflationary Boom'
  | 'Policy Overkill';

export type Purpose = 'Stability' | 'Diversified' | 'Growth';

export interface CMAAsset {
  purpose: Purpose;
  group: string;
  assetClass: string;
  forecastReturn: number;
  forecastVolatility: number;
}

export interface ScenarioAdjustment {
  returnMultiplier: number;
  volatilityMultiplier: number;
}

export interface CMAParams {
  currency: Currency;
  scenario: Scenario;
}

export const SCENARIO_ADJUSTMENTS: Record<Scenario, ScenarioAdjustment> = {
  'Base Case': { returnMultiplier: 1.00, volatilityMultiplier: 1.00 },
  'Mild Recession': { returnMultiplier: 0.80, volatilityMultiplier: 1.15 },
  'Stagflation': { returnMultiplier: 0.70, volatilityMultiplier: 1.30 },
  'Disinflationary Boom': { returnMultiplier: 1.20, volatilityMultiplier: 0.85 },
  'Policy Overkill': { returnMultiplier: 0.60, volatilityMultiplier: 1.50 },
};

// Currency return adjustments (real terms)
export const CURRENCY_ADJUSTMENTS: Record<Currency, number> = {
  USD: 0,
  EUR: -0.0094,  // EUR returns are 0.94% lower
  GBP: 0.0055,   // GBP returns are 0.55% higher
};

export const PURPOSE_COLORS: Record<Purpose, string> = {
  Stability: '#0F94A6',
  Diversified: '#D351DE',
  Growth: '#0A598C',
};
