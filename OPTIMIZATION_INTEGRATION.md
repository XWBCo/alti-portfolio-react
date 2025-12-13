# Portfolio Optimization - Python API Integration

React UI integration for portfolio optimization endpoints on the Python FastAPI service (port 8001).

## Overview

The portfolio evaluation page now has two modes:

1. **Efficient Frontier** - Client-side JavaScript optimization using quadprog
2. **Python API Optimization** - Server-side optimization via FastAPI with advanced features

## New Components

### API Integration Layer

**`/lib/optimization-api-types.ts`**
- TypeScript interfaces for all optimization API endpoints
- Request/response types for frontier, benchmark, inefficiencies, optimal portfolio

**`/lib/hooks/useOptimizationAPI.ts`**
- React hooks for calling optimization endpoints
- `useEfficientFrontier()` - Generate efficient frontier
- `useBenchmark()` - Calculate blended benchmarks
- `usePortfolioInefficiencies()` - Analyze portfolio vs optimal
- `useOptimalPortfolio()` - Find optimal portfolio for constraints
- `useOptimizationAssets()` - Get available assets

### UI Components

**`/components/portfolio-evaluation/AdvancedOptimizationPanel.tsx`**
- Optimization goal selector (Max Sharpe, Target Return, Target Risk)
- Interactive sliders for target constraints
- Optimize button with loading states
- API status indicators

**`/components/portfolio-evaluation/BenchmarkComparison.tsx`**
- Equity/Fixed Income allocation slider
- Blended benchmark calculation
- Portfolio vs benchmark deviation display
- Component breakdown (equity vs fixed income metrics)

**`/components/portfolio-evaluation/OptimizationResults.tsx`**
- Optimal portfolio weights display
- Current vs optimal comparison table
- Risk/return metrics summary
- CSV export functionality
- Color-coded position changes (increase/decrease)

### Page Updates

**`/app/portfolio-evaluation/page.tsx`**
- Tab navigation between Efficient Frontier and Python API modes
- Integrated all new components into tabbed layout
- Added export handler for optimal portfolio results
- State management for optimization results

## API Endpoints Used

All requests go through Next.js proxy at `/api/optimization/route.ts`:

- `POST /api/optimization` with `endpoint: 'frontier'` - Generate efficient frontier
- `POST /api/optimization` with `endpoint: 'benchmark'` - Calculate blended benchmark
- `POST /api/optimization` with `endpoint: 'inefficiencies'` - Analyze inefficiencies
- `POST /api/optimization` with `endpoint: 'optimal-portfolio'` - Find optimal portfolio
- `GET /api/optimization` - Get available assets

Backend Python API must be running on `http://localhost:8001`.

## Features

### Advanced Optimization Panel

1. **Max Sharpe Ratio** - Unconstrained optimization for best risk-adjusted returns
2. **Target Return** - Minimize risk for desired return level (2-15% range)
3. **Target Risk** - Maximize return for risk tolerance (2-20% range)

All respect mode (core/core_private/unconstrained) and caps template constraints.

### Benchmark Comparison

- Interactive slider for equity/fixed income allocation (0-100%)
- Real-time blended benchmark calculation
- Displays both component metrics and blended results
- Portfolio deviation indicators (return/risk vs benchmark)

### Optimization Results

- Side-by-side comparison of current vs optimal weights
- Color-coded changes (green = increase, red = decrease)
- Sorted by absolute change magnitude
- Export to CSV with single click
- Position change summary stats

## Usage Flow

1. Navigate to Portfolio Evaluation page
2. Set optimization parameters (mode, constraints) in left sidebar
3. Upload portfolios for comparison (optional)
4. Click "Python API Optimization" tab
5. Select optimization goal (Sharpe, Return, or Risk)
6. Adjust target constraints if applicable
7. Click "Find Optimal Portfolio"
8. Review results in benchmark comparison and results table
9. Export optimal weights to CSV

## Error Handling

- API connection errors displayed inline
- Loading states for all async operations
- Graceful fallbacks for missing data
- TypeScript strict null checks throughout

## Export Format

CSV export includes:
```
Asset,Weight
US Equity Large Cap,0.25
US Equity Mid Cap,0.15
...
```

Weights are decimal format (0-1), not percentages.

## Development

Run development server:
```bash
cd /Users/xavi_court/claude_code/alti-portfolio-react
npm run dev
```

Ensure Python API is running:
```bash
# In separate terminal
cd /path/to/python/api
uvicorn main:app --port 8001 --reload
```

Build for production:
```bash
npm run build
npm start
```

## Dependencies

- React 19.2.0
- Next.js 16.0.5
- Recharts 3.5.0 (for charts)
- Motion 12.23.24 (for animations)
- TypeScript 5.x (for type safety)

No additional packages required - uses existing dependencies.

## File Structure

```
/lib/
  optimization-api-types.ts       # API types
  hooks/
    useOptimizationAPI.ts         # API integration hooks

/components/portfolio-evaluation/
  AdvancedOptimizationPanel.tsx   # Optimization controls
  BenchmarkComparison.tsx         # Benchmark analysis
  OptimizationResults.tsx         # Results display
  EfficientFrontierChart.tsx      # (existing) Frontier chart
  ParameterPanel.tsx              # (existing) Left sidebar
  PortfolioTable.tsx              # (existing) Holdings table
  MetricsSummary.tsx              # (existing) Metrics display

/app/
  portfolio-evaluation/
    page.tsx                      # Main page with tabs
  api/
    optimization/
      route.ts                    # Next.js API proxy
```

## Notes

- Python API integration is optional - page works in client-side mode if API unavailable
- All optimization respects asset universe mode and weight constraints
- Export uses browser download API (no server roundtrip)
- TypeScript ensures type safety across API boundary
- React hooks handle caching and error states automatically
