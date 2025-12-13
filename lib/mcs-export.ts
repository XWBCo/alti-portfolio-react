/**
 * Monte Carlo Simulation Excel Export
 * Exports simulation results to CSV (Excel-compatible)
 */

import type { SimulationResult, SimulationSlotParams, GlobalSimulationParams } from './types';
import { formatCurrency } from './simulation';

interface ExportData {
  globalParams: GlobalSimulationParams;
  slots: {
    params: SimulationSlotParams;
    result: SimulationResult | null;
  }[];
}

/**
 * Generate CSV content for simulation results
 */
function generateSimulationCSV(
  slotName: string,
  params: SimulationSlotParams,
  result: SimulationResult,
  globalParams: GlobalSimulationParams
): string {
  const lines: string[] = [];

  // Header
  lines.push(`"${slotName} - Monte Carlo Simulation Results"`);
  lines.push('');

  // Parameters section
  lines.push('"Parameters"');
  lines.push(`"Initial Value","${formatCurrency(globalParams.initialValue)}"`);
  lines.push(`"Duration","${params.durationQuarters / 4} years (${params.durationQuarters} quarters)"`);
  lines.push(`"Number of Simulations","${globalParams.numSimulations}"`);
  lines.push(`"Inflation Rate","${(globalParams.inflationRate * 100).toFixed(2)}%"`);
  lines.push(`"After-Tax Rate","${(globalParams.afterTaxRate * 100).toFixed(2)}%"`);
  lines.push('');

  // Return/Volatility schedule
  lines.push('"Return & Volatility Schedule"');
  lines.push(`"Initial Return","${(params.returnInitial * 100).toFixed(2)}%"`);
  lines.push(`"Update 1 Return","${(params.returnUpdate1 * 100).toFixed(2)}%"`);
  lines.push(`"Update 2 Return","${(params.returnUpdate2 * 100).toFixed(2)}%"`);
  lines.push(`"Initial Volatility","${(params.volInitial * 100).toFixed(2)}%"`);
  lines.push(`"Update 1 Volatility","${(params.volUpdate1 * 100).toFixed(2)}%"`);
  lines.push(`"Update 2 Volatility","${(params.volUpdate2 * 100).toFixed(2)}%"`);
  lines.push(`"Update 1 Year","${params.update1Year}"`);
  lines.push(`"Update 2 Year","${params.update2Year}"`);
  lines.push('');

  // Probabilities
  lines.push('"Outcome Probabilities"');
  lines.push(`"Outperform Inflation","${(result.probabilities.outperformInflation * 100).toFixed(1)}%"`);
  lines.push(`"Maintain Initial Value","${(result.probabilities.maintainValue * 100).toFixed(1)}%"`);
  lines.push(`"Significant Loss (>50%)","${(result.probabilities.significantLoss * 100).toFixed(1)}%"`);
  lines.push(`"Portfolio Depletion","${(result.probabilities.portfolioDepletion * 100).toFixed(1)}%"`);
  lines.push('');

  // Percentile data over time
  lines.push('"Percentile Data by Year"');
  lines.push('"Year","5th Percentile","25th Percentile","Median","75th Percentile","95th Percentile","Inflation Benchmark"');

  for (let i = 0; i < result.years.length; i++) {
    const year = result.years[i].toFixed(2);
    const p5 = result.percentile5[i].toFixed(2);
    const p25 = result.percentile25[i].toFixed(2);
    const median = result.median[i].toFixed(2);
    const p75 = result.percentile75[i].toFixed(2);
    const p95 = result.percentile95[i].toFixed(2);
    const inflation = result.inflationLine[i].toFixed(2);
    lines.push(`${year},${p5},${p25},${median},${p75},${p95},${inflation}`);
  }

  return lines.join('\n');
}

/**
 * Download simulation results as CSV
 */
