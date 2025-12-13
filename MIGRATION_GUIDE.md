# AlTi Portfolio App - Legacy to React Migration Guide

## Quick Reference

| Legacy (Dash/Plotly) | React (Next.js) | Status |
|---------------------|-----------------|--------|
| `dashboard/apps/evaluation.py` | `app/portfolio-evaluation/page.tsx` | ✅ Complete |
| `dashboard/apps/monte_carlo.py` | `app/monte-carlo/page.tsx` | ✅ Complete |
| `dashboard/apps/cma_v2.py` | `app/capital-market-assumptions/page.tsx` | ✅ Complete |
| `dashboard/apps/risk.py` | `app/risk-contribution/page.tsx` | ✅ Complete |

---

## 1. Portfolio Evaluation

### Feature Mapping

| Feature | Legacy | React Files |
|---------|--------|-------------|
| Efficient frontier | `compute_frontier_fast()` | `lib/optimization.ts` → `generateEfficientFrontier()` |
| Mode selection (Core/Core+Private/Unconstrained) | Lines 1244-1299 | `lib/cma-data.ts` → `getAssetsByMode()` |
| Caps templates (Standard/Tight/Loose) | `compute_frontier_fast` | `lib/optimization.ts` → `applyCapsTemplate()` |
| Bucket constraints | Dropdown inputs | `components/portfolio-evaluation/ParameterPanel.tsx` |
| Resample portfolios | Dirichlet sampling | `lib/optimization.ts` → `generateResampledPortfolios()` |
| CSV/Excel upload | `parse_contents()` | `components/portfolio-evaluation/FileUpload.tsx` |
| Ibbotson cone projection | Separate chart | `components/portfolio-evaluation/IbbotsonConeChart.tsx` |
| Growth projection | Table + chart | `components/portfolio-evaluation/GrowthProjectionChart.tsx` |
| Historical metrics | Sharpe, Sortino, DD | `components/portfolio-evaluation/HistoricalMetricsPanel.tsx` |
| Correlation matrix | Heatmap | `components/shared/CorrelationMatrixHeatmap.tsx` |
| Excel export | `dcc.Download` | `lib/exports/excel-portfolio-export.ts` |
| Python API optimization | N/A (new) | `components/portfolio-evaluation/AdvancedOptimizationPanel.tsx` |

### Key Files
```
app/portfolio-evaluation/page.tsx          # Main page
components/portfolio-evaluation/
  ├── ParameterPanel.tsx                   # Left sidebar controls
  ├── EfficientFrontierChart.tsx           # Frontier visualization
  ├── PortfolioTable.tsx                   # Holdings table
  ├── FileUpload.tsx                       # CSV/Excel upload
  └── IbbotsonConeChart.tsx                # Cone projection
lib/optimization.ts                        # Core optimization logic
lib/cma-data.ts                            # Asset class data + correlation matrix
```

---

## 2. Monte Carlo Simulation

### Feature Mapping

| Feature | Legacy | React Files |
|---------|--------|-------------|
| 3 simulation slots | Lines 556-666 | `components/monte-carlo/SimulationSlot.tsx` |
| Piecewise return/vol schedules | Lines 61-222 | `lib/simulation.ts` → `runSimulationPiecewise()` |
| Custom spending upload | Excel upload | `components/monte-carlo/SpendingUpload.tsx` |
| Spending template download | `download-spending-template` | `SpendingUpload.tsx` → `downloadTemplate()` |
| Currency selector | Lines 456-467 | `components/monte-carlo/MultiSlotParameterPanel.tsx` |
| Chart size controls | Lines 545-553 | `lib/types.ts` → `ChartSizingParams` |
| Percentiles (5/25/50/75/95) | Lines 284-287 | `lib/simulation.ts` → percentile calculations |
| Success probability | Lines 293-297 | `components/monte-carlo/OutcomeProbabilities.tsx` |
| Excel export | `download-xlsx-data` | `lib/mcs-export.ts` |
| Drawdown analysis | N/A (new) | `components/monte-carlo/DrawdownAnalysisChart.tsx` |

