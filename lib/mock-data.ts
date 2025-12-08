/**
 * Mock data and presets for the portfolio app
 */

import type { PortfolioPreset, SimulationParams } from './types';

// Portfolio presets
export const PORTFOLIO_PRESETS: PortfolioPreset[] = [
  {
    name: 'Conservative',
    expectedReturn: 5.0,
    volatility: 8.0,
    description: 'Fixed income focused, lower risk',
  },
  {
    name: 'Balanced',
    expectedReturn: 7.0,
    volatility: 12.0,
    description: 'Mix of equities and bonds',
  },
  {
    name: 'Growth',
    expectedReturn: 9.0,
    volatility: 16.0,
    description: 'Equity focused, moderate risk',
  },
  {
    name: 'Aggressive',
    expectedReturn: 11.0,
    volatility: 20.0,
    description: 'High equity exposure, higher risk',
  },
];

// Default simulation parameters
export const DEFAULT_PARAMS: SimulationParams = {
  initialValue: 10_000_000,
  annualReturn: 0.07,        // 7%
  annualVolatility: 0.12,    // 12%
  quarterlyFixedSpending: 100_000,
  quarterlyPercentSpending: 0,
  durationYears: 30,
  numSimulations: 1000,
  inflationRate: 0.025,      // 2.5%
};

// Scenario colors for multi-scenario comparison
export const SCENARIO_COLORS = [
  '#0B6D7B',  // Teal
  '#074269',  // Dark blue
  '#00f0db',  // Turquoise
  '#F59E0B',  // Amber
  '#8B5CF6',  // Purple
];

// Chart colors
export const CHART_COLORS = {
  pathGray: '#E3E3E3',
  median: '#074269',
  percentile: '#0B6D7B',
  inflation: '#00f0db',
  bar: '#0B6D7B',
  barSecondary: '#074269',
};

// Sample spending scenarios
export const SAMPLE_SPENDING_EVENTS = [
  { quarter: 4, amount: 500_000, description: 'Home purchase' },
  { quarter: 20, amount: 250_000, description: 'Education expense' },
  { quarter: 60, amount: 100_000, description: 'Large gift' },
];

// Preset scenarios for comparison
export const PRESET_SCENARIOS = [
  {
    name: 'Base Case',
    description: 'Moderate growth with standard spending',
    params: {
      ...DEFAULT_PARAMS,
    },
  },
  {
    name: 'High Spending',
    description: 'Base case with increased quarterly spending',
    params: {
      ...DEFAULT_PARAMS,
      quarterlyFixedSpending: 150_000,
    },
  },
  {
    name: 'Conservative Allocation',
    description: 'Lower risk, lower return portfolio',
    params: {
      ...DEFAULT_PARAMS,
      annualReturn: 0.05,
      annualVolatility: 0.08,
    },
  },
  {
    name: 'Aggressive Growth',
    description: 'Higher risk, higher return portfolio',
    params: {
      ...DEFAULT_PARAMS,
      annualReturn: 0.10,
      annualVolatility: 0.18,
    },
  },
];
