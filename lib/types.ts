/**
 * TypeScript types for Monte Carlo simulation and portfolio analysis
 */

// Simulation parameters
export interface SimulationParams {
  initialValue: number;
  annualReturn: number;        // Decimal (e.g., 0.07 for 7%)
  annualVolatility: number;    // Decimal (e.g., 0.12 for 12%)
  quarterlyFixedSpending: number;
  quarterlyPercentSpending: number;  // Decimal (e.g., 0.01 for 1%)
  durationYears: number;
  numSimulations: number;
  inflationRate: number;       // Decimal (e.g., 0.025 for 2.5%)
  afterTaxRate?: number;       // Decimal (e.g., 0.03 for 3%) - subtracted from returns
  oneTimeSpend?: number;
  oneTimeQuarter?: number;
  customSpending?: Record<number, number>;  // quarter -> amount
  // Piecewise/regime change parameters
  usePiecewise?: boolean;
  returnUpdate1?: number;      // Return for period 2 (decimal)
  returnUpdate2?: number;      // Return for period 3 (decimal)
  volUpdate1?: number;         // Volatility for period 2 (decimal)
  volUpdate2?: number;         // Volatility for period 3 (decimal)
  update1Year?: number;        // Year when period 2 starts
  update2Year?: number;        // Year when period 3 starts
}

// Piecewise return/volatility parameters for advanced scenarios
export interface PiecewiseParams {
  returnInitial: number;
  returnUpdate1?: number;
  returnUpdate2?: number;
  volInitial: number;
  volUpdate1?: number;
  volUpdate2?: number;
  update1Year?: number;
  update2Year?: number;
  startYear?: number;
}

// Simulation results
export interface SimulationResult {
  paths: number[][];           // [numSims][quarters+1]
  median: number[];
  percentile25: number[];
  percentile75: number[];
  percentile5: number[];
  percentile95: number[];
  years: number[];
  inflationLine: number[];
  finalValues: number[];
  probabilities: SimulationProbabilities;
}

export interface SimulationProbabilities {
  outperformInflation: number;   // % of simulations beating inflation
  significantLoss: number;       // % losing >50% of initial value
  portfolioDepletion: number;    // % reaching $0
  maintainValue: number;         // % maintaining initial value
}

// Scenario for comparison
export interface Scenario {
  id: string;
  name: string;
  params: SimulationParams;
  color: string;
  result?: SimulationResult;
}

// Chart data point
export interface ChartDataPoint {
  year: number;
  quarter: number;
  median: number;
  p25: number;
  p75: number;
  p5: number;
  p95: number;
  inflation: number;
  [key: string]: number;  // Allow dynamic path keys
}

// Sample portfolio presets
export interface PortfolioPreset {
  name: string;
  expectedReturn: number;  // Percentage
  volatility: number;      // Percentage
  description: string;
}

// Form state
export interface SimulationFormState {
  initialValue: string;
  annualReturn: string;
  annualVolatility: string;
  quarterlyFixedSpending: string;
  quarterlyPercentSpending: string;
  durationYears: string;
  numSimulations: string;
  inflationRate: string;
}

// Spending event for custom spending editor
export interface SpendingEvent {
  id: string;
  type: 'one-time' | 'recurring' | 'percentage';
  amount: number;
  description: string;
  quarter?: number;           // For one-time events
  startQuarter?: number;      // For recurring events
  endQuarter?: number;        // For recurring events
  frequency?: number;         // For recurring: every N quarters
  percentage?: number;        // For percentage-based (decimal, e.g., 0.05 for 5%)
}

// Computed spending schedule (for display table)
export interface SpendingScheduleItem {
  quarter: number;
  year: number;
  quarterInYear: number;
  amount: number;
  source: string;             // Which event(s) caused this spending
  isRecurring: boolean;
}

// Multi-slot simulation support (legacy app_mcs.py parity)
export interface SimulationSlotParams {
  name: string;
  durationQuarters: number;
  // Piecewise parameters (always using piecewise mode)
  returnInitial: number;       // Decimal (e.g., 0.07 for 7%)
  returnUpdate1: number;
  returnUpdate2: number;
  volInitial: number;          // Decimal (e.g., 0.12 for 12%)
  volUpdate1: number;
  volUpdate2: number;
  update1Year: number;         // Calendar year when period 2 starts
  update2Year: number;         // Calendar year when period 3 starts
  customSpending?: Record<number, number>;  // quarter -> spending amount
}

// Currency type for display
export type Currency = 'USD' | 'GBP' | 'EUR';

// Currency symbols mapping
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
};

// Global parameters shared across all simulation slots
export interface GlobalSimulationParams {
  initialValue: number;
  numSimulations: number;
  inflationRate: number;       // Decimal (e.g., 0.025 for 2.5%)
  afterTaxRate: number;        // Decimal (e.g., 0.03 for 3%)
  currency: Currency;          // Display currency (USD, GBP, EUR)
}

// Chart sizing controls
export interface ChartSizingParams {
  lineChartWidth: number;      // px
  lineChartHeight: number;     // px
  barChartHeight: number;      // px
  probChartHeight: number;     // px
}

// Multi-slot simulation state
export interface MultiSlotSimulationState {
  globalParams: GlobalSimulationParams;
  slot1: SimulationSlotParams;
  slot2: SimulationSlotParams;
  slot3: SimulationSlotParams;
  chartSizing: ChartSizingParams;
  results: {
    slot1: SimulationResult | null;
    slot2: SimulationResult | null;
    slot3: SimulationResult | null;
  };
}