### Key Files
```
app/monte-carlo/page.tsx                   # Main page
components/monte-carlo/
  ├── MultiSlotParameterPanel.tsx          # Global params + 3 slots
  ├── SimulationSlot.tsx                   # Individual slot controls
  ├── SimulationChart.tsx                  # Path visualization
  ├── OutcomeProbabilities.tsx             # Success rates
  ├── SpendingUpload.tsx                   # Custom spending upload
  └── DrawdownAnalysisChart.tsx            # Drawdown chart (NEW)
lib/simulation.ts                          # Monte Carlo engine
lib/types.ts                               # SimulationSlotParams, GlobalSimulationParams
lib/mcs-export.ts                          # Excel export
```

---

## 3. Capital Market Assumptions

### Feature Mapping

| Feature | Legacy | React Files |
|---------|--------|-------------|
| Currency selector (USD/EUR/GBP) | Lines 114-117 | `components/capital-market-assumptions/ParameterPanel.tsx` |
| 5 economic scenarios | Lines 52-78 | `lib/cma-types.ts` → `SCENARIO_ADJUSTMENTS` |
| CMA data table | Lines 158-184 | `components/capital-market-assumptions/CMATable.tsx` |
| Risk/Return scatter | Lines 187-234 | `components/capital-market-assumptions/RiskReturnScatter.tsx` |
| Beta matrix heatmap | Lines 83-101 | `components/capital-market-assumptions/BetaMatrixHeatmap.tsx` |
| Correlation matrix | Removed in legacy | `components/shared/CorrelationMatrixHeatmap.tsx` (NEW) |
| CMA Excel download | Lines 243-253 | `page.tsx` → `handleDownloadExcel()` |
| Return series CSV | Lines 255-262 | `lib/return-series-export.ts` |
| Methodology PDF links | Lines 132-134 | `ParameterPanel.tsx` → PDF buttons |

### Key Files
```
app/capital-market-assumptions/page.tsx    # Main page
components/capital-market-assumptions/
  ├── ParameterPanel.tsx                   # Currency, scenario, downloads
  ├── CMATable.tsx                         # Sortable asset table
  ├── RiskReturnScatter.tsx                # Interactive scatter plot
  └── BetaMatrixHeatmap.tsx                # Beta visualization
lib/cma-types.ts                           # Types + scenario adjustments
lib/cma-mock-data.ts                       # 35+ asset class data
lib/return-series-export.ts                # CSV export
```

---

## 4. Risk Contribution

### Feature Mapping

| Feature | Legacy | React Files |
|---------|--------|-------------|
| Portfolio presets | Dropdown | `lib/risk-types.ts` → `SAMPLE_RISK_PORTFOLIOS` |
| CSV portfolio upload | `parse_upload_to_df` | `components/risk-contribution/PortfolioUpload.tsx` |
| Benchmark selector | Optional comparison | `components/risk-contribution/ParameterPanel.tsx` |
| EWMA vs Historical toggle | Lambda 0.94 | `ParameterPanel.tsx` → `useEwma` |
| PCTR chart | Bar chart | `components/risk-contribution/RiskContributionChart.tsx` |
| Security-level risk | Per-holding PCTR | `components/risk-contribution/SecurityRiskChart.tsx` |
| Factor decomposition | LASSO betas | `components/risk-contribution/FactorExposureChart.tsx` |
| Factor beta heatmap | Visualization | `components/risk-contribution/FactorBetaHeatmap.tsx` |
| Active exposures | Bar chart | `components/risk-contribution/ActiveFactorExposureChart.tsx` |
| Segment tracking error | Growth/Stability | `components/risk-contribution/SegmentTrackingError.tsx` |
| Stress scenarios | 8 historical periods | `components/risk-contribution/StressScenariosTable.tsx` |
| Report export | PDF | `components/risk-contribution/ReportBuilder.tsx` |

### Key Files
```
app/risk-contribution/page.tsx             # Main page
components/risk-contribution/
  ├── ParameterPanel.tsx                   # Portfolio selection + settings
  ├── PortfolioUpload.tsx                  # CSV upload
  ├── RiskContributionChart.tsx            # PCTR vs Weight
  ├── SecurityRiskChart.tsx                # Top holdings risk
  ├── FactorExposureChart.tsx              # Factor decomposition
  ├── FactorBetaHeatmap.tsx                # Beta matrix
  ├── StressScenariosTable.tsx             # Historical scenarios
  └── ReportBuilder.tsx                    # PDF export modal
lib/risk-types.ts                          # Types + sample portfolios
app/api/risk/route.ts                      # API proxy to Python
app/api/stress/route.ts                    # Stress API proxy
```

