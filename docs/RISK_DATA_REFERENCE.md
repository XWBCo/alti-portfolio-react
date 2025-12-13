# Risk Analysis Data Reference

Quick reference for understanding risk analysis data structures and their presentation in reports.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ User Input: Portfolio Weights                           │
│ { "Asset_1": 0.15, "Asset_2": 0.12, ... }              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ FastAPI Risk Service (localhost:8001)                   │
│ - Calculates covariance matrix                          │
│ - Computes risk contributions                           │
│ - Runs stress tests                                     │
│ - Analyzes diversification                              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Risk Analysis Results                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 1. Risk Contributions                               │ │
│ │    - PCTR: % contribution to total risk            │ │
│ │    - MCTR: Marginal contribution to risk           │ │
│ │    - Portfolio volatility                          │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 2. Diversification Metrics                         │ │
│ │    - Diversification ratio                         │ │
│ │    - Correlation matrix                            │ │
│ │    - Diversification benefit %                     │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 3. Performance Statistics                          │ │
│ │    - CAGR (returns)                                │ │
│ │    - Sharpe ratio                                  │ │
│ │    - Max drawdown                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 4. Stress Test Results                             │ │
│ │    - Historical scenarios                          │ │
│ │    - Portfolio returns                             │ │
│ │    - Drawdowns during stress                       │ │
│ └─────────────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ PowerPoint Report Generation                            │
│ - Title slide with metadata                             │
│ - Metrics slide with 6 key indicators                   │
│ - Chart slide with PCTR visualization                   │
│ - Stress table with scenario results                    │
│ - Summary slide with insights                           │
└─────────────────────────────────────────────────────────┘
```

## PCTR (Percentage Contribution to Risk)

**Definition:** How much each asset contributes to total portfolio risk.

**Formula:** `PCTR_i = (weight_i × MCTR_i) / portfolio_volatility`

**Interpretation:**
- Sum of all PCTR values = 100%
- Asset with 15% weight but 25% PCTR → risk concentrator
- Asset with 15% weight but 10% PCTR → risk diversifier

**Example:**
```json
{
  "Asset_1": 0.182,  // 18.2% of total risk
  "Asset_2": 0.156,  // 15.6% of total risk
  "Asset_3": 0.143,  // 14.3% of total risk
  // ... other assets
}
```

**Report Display:**
- Chart slide: Top 10 assets by PCTR (horizontal bar chart)
- Summary slide: Top 3 risk contributors mentioned

## MCTR (Marginal Contribution to Risk)

**Definition:** How much portfolio volatility would change if you increased an asset's weight by 1%.

**Formula:** `MCTR_i = (Cov(asset_i, portfolio)) / portfolio_volatility`

**Interpretation:**
- Positive MCTR → increasing weight increases portfolio risk
- Higher MCTR → asset is highly correlated with portfolio
- Used to calculate PCTR

**Report Display:**
- Not directly shown in report (used for PCTR calculation)

## Diversification Ratio

**Definition:** Measures how much diversification benefit you get from combining assets.

**Formula:** `Ratio = (Weighted Average Volatility) / (Portfolio Volatility)`

**Interpretation:**
- Ratio = 1.0 → No diversification benefit
- Ratio = 1.5 → Portfolio is 50% less risky than weighted average
- Ratio < 1.0 → Warning sign (shouldn't happen with proper correlation)

**Thresholds:**
- Excellent: ≥ 1.5
- Good: 1.2 - 1.5
- Moderate: 1.0 - 1.2
- Limited: < 1.0

**Report Display:**
- Metrics slide: Displayed as decimal (e.g., "1.35")
- Summary slide: Interpreted with qualitative assessment

## Sharpe Ratio

**Definition:** Risk-adjusted return metric (return per unit of risk).

**Formula:** `Sharpe = (Portfolio Return - Risk-Free Rate) / Portfolio Volatility`

**Interpretation:**
- Higher is better
- Measures excess return per unit of volatility
- Standard benchmark for comparing strategies

**Thresholds:**
- Excellent: > 1.5
- Good: 1.0 - 1.5
- Acceptable: 0.5 - 1.0
- Poor: < 0.5

**Report Display:**
- Metrics slide: Displayed as decimal (e.g., "1.23")
- Summary slide: Interpreted with quality assessment

## Max Drawdown

**Definition:** Largest peak-to-trough decline in portfolio value.

**Formula:** `Max DD = (Trough Value - Peak Value) / Peak Value`

**Interpretation:**
- Always negative or zero
- Shows worst historical loss
- Important for risk tolerance assessment

**Example:**
- -15.5% → Portfolio fell 15.5% from peak to trough
- -8.2% → Portfolio fell 8.2% from peak to trough

**Report Display:**
- Metrics slide: Displayed as percentage (e.g., "-15.50%")
- Summary slide: Mentioned in context
- Stress table: Shown for each scenario

## CAGR (Compound Annual Growth Rate)

**Definition:** Annualized return over the analysis period.

**Formula:** `CAGR = (Ending Value / Starting Value)^(1/years) - 1`

**Interpretation:**
- Smoothed annual return
- Better than average return for comparing periods
- Geometric mean of returns

**Report Display:**
- Metrics slide: Displayed as percentage (e.g., "8.45%")
- Shows long-term growth rate

## Weighted Average Correlation

**Definition:** Average correlation between assets, weighted by portfolio weights.

**Formula:** `Avg Corr = Σ(weight_i × weight_j × corr_ij) / (Σ weights)`

**Interpretation:**
- Range: -1 to +1
- Lower is better for diversification
- Typical values: 0.3 - 0.7

**Thresholds:**
- Excellent: < 0.3
- Good: 0.3 - 0.5
- Moderate: 0.5 - 0.7
- High: > 0.7

**Report Display:**
- Metrics slide: Displayed as decimal (e.g., "0.45")

## Stress Scenarios

**Definition:** Historical periods used to test portfolio resilience.

**Standard Scenarios:**
1. GFC (June 2008–Feb 2009) - Global Financial Crisis
2. Q4 2018 Holiday Selloff (Oct–Dec 2018) - Fed rate hike concerns
3. COVID Lockdown (Feb–Mar 2020) - Pandemic crash
4. 2022 Inflation / Rate Hikes - Fed tightening cycle
5. Extended Rally Pre (Mar 2016–Dec 2020) - Bull market
6. Post COVID Rally (Mar 2020–Dec 2021) - Recovery
7. YTD (Current year to date)
8. Latest Year (Trailing 12 months)

**Metrics per Scenario:**
- `portfolio_return`: Total return during period
- `max_drawdown`: Worst decline during period
- `volatility`: Annualized volatility during period
- `start_date`: Period start
- `end_date`: Period end

**Report Display:**
- Stress table: All scenarios with returns, drawdowns, volatility
- Summary slide: Worst and best scenarios highlighted

## Data Validation Rules

All formatters check for:
- `undefined` → "N/A"
- `null` → "N/A"
- `NaN` → "N/A"
- `Infinity` / `-Infinity` → "N/A"

Percentages are multiplied by 100 and formatted to 2 decimal places.

## Color Coding in Reports

**Returns:**
- Green: Positive returns
- Red: Negative returns

**Drawdowns:**
- Red: Always (negative by definition)

**Volatility:**
- Gray: Neutral (no inherent good/bad)

**Metrics:**
- AlTi Deep Blue (#074269): Primary metric values
- Gray (#757575): Labels and descriptions

## Example Data Set

```typescript
// Complete risk analysis result
{
  contributions: {
    pctr: {
      "Asset_1": 0.182,
      "Asset_2": 0.156,
      "Asset_3": 0.143,
      // ... more assets
    },
    mctr: {
      "Asset_1": 0.0152,
      "Asset_2": 0.0138,
      // ... more assets
    },
    portfolio_vol: 0.00089,
    portfolio_vol_annualized: 0.1415
  },
  diversification: {
    diversification_ratio: 1.35,
    diversification_benefit_pct: 0.26,
    weighted_avg_correlation: 0.45,
    portfolio_vol_annualized: 0.1415,
    weighted_avg_vol_annualized: 0.1910
  },
  performance: {
    cagr: 0.0845,
    volatility: 0.1415,
    sharpe: 1.23,
    max_drawdown: -0.1550,
    total_return: 0.2340
  },
  stressResults: [
    {
      scenario: "GFC (June 2008–Feb 2009)",
      portfolio_return: -0.2850,
      max_drawdown: -0.3120,
      volatility: 0.2450,
      start_date: "2008-06-01",
      end_date: "2009-02-28"
    },
    // ... more scenarios
  ]
}
```

## Report Slide Mapping

| Slide | Data Source | Key Metrics |
|-------|------------|-------------|
| Title | Config | Report title, date, prepared for |
| Metrics | All sources | 6 key metrics from all data types |
| Chart | contributions.pctr | Top 10 assets by risk contribution |
| Stress Table | stressResults | All scenarios with returns/drawdowns |
| Summary | All sources | Contextual insights and recommendations |

## Performance Benchmarks

**Typical Generation Time:**
- 5 slides: ~500ms
- 10 assets in chart: adds ~100ms
- 8 stress scenarios: adds ~50ms

**Report Size:**
- Typical: 50-100 KB
- With charts: 100-200 KB

## Troubleshooting

**"No data available" error:**
- User hasn't run analysis yet
- API connection failed
- Data returned but structure invalid

**"N/A" values in report:**
- Backend returned null/undefined for that metric
- Calculation resulted in NaN/Infinity
- Data validation detected invalid value

**Chart appears empty:**
- All PCTR values are zero or invalid
- No assets in portfolio
- Data filtering removed all entries

**Stress table missing:**
- Stress scenarios not enabled in parameters
- API call failed for stress endpoint
- No scenarios configured
