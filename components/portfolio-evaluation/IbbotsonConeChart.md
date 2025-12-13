# Ibbotson Cone Chart Component

## Overview
The `IbbotsonConeChart` component visualizes portfolio projections using the log-normal geometric Brownian motion (GBM) model, following the Ibbotson methodology. It displays confidence bands showing potential portfolio value ranges over different time horizons (1-30 years).

## Mathematical Foundation

### Log-Normal GBM Model
The component uses the following formulation:
- **Drift**: `μ = ln(1 + E[R]) - 0.5σ²`
- **Median (50th percentile)**: `S_t = S_0 × exp(μt)`
- **Other percentiles**: `S_t = S_0 × exp(μt + z × σ × √t)`

Where:
- `E[R]` = Expected annual arithmetic return
- `σ` = Annual volatility (standard deviation)
- `S_0` = Initial investment
- `t` = Time in years
- `z` = Z-score for the desired percentile

### Z-Scores Used
- **5th percentile**: z = -1.645
- **25th percentile**: z = -0.674
- **50th percentile**: z = 0 (median)
- **75th percentile**: z = 0.674
- **95th percentile**: z = 1.645

## Props

```typescript
interface IbbotsonConeChartProps {
  selectedPortfolio?: PortfolioWithMetrics;  // Portfolio to project
  benchmarkReturn?: number;                   // Benchmark expected return (e.g., 0.07 = 7%)
  benchmarkRisk?: number;                     // Benchmark volatility (e.g., 0.12 = 12%)
  initialInvestment?: number;                 // Starting investment amount (default: 100)
  showBenchmarkCone?: boolean;                // Whether to overlay benchmark cone
}
```

## Features

### 1. Confidence Bands
- **Outer band (5th-95th percentile)**: Lighter shade, 90% confidence interval
- **Inner band (25th-75th percentile)**: Darker shade, 50% confidence interval

### 2. Dual Cone Support
- Portfolio cone (turquoise/cyan colors)
- Benchmark cone (purple colors, optional overlay)

### 3. Time Horizons
Projects portfolio values at: 1, 3, 5, 10, 15, 20, 25, and 30 years

### 4. Interactive Tooltip
Shows projected values at each time point for median paths

## Usage Example

```tsx
import IbbotsonConeChart from '@/components/portfolio-evaluation/IbbotsonConeChart';

function MyComponent() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioWithMetrics>();
  const [initialInvestment, setInitialInvestment] = useState(100000);
  const [showBenchmark, setShowBenchmark] = useState(true);

  return (
    <div style={{ height: '500px' }}>
      <IbbotsonConeChart
        selectedPortfolio={selectedPortfolio}
        benchmarkReturn={0.07}
        benchmarkRisk={0.12}
        initialInvestment={initialInvestment}
        showBenchmarkCone={showBenchmark}
      />
    </div>
  );
}
```

## Integration in Portfolio Evaluation Page

The component is integrated with:
- **Portfolio selector**: Dropdown to choose which portfolio to project
- **Initial investment input**: Number input to set starting capital
- **Benchmark toggle**: Checkbox to show/hide benchmark comparison

## Visual Design

### Colors
- **Portfolio cone**: Turquoise theme (`#00E7D7`)
  - 5-95% band: `rgba(0, 231, 215, 0.12)`
  - 25-75% band: `rgba(0, 231, 215, 0.25)`
  - Median line: `#00E7D7` (solid, thick)

- **Benchmark cone**: Purple theme (`#821A8B`)
  - 5-95% band: `rgba(130, 26, 139, 0.10)`
  - 25-75% band: `rgba(130, 26, 139, 0.20)`
  - Median line: `#821A8B` (dashed)

### Chart Layout
- X-axis: Time horizons (labeled as "1y", "3y", "5y", etc.)
- Y-axis: Portfolio value in dollars (formatted with k/M suffixes)
- Grid: Light gray dotted lines
- Margins: Adequate spacing for labels and legend

## Empty State
When no portfolio is selected, displays:
```
Select a portfolio to view projection cone
Initial investment: $[amount]
```

## Calculation Notes

1. **Return validation**: Returns below -99% are rejected to avoid invalid logarithms
2. **Risk floor**: Volatility is floored at 0 to prevent negative values
3. **Asymmetric distributions**: The log-normal model produces right-skewed distributions, realistic for portfolio growth
4. **Compounding**: Model accounts for volatility drag through the `-0.5σ²` drift adjustment

## Differences from Legacy Implementation

### Preserved from Legacy
- Identical mathematical formulation (GBM with drift adjustment)
- Same z-scores for percentiles
- Same time horizons (1-30 years)
- Same color scheme for portfolio vs benchmark

### Improvements in React Version
- Uses Recharts `<Area>` components for smooth confidence bands
- Better tooltip interactions
- Responsive design with `ResponsiveContainer`
- Type-safe props with TypeScript
- Cleaner separation of calculation logic from rendering

## Performance Considerations
- Calculations run client-side with minimal overhead
- No animation by default (`isAnimationActive={false}`)
- Data computed once per parameter change
- Chart updates efficiently via React state management

## References
- Legacy implementation: `/current prod/app_eval.py` (lines 1831-1931)
- Mathematical basis: Log-normal geometric Brownian motion
- Methodology: Ibbotson Associates portfolio projection framework