---

## API Integration

React proxies requests to Python FastAPI (port 8001):

```
app/api/
  ├── risk/route.ts          # → localhost:8001/api/risk/*
  ├── stress/route.ts        # → localhost:8001/api/stress/*
  └── optimization/route.ts  # → localhost:8001/api/optimization/*
```

**Note:** `optimization/route.ts` maps `standard` → `std` for `caps_template`.

### Which Apps Use API

| App | API Required? | Endpoints Used | Works Offline? |
|-----|---------------|----------------|----------------|
| **Portfolio Evaluation** | Optional | `/api/optimization/*` | ✅ Yes - client-side `quadprog` |
| **Monte Carlo** | No | None | ✅ Yes - fully client-side |
| **CMA** | No | None | ✅ Yes - fully client-side |
| **Risk Contribution** | **Required** | `/api/risk/*`, `/api/stress/*` | ❌ No - needs Python backend |

---

## Outstanding Gaps

### By App

| App | Gap | Impact | Notes |
|-----|-----|--------|-------|
| **Risk Contribution** | Returns zeros | High | Backend return series column names don't match CMA asset names. Fix in `api-service/data/` CSV files |
| **Portfolio Evaluation** | Database portfolio source | Low | Legacy loads from PostgreSQL; React uses file upload only |
| **Portfolio Evaluation** | Blended benchmark calculator | Low | Legacy calculates dynamic benchmark from FI type + allocation split |
| **Monte Carlo** | None | - | Full parity achieved |
| **CMA** | None | - | Full parity achieved |

---

## React-Only Enhancements

### By App

| App | Feature | Location | Description |
|-----|---------|----------|-------------|
| **Monte Carlo** | Drawdown analysis chart | `components/monte-carlo/DrawdownAnalysisChart.tsx` | Max/avg drawdown visualization |
| **Monte Carlo** | Bootstrap simulation mode | `lib/simulation.ts` → `runSimulationBootstrap()` | Historical return resampling option |
| **CMA** | Correlation matrix heatmap | `components/shared/CorrelationMatrixHeatmap.tsx` | Was removed in legacy cma_v2.py |
| **CMA** | Smart scatter labels | `components/capital-market-assumptions/RiskReturnScatter.tsx` | Auto-positioning labels to reduce overlap |
| **CMA** | Toggle labels option | `RiskReturnScatter.tsx` | Checkbox to show/hide point labels |
| **All Apps** | Animated transitions | Each `page.tsx` | Framer Motion entrance animations |
| **All Apps** | TypeScript types | `lib/*.ts` | Full type safety throughout |
| **All Apps** | Responsive design | Tailwind classes | Mobile/tablet/desktop support |

---

## Quick Start for Devs

### Windows Setup (New Developers)

1. **Install Node.js 18+**
   - Download from https://nodejs.org (LTS version)
   - Run installer, accept defaults

2. **Install Claude Code**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

3. **Clone the repo**
   ```bash
   git clone https://github.com/XWBCo/alti-portfolio-react.git
   cd alti-portfolio-react
   ```

4. **Install dependencies & run**
   ```bash
   npm install
   npm run dev
   ```

5. **Start Claude Code** (in project directory)
   ```bash
   claude
   ```
   - Select "Claude Console" when prompted
   - Complete OAuth in browser

### Running the Apps

```bash
# Start Python API (required for Risk Contribution)
cd api-service && python main.py

# Start React app
npm run dev

# Build check
npm run build

# Type check
npx tsc --noEmit
```

### File Naming Conventions
- **Pages:** `app/[route]/page.tsx`
- **Components:** `components/[feature]/ComponentName.tsx`
- **Logic/Utils:** `lib/[name].ts`
- **Types:** `lib/[name]-types.ts` or inline in `lib/types.ts`
- **API Routes:** `app/api/[endpoint]/route.ts`

### Styling
- Tailwind CSS classes inline
- AlTi colors: `#00f0db` (turquoise), `#074269` (navy), `#0B6D7B` (teal)
- Font: Georgia for headings, system for body
