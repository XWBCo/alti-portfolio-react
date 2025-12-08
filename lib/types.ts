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
  quarter: number;
  amount: number;
  description: string;
}
