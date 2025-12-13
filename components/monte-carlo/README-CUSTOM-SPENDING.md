# Custom Spending Panel - Monte Carlo Simulation

## Overview

The Custom Spending Panel allows users to model specific withdrawal scenarios beyond regular spending patterns in Monte Carlo simulations. This feature provides parity with the legacy Dash app's custom spending functionality.

## Features

### Three Spending Event Types

1. **One-Time Withdrawals**
   - Single withdrawal at a specific quarter
   - Example: Home down payment, college tuition payment
   - Inputs: Amount, Quarter

2. **Recurring Withdrawals**
   - Regular withdrawals over a period
   - Example: Annual distributions, quarterly bonuses
   - Inputs: Amount, Start Quarter, End Quarter, Frequency (every N quarters)

3. **Percentage-Based Withdrawals**
   - Variable withdrawals based on portfolio value
   - Example: 5% annual distribution
   - Inputs: Percentage (applied quarterly to current portfolio value)

## Components

### CustomSpendingPanel.tsx
Main component for managing spending events:
- Event list with type badges (one-time, recurring, percentage)
- Add/Edit form with dynamic fields based on event type
- Spending schedule table showing all withdrawals by quarter
- Impact summary showing total fixed and percentage-based spending

### CustomSpendingModal.tsx
Modal wrapper for the spending panel:
- Full-screen modal for better UX in sidebar layout
- Accessed via "Manage Events" button in ParameterPanel
- Shows event count in footer

### SpendingImpactSummary.tsx
Visual summary card showing:
- Total fixed withdrawals
- Total percentage-based withdrawals
- Estimated total impact
- Breakdown by event type

## Integration

### In ParameterPanel
```tsx
const [spendingEvents, setSpendingEvents] = useState<SpendingEvent[]>([]);

const handleSpendingEventsChange = (events: SpendingEvent[]) => {
  setSpendingEvents(events);
  const customSpending = convertEventsToCustomSpending(events, totalQuarters);
  updateParam('customSpending', customSpending);
};
```

### In Simulation Engine
The `customSpending` parameter is passed to `runSimulation()`:
```tsx
const result = runSimulation({
  ...params,
  customSpending: { 4: 50000, 8: 50000, ... } // quarter -> amount
});
```

## Helper Functions (lib/custom-spending.ts)

### convertEventsToCustomSpending
Converts `SpendingEvent[]` to simulation-compatible `Record<number, number>` format.

### getQuarterlySpending
Calculates total spending for a specific quarter from all events.

### calculateTotalSpendingImpact
Computes total impact over simulation period:
- Total fixed withdrawals
- Total percentage-based rate
- Estimated total (approximation for percentage events)

### validateSpendingEvents
Validates event data before simulation:
- Required fields (description, amount, quarters)
- Valid quarter ranges
- Valid percentage ranges (0-100%)

## Data Flow

1. User adds/edits events in CustomSpendingPanel
2. Events stored in ParameterPanel state
3. `convertEventsToCustomSpending()` converts to simulation format
4. SimulationParams updated with customSpending map
5. Simulation engine applies custom spending at each quarter
6. Results reflect impact of custom withdrawals

## Example Usage

### One-Time Event
```tsx
{
  id: 'event-1',
  type: 'one-time',
  description: 'Home Down Payment',
  amount: 200000,
  quarter: 8 // Year 2, Q4
}
```

### Recurring Event
```tsx
{
  id: 'event-2',
  type: 'recurring',
  description: 'Annual Distribution',
  amount: 50000,
  startQuarter: 1,
  endQuarter: 40,
  frequency: 4 // Every 4 quarters (annually)
}
```

### Percentage Event
```tsx
{
  id: 'event-3',
  type: 'percentage',
  description: '5% Annual Withdrawal',
  amount: 0, // Not used for percentage
  percentage: 0.0125 // 5% annual = 1.25% quarterly
}
```

## Visual Indicators

- **One-Time**: Blue badge, shows quarter and year
- **Recurring**: Green badge, shows frequency and range
- **Percentage**: Purple badge, shows percentage per quarter

## Schedule Table

Displays all spending events by quarter:
- Quarter number (Q1, Q2, ...)
- Year
- Amount
- Source (which event(s) caused the spending)
- Recurring indicator

## Impact Summary

Shows aggregated impact:
- Total fixed withdrawals (sum of all one-time and recurring)
- Total percentage rate (sum of all percentage-based)
- Estimated total (approximation using initial portfolio value)
- Breakdown by type

## Limitations

- Percentage-based events are estimated using initial portfolio value for display
- Actual percentage withdrawals vary with portfolio performance during simulation
- Maximum duration determined by simulation duration (durationYears * 4 quarters)

## Future Enhancements

- Visual markers on simulation chart showing spending events
- Comparison mode: with/without custom spending
- Import/export spending scenarios
- Templated events (college fund, retirement planning, etc.)
- Inflation-adjusted recurring events
- Conditional events (e.g., only withdraw if portfolio > threshold)
