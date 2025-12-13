/**
 * Mock data and presets for the portfolio app
 */

import type {
  PortfolioPreset,
  SimulationParams,
  GlobalSimulationParams,
  SimulationSlotParams,
  ChartSizingParams,
  MultiSlotSimulationState,
} from './types';

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

// Multi-slot simulation defaults (matching legacy app_mcs.py)
const currentYear = new Date().getFullYear();

export const DEFAULT_GLOBAL_PARAMS: GlobalSimulationParams = {
  initialValue: 10_000_000,
  numSimulations: 1000,
  inflationRate: 0.025,      // 2.5%
  afterTaxRate: 0.03,        // 3%
  currency: 'USD',           // Display currency
};

export const DEFAULT_SLOT_1: SimulationSlotParams = {
  name: 'Simulation 1',
  durationQuarters: 160,     // 40 years
  returnInitial: 0.07,       // 7%
  returnUpdate1: 0.06,       // 6%
  returnUpdate2: 0.05,       // 5%
  volInitial: 0.12,          // 12%
  volUpdate1: 0.10,          // 10%
  volUpdate2: 0.08,          // 8%
  update1Year: currentYear + 10,
  update2Year: currentYear + 20,
};

export const DEFAULT_SLOT_2: SimulationSlotParams = {
  name: 'Simulation 2',
  durationQuarters: 160,     // 40 years
  returnInitial: 0.08,       // 8%
  returnUpdate1: 0.07,       // 7%
  returnUpdate2: 0.06,       // 6%
  volInitial: 0.15,          // 15%
  volUpdate1: 0.13,          // 13%
  volUpdate2: 0.11,          // 11%
  update1Year: currentYear + 10,
  update2Year: currentYear + 20,
};

export const DEFAULT_SLOT_3: SimulationSlotParams = {
  name: 'Simulation 3',
  durationQuarters: 160,     // 40 years
  returnInitial: 0.05,       // 5%
  returnUpdate1: 0.04,       // 4%
  returnUpdate2: 0.04,       // 4%
  volInitial: 0.08,          // 8%
  volUpdate1: 0.07,          // 7%
  volUpdate2: 0.06,          // 6%
  update1Year: currentYear + 10,
  update2Year: currentYear + 20,
};

export const DEFAULT_CHART_SIZING: ChartSizingParams = {
  lineChartWidth: 1200,
  lineChartHeight: 600,
  barChartHeight: 400,
  probChartHeight: 400,
};

export const DEFAULT_MULTI_SLOT_STATE: MultiSlotSimulationState = {
  globalParams: DEFAULT_GLOBAL_PARAMS,
  slot1: DEFAULT_SLOT_1,
  slot2: DEFAULT_SLOT_2,
  slot3: DEFAULT_SLOT_3,
  chartSizing: DEFAULT_CHART_SIZING,
  results: {
    slot1: null,
    slot2: null,
    slot3: null,
  },
};
