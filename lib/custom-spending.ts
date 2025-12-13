/**
 * Custom Spending Helpers
 * Converts spending events to simulation-compatible formats
 */

import type { SpendingEvent } from './types';

/**
 * Convert spending events to quarter-indexed spending map
 * This is used by the simulation engine's customSpending parameter
 */
export function convertEventsToCustomSpending(
  events: SpendingEvent[],
  totalQuarters: number,
  getCurrentValue?: (quarter: number) => number
): Record<number, number> {
  const customSpending: Record<number, number> = {};

  events.forEach((event) => {
    if (event.type === 'one-time' && event.quarter) {
      // One-time withdrawal at specific quarter
      if (event.quarter >= 1 && event.quarter <= totalQuarters) {
        customSpending[event.quarter] = (customSpending[event.quarter] || 0) + event.amount;
      }
    } else if (event.type === 'recurring') {
      // Recurring withdrawals
      const start = event.startQuarter || 1;
      const end = Math.min(event.endQuarter || totalQuarters, totalQuarters);
      const frequency = event.frequency || 1;

      for (let q = start; q <= end; q += frequency) {
        customSpending[q] = (customSpending[q] || 0) + event.amount;
      }
    } else if (event.type === 'percentage' && getCurrentValue) {
      // Percentage-based withdrawals (calculated per quarter)
      // Note: For simulation, we need to calculate this dynamically
      // This is a preview calculation only
      const percentage = event.percentage || 0;
      for (let q = 1; q <= totalQuarters; q++) {
        const portfolioValue = getCurrentValue(q);
        customSpending[q] = (customSpending[q] || 0) + portfolioValue * percentage;
      }
    }
  });

  return customSpending;
}

/**
 * Get total spending for a given quarter from events
 */
export function getQuarterlySpending(
  events: SpendingEvent[],
  quarter: number,
  portfolioValue: number
): number {
  let total = 0;

  events.forEach((event) => {
    if (event.type === 'one-time' && event.quarter === quarter) {
      total += event.amount;
    } else if (event.type === 'recurring') {
      const start = event.startQuarter || 1;
      const end = event.endQuarter || Infinity;
      const frequency = event.frequency || 1;

      if (quarter >= start && quarter <= end && (quarter - start) % frequency === 0) {
        total += event.amount;
      }
    } else if (event.type === 'percentage') {
      total += portfolioValue * (event.percentage || 0);
    }
  });

  return total;
}

/**
 * Calculate total impact of all spending events over simulation period
 */
export function calculateTotalSpendingImpact(
  events: SpendingEvent[],
  totalQuarters: number,
  initialValue: number
): {
  totalFixed: number;
  totalPercentage: number;
  estimatedTotal: number;
} {
  let totalFixed = 0;
  let totalPercentage = 0;

  events.forEach((event) => {
    if (event.type === 'one-time') {
      totalFixed += event.amount;
    } else if (event.type === 'recurring') {
      const start = event.startQuarter || 1;
      const end = Math.min(event.endQuarter || totalQuarters, totalQuarters);
      const frequency = event.frequency || 1;
      const occurrences = Math.floor((end - start) / frequency) + 1;
      totalFixed += event.amount * occurrences;
    } else if (event.type === 'percentage') {
      totalPercentage += event.percentage || 0;
    }
  });

  // Estimate percentage impact (simple approximation)
  const estimatedPercentageTotal = initialValue * totalPercentage * totalQuarters;

  return {
    totalFixed,
    totalPercentage,
    estimatedTotal: totalFixed + estimatedPercentageTotal,
  };
}

/**
 * Validate spending events
 */
export function validateSpendingEvents(
  events: SpendingEvent[],
  totalQuarters: number
): string[] {
  const errors: string[] = [];

  events.forEach((event, idx) => {
    if (!event.description || event.description.trim() === '') {
      errors.push(`Event ${idx + 1}: Description is required`);
    }

    if (event.type === 'one-time') {
      if (!event.quarter || event.quarter < 1 || event.quarter > totalQuarters) {
        errors.push(`Event "${event.description}": Invalid quarter (must be 1-${totalQuarters})`);
      }
      if (!event.amount || event.amount <= 0) {
        errors.push(`Event "${event.description}": Amount must be positive`);
      }
    } else if (event.type === 'recurring') {
      if (!event.startQuarter || event.startQuarter < 1) {
        errors.push(`Event "${event.description}": Invalid start quarter`);
      }
      if (!event.endQuarter || event.endQuarter > totalQuarters) {
        errors.push(`Event "${event.description}": Invalid end quarter`);
      }
      if ((event.startQuarter || 0) > (event.endQuarter || 0)) {
        errors.push(`Event "${event.description}": Start quarter must be before end quarter`);
      }
      if (!event.frequency || event.frequency < 1) {
        errors.push(`Event "${event.description}": Invalid frequency`);
      }
      if (!event.amount || event.amount <= 0) {
        errors.push(`Event "${event.description}": Amount must be positive`);
      }
    } else if (event.type === 'percentage') {
      if (!event.percentage || event.percentage <= 0 || event.percentage > 1) {
        errors.push(`Event "${event.description}": Percentage must be between 0 and 100%`);
      }
    }
  });

  return errors;
}
