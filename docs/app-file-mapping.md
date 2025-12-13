# Application File Mapping

> All files listed are **frontend** (Next.js/React/TypeScript).
> Risk Contribution requires a separate Python backend.

---

## 1. Monte Carlo Simulation
**Route:** `/monte-carlo`

**Page:**
```
app/monte-carlo/page.tsx
```

**Components:**
```
components/monte-carlo/
├── SimulationChart.tsx
├── OutcomeProbabilities.tsx
└── ParameterPanel.tsx
```

**Lib (Engine + Types + Data):**
```
lib/
├── simulation.ts          # Engine (runSimulation, runSimulationPiecewise, formatCurrency)
├── types.ts               # SimulationParams, SimulationResult, PiecewiseParams, etc.
└── mock-data.ts           # DEFAULT_PARAMS, PORTFOLIO_PRESETS, SCENARIO_COLORS
```

---

## 2. Portfolio Evaluation
**Route:** `/portfolio-evaluation`

**Page:**
```
app/portfolio-evaluation/page.tsx
```

**API Route:**
```
app/api/data/route.ts              # Data fetching for usePortfolioData hook
```

**Components:**
```
components/portfolio-evaluation/
├── EfficientFrontierChart.tsx
├── MetricsSummary.tsx
├── ParameterPanel.tsx
└── PortfolioTable.tsx
```

**Lib (Engine + Types + Data + Hooks):**
```
lib/
├── optimization.ts                # Engine (generateEfficientFrontier, calculatePortfoliosWithMetrics, formatPercent)
├── portfolio-types.ts             # OptimizationParams, FrontierPoint, PortfolioHoldings, etc.
├── cma-data.ts                    # ASSET_CLASSES, CORRELATION_MATRIX, getAssetsByMode
├── portfolio-mapper.ts            # mapPortfolioToAllocations (used by ParameterPanel)
├── data-loader.ts                 # Portfolio, SecurityMetadata types (used by mapper/hooks)
└── hooks/
    └── usePortfolioData.ts        # usePortfolioNames, usePortfolio, useSecurityMetadata
```

---

## 3. Risk Contribution Model
**Route:** `/risk-contribution`

**Page:**
```
app/risk-contribution/page.tsx
```

**API Route:**
```
app/api/risk/route.ts              # Proxy to Python backend
```

**Components:**
```
components/risk-contribution/
├── RiskContributionChart.tsx
├── MetricsCards.tsx
├── ParameterPanel.tsx
└── StressScenariosTable.tsx
```

**Lib (Types only - computation in Python):**
```
lib/
└── risk-types.ts                  # All types, STRESS_SCENARIOS, SAMPLE_RISK_PORTFOLIOS, SAMPLE_BENCHMARK
```

**Python Backend (must run separately on port 8001):**
```
api-service/
├── main.py                        # FastAPI server
├── risk_engine.py                 # LASSO regression, EWMA covariance
└── requirements.txt               # Python dependencies
```

---

## 4. Capital Market Assumptions
**Route:** `/capital-market-assumptions`

**Page:**
```
app/capital-market-assumptions/page.tsx
```

**Components:**
```
components/capital-market-assumptions/
├── CMATable.tsx
├── RiskReturnScatter.tsx
└── ParameterPanel.tsx
```

**Lib (Types + Data):**
```
lib/
├── cma-mock-data.ts               # CMA_ASSETS data, countByPurpose
└── cma-types.ts                   # CMAParams, CMAAsset, SCENARIO_ADJUSTMENTS, CURRENCY_ADJUSTMENTS, PURPOSE_COLORS
```