export function downloadSimulationCSV(
  slotName: string,
  params: SimulationSlotParams,
  result: SimulationResult,
  globalParams: GlobalSimulationParams
): void {
  const csv = generateSimulationCSV(slotName, params, result, globalParams);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slotName.replace(/\s+/g, '_')}_simulation.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Download all simulations as a combined CSV
 */
export function downloadAllSimulationsCSV(data: ExportData): void {
  const lines: string[] = [];

  lines.push('"Monte Carlo Simulation Export"');
  lines.push(`"Generated","${new Date().toISOString()}"`);
  lines.push('');

  // Global parameters
  lines.push('"Global Parameters"');
  lines.push(`"Initial Value","${formatCurrency(data.globalParams.initialValue)}"`);
  lines.push(`"Simulations","${data.globalParams.numSimulations}"`);
  lines.push(`"Inflation Rate","${(data.globalParams.inflationRate * 100).toFixed(2)}%"`);
  lines.push(`"After-Tax Rate","${(data.globalParams.afterTaxRate * 100).toFixed(2)}%"`);
  lines.push('');

  // Summary comparison
  lines.push('"Summary Comparison"');
  lines.push('"Metric",' + data.slots.filter(s => s.result).map(s => `"${s.params.name}"`).join(','));

  const activeSlots = data.slots.filter(s => s.result);

  // Duration
  lines.push('"Duration",' + activeSlots.map(s => `"${s.params.durationQuarters / 4} years"`).join(','));

  // Initial return
  lines.push('"Initial Return",' + activeSlots.map(s => `"${(s.params.returnInitial * 100).toFixed(2)}%"`).join(','));

  // Initial volatility
  lines.push('"Initial Volatility",' + activeSlots.map(s => `"${(s.params.volInitial * 100).toFixed(2)}%"`).join(','));

  // Median final value
  lines.push('"Median Final",' + activeSlots.map(s => {
    const lastIdx = s.result!.median.length - 1;
    return `"${formatCurrency(s.result!.median[lastIdx])}"`;
  }).join(','));

  // 5th percentile
  lines.push('"5th Percentile",' + activeSlots.map(s => {
    const lastIdx = s.result!.percentile5.length - 1;
    return `"${formatCurrency(s.result!.percentile5[lastIdx])}"`;
  }).join(','));

  // 95th percentile
  lines.push('"95th Percentile",' + activeSlots.map(s => {
    const lastIdx = s.result!.percentile95.length - 1;
    return `"${formatCurrency(s.result!.percentile95[lastIdx])}"`;
  }).join(','));

  // Probabilities
  lines.push('"P(Outperform Inflation)",' + activeSlots.map(s =>
    `"${(s.result!.probabilities.outperformInflation * 100).toFixed(1)}%"`
  ).join(','));

  lines.push('"P(Maintain Value)",' + activeSlots.map(s =>
    `"${(s.result!.probabilities.maintainValue * 100).toFixed(1)}%"`
  ).join(','));

  lines.push('"P(Depletion)",' + activeSlots.map(s =>
    `"${(s.result!.probabilities.portfolioDepletion * 100).toFixed(1)}%"`
  ).join(','));

  lines.push('');

  // Individual slot data
  for (const slot of activeSlots) {
    lines.push('');
    lines.push(`"${slot.params.name} - Percentile Data"`);
    lines.push('"Year","5th","25th","Median","75th","95th"');

    for (let i = 0; i < slot.result!.years.length; i++) {
      lines.push([
        slot.result!.years[i].toFixed(2),
        slot.result!.percentile5[i].toFixed(2),
        slot.result!.percentile25[i].toFixed(2),
        slot.result!.median[i].toFixed(2),
        slot.result!.percentile75[i].toFixed(2),
        slot.result!.percentile95[i].toFixed(2),
      ].join(','));
    }
  }

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'monte_carlo_simulations.csv';
  link.click();
  URL.revokeObjectURL(url);
}
