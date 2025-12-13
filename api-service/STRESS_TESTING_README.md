# Stress Testing API Documentation

Comprehensive stress testing and scenario analysis for portfolio risk management, ported from the legacy AlTi Risk Portfolio App with modern improvements.

## Overview

The Stress Testing API provides:

- **Historical Stress Scenarios**: Test portfolios against past market crises (GFC, COVID, etc.)
- **Custom Shock Scenarios**: Apply user-defined shocks to specific assets
- **Hypothetical Scenarios**: Generate scenario shocks based on economic templates
- **Asset-Level Attribution**: Understand which holdings drive stress losses
- **Benchmark Comparison**: Compare portfolio vs benchmark performance under stress

## Architecture

```
stress_engine.py         # Core stress testing logic
main.py                  # FastAPI endpoints (5 new stress endpoints)
/app/api/stress/route.ts # Next.js proxy for frontend integration
```

## API Endpoints

### 1. Get Available Scenarios

**Endpoint**: `GET /api/stress/scenarios`

**Description**: Returns list of predefined historical stress scenarios.

**Response**:
```json
{
  "success": true,
  "data": {
    "scenarios": [
      {
        "name": "GFC (June 2008 – Feb 2009)",
        "start": "2008-06-01",
        "end": "2009-02-28",
        "description": "Global Financial Crisis - severe market downturn",
        "type": "crisis"
      },
      {
        "name": "COVID Lockdown (Feb – Mar 2020)",
        "start": "2020-02-01",
        "end": "2020-03-31",
        "description": "COVID-19 pandemic market crash",
        "type": "crisis"
      }
    ],
    "count": 8
  }
}
```

**Historical Scenarios Included**:
- **GFC (2008-2009)**: Global Financial Crisis
- **Q4 2018 Selloff**: Year-end market correction
- **COVID Lockdown (Feb-Mar 2020)**: Pandemic crash
- **Post-COVID Rally (2020-2021)**: Recovery period
- **2022 Inflation/Rate Hikes**: Rising rates environment
- **Extended Rally (2016-2020)**: Bull market period
- **YTD 2025**: Current year performance
- **Latest Year**: Trailing 12 months

---

### 2. Apply Historical Scenarios

**Endpoint**: `POST /api/stress/apply`

**Description**: Apply historical stress scenarios to a portfolio.

**Request Body**:
```json
{
  "portfolio": {
    "Asset_1": 0.35,
    "Asset_2": 0.25,
    "Asset_3": 0.40
  },
  "benchmark": {
    "Asset_1": 0.60,
    "Asset_2": 0.40
  },
  "use_default_scenarios": true,
  "scenarios": []  // Optional: custom scenarios
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "scenarios": [
      {
        "scenario": "GFC (June 2008 – Feb 2009)",
        "start": "2008-06-01",
        "end": "2009-02-28",
        "periods": 9,
        "total_return": -32.45,
        "annualized_return": -45.12,
        "volatility": 28.34,
        "max_drawdown": -38.67,
        "sharpe_ratio": -1.59,
        "var_95": -12.45,
        "cvar_95": -15.23,
        "benchmark_return": -28.90,
        "excess_return": -3.55
      }
    ],
    "summary": {
      "scenarios_analyzed": 8,
      "average_return": -5.23,
      "worst_return": -32.45,
      "best_return": 15.67,
      "average_max_drawdown": -12.34,
      "scenarios_with_negative_returns": 5,
      "scenarios_with_positive_returns": 3
    },
    "worst_scenarios": [/* Top 5 worst performers */]
  }
}
```

**Metrics Returned**:
- `total_return`: Cumulative return over the period (%)
- `annualized_return`: Return annualized (%)
- `volatility`: Annualized volatility (%)
- `max_drawdown`: Maximum peak-to-trough decline (%)
- `sharpe_ratio`: Risk-adjusted return metric
- `var_95`: Value at Risk at 95% confidence (%)
- `cvar_95`: Conditional VaR / Expected Shortfall (%)
- `excess_return`: Portfolio return - Benchmark return (%)

---

### 3. Apply Custom Scenario

**Endpoint**: `POST /api/stress/custom`

**Description**: Apply user-defined shocks to specific assets.

**Request Body**:
```json
{
  "portfolio": {
    "US_Equity": 0.40,
    "US_Bonds": 0.30,
    "Gold": 0.10,
    "Real_Estate": 0.20
  },
  "benchmark": {
    "US_Equity": 0.60,
    "US_Bonds": 0.40
  },
  "scenario_name": "Severe Equity Crash",
  "shock_magnitudes": {
    "US_Equity": -0.35,      // -35% shock
    "US_Bonds": 0.08,        // +8% flight to quality
    "Gold": 0.15,            // +15% safe haven
    "Real_Estate": -0.25     // -25% illiquidity discount
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "scenario_name": "Severe Equity Crash",
    "direct_impact": -18.50,
    "assets_affected": 4,
    "total_assets": 4,
    "benchmark_impact": -15.60,
    "excess_impact": -2.90
  }
}
```

**Use Cases**:
- Test impact of specific market shocks
- Model "what-if" scenarios
- Regulatory stress testing requirements
- Client-specific concerns (e.g., real estate crash)

---

### 4. Apply Hypothetical Scenario

**Endpoint**: `POST /api/stress/hypothetical`

**Description**: Generate and apply scenario based on economic templates.

**Request Body**:
```json
{
  "portfolio": {
    "US_Equity": 0.35,
    "Intl_Equity": 0.25,
    "EM_Equity": 0.10,
    "US_Bonds": 0.20,
    "Commodities": 0.10
  },
  "scenario_type": "severe_recession"
}
```

**Scenario Types Available**:

| Scenario Type | Description | Example Shocks |
|--------------|-------------|----------------|
| `mild_recession` | Moderate economic slowdown | Equities -15%, Bonds +3% |
| `severe_recession` | Deep recession / crisis | Equities -35%, Credit -20% |
| `inflation_surge` | Rising inflation environment | Bonds -12%, Commodities +25% |
| `deflation` | Deflationary spiral | Equities -8%, Bonds +10% |
| `market_rally` | Risk-on bull market | Equities +20%, EM +30% |

**Response**:
```json
{
  "success": true,
  "data": {
    "scenario_type": "severe_recession",
    "direct_impact": -22.75,
    "shocks": {
      "US_Equity": -0.35,
      "Intl_Equity": -0.40,
      "EM_Equity": -0.45,
      "US_Bonds": 0.08,
      "Commodities": -0.15
    },
    "assets_affected": 5,
    "total_assets": 5,
    "benchmark_impact": -18.50,
    "excess_impact": -4.25
  }
}
```

**Asset Class Shock Templates**:

The engine uses intelligent fuzzy matching to map your assets to standard shocks:
- Equity keywords: "EQUITY", "STOCK" → equity shocks
- Fixed Income: "BOND", "FIXED", "RATE" → bond shocks
- Emerging Markets: "EM", "EMERGING" → EM-specific shocks
- Alternatives: "GOLD", "REAL ESTATE", "COMMODITY" → alternative shocks

---

### 5. Calculate Stress Contributions

**Endpoint**: `POST /api/stress/contribution`

**Description**: Decompose which assets contributed most to stress losses.

**Request Body**:
```json
{
  "portfolio": {
    "Asset_1": 0.30,
    "Asset_2": 0.25,
    "Asset_3": 0.20,
    "Asset_4": 0.15,
    "Asset_5": 0.10
  },
  "scenario_start": "2020-02-01",
  "scenario_end": "2020-03-31"
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "asset": "Asset_1",
      "weight": 30.00,
      "return_contribution": -8.45,
      "volatility_contribution": 12.34,
      "drawdown_contribution": -10.23
    },
    {
      "asset": "Asset_2",
      "weight": 25.00,
      "return_contribution": -6.12,
      "volatility_contribution": 9.87,
      "drawdown_contribution": -7.89
    }
  ]
}
```

**Contribution Metrics**:
- `return_contribution`: How much this asset contributed to total return (%)
- `volatility_contribution`: Contribution to portfolio volatility (%)
- `drawdown_contribution`: Contribution to maximum drawdown (%)

**Use Cases**:
- Identify risk concentrations
- Understand which positions hurt most during stress
- Inform rebalancing decisions
- Risk budgeting and allocation

---

## Next.js Integration

All endpoints are accessible via the Next.js proxy route:

```typescript
// Get available scenarios
const scenarios = await fetch('/api/stress?endpoint=scenarios');

// Apply historical scenarios
const results = await fetch('/api/stress?endpoint=apply', {
  method: 'POST',
  body: JSON.stringify({
    portfolio: myPortfolio,
    benchmark: myBenchmark,
    use_default_scenarios: true
  })
});

// Apply custom scenario
const customResults = await fetch('/api/stress?endpoint=custom', {
  method: 'POST',
  body: JSON.stringify({
    portfolio: myPortfolio,
    scenario_name: "My Custom Scenario",
    shock_magnitudes: { "Asset_1": -0.30, "Asset_2": 0.05 }
  })
});

// Generate hypothetical scenario
const hypothetical = await fetch('/api/stress?endpoint=hypothetical', {
  method: 'POST',
  body: JSON.stringify({
    portfolio: myPortfolio,
    scenario_type: "severe_recession"
  })
});

// Calculate stress contributions
const contributions = await fetch('/api/stress?endpoint=contribution', {
  method: 'POST',
  body: JSON.stringify({
    portfolio: myPortfolio,
    scenario_start: "2020-02-01",
    scenario_end: "2020-03-31"
  })
});
```

---

## Testing

Run the comprehensive examples:

```bash
# Start the API service
cd api-service
python main.py

# In another terminal, run examples
python stress_testing_examples.py
```

The examples demonstrate:
1. Getting available scenarios
2. Applying historical scenarios with benchmark comparison
3. Creating custom shock scenarios
4. Using hypothetical scenario templates
5. Calculating asset-level stress contributions
6. Comparing multiple portfolio allocations

---

## Implementation Details

### Key Functions in `stress_engine.py`

| Function | Purpose |
|----------|---------|
| `apply_stress_scenario()` | Main function to apply multiple scenarios |
| `compute_scenario_metrics()` | Calculate comprehensive metrics for a scenario |
| `apply_custom_scenario()` | Apply user-defined shocks |
| `compute_stress_contribution()` | Asset-level attribution |
| `generate_hypothetical_scenarios()` | Create scenarios from templates |
| `rank_scenarios_by_impact()` | Sort scenarios by severity |
| `get_scenario_summary()` | Aggregate statistics |

### Risk Metrics Calculated

1. **Total Return**: `(End Value / Start Value) - 1`
2. **Annualized Return**: `(1 + Total Return) ^ (1 / Years) - 1`
3. **Volatility**: `Std Dev of Returns * sqrt(12)`  (monthly data)
4. **Max Drawdown**: `Min(Cumulative - Peak) / Peak`
5. **Sharpe Ratio**: `Annualized Return / Volatility` (0% risk-free rate)
6. **VaR (95%)**: 5th percentile of returns distribution
7. **CVaR (95%)**: Average of returns below VaR threshold

---

## Legacy Integration

This implementation ports functionality from:

- **`app_risk.py`**: Historical stress scenarios (lines 114-124)
- **`app_mcs.py`**: Monte Carlo stress testing logic
- **`risk_functions.py`**: Risk metric calculations

### Key Improvements Over Legacy

1. **RESTful API**: Replaces Dash callbacks with HTTP endpoints
2. **Typed Requests**: Pydantic models for validation
3. **Modular Design**: Separate stress_engine.py for reusability
4. **Enhanced Metrics**: More comprehensive scenario analysis
5. **Flexible Scenarios**: Support for custom and hypothetical scenarios
6. **Better Attribution**: Asset-level stress contribution analysis

---

## Production Considerations

### Performance Optimization

For production use with real return data:

1. **Cache Results**: Store scenario results to avoid recomputation
2. **Async Processing**: Run multiple scenarios in parallel
3. **Data Indexing**: Ensure returns DataFrame has proper datetime index
4. **Batch Requests**: Process multiple portfolios in one request

### Data Requirements

The stress engine expects:

- **Returns DataFrame**: Monthly returns with datetime index
- **Asset Naming**: Consistent naming between portfolio weights and returns columns
- **Historical Coverage**: Sufficient history to cover scenario periods
- **Date Alignment**: Proper handling of missing dates and weekends

### Error Handling

The API handles:
- Missing data for scenario periods (returns empty/synthetic results)
- Mismatched assets between portfolio and returns (uses intersection)
- Invalid date ranges (validation in Pydantic models)
- Division by zero in metric calculations

---

## Example Workflows

### 1. Regulatory Stress Testing

```python
# Apply severe recession to meet regulatory requirements
payload = {
    "portfolio": client_portfolio,
    "benchmark": regulatory_benchmark,
    "scenario_type": "severe_recession"
}
response = requests.post(f"{API_URL}/api/stress/hypothetical", json=payload)
```

### 2. Portfolio Review

```python
# Analyze how portfolio performed in past crises
payload = {
    "portfolio": current_holdings,
    "benchmark": policy_portfolio,
    "use_default_scenarios": True
}
response = requests.post(f"{API_URL}/api/stress/apply", json=payload)
```

### 3. What-If Analysis

```python
# Model client's concern about real estate crash
payload = {
    "portfolio": portfolio_weights,
    "scenario_name": "Real Estate Crash",
    "shock_magnitudes": {
        "US_REIT": -0.40,
        "Global_Real_Estate": -0.35,
        "Infrastructure": -0.20
    }
}
response = requests.post(f"{API_URL}/api/stress/custom", json=payload)
```

---

## Future Enhancements

Potential additions:

1. **Factor-Based Stress**: Apply shocks to risk factors, not assets
2. **Correlation Breakdown**: Model correlation changes during stress
3. **Tail Risk**: CVaR with different confidence levels
4. **Reverse Stress Testing**: Find scenarios that breach loss limits
5. **Scenario Visualization**: Return time series data for charting
6. **Multi-Period Analysis**: Rolling stress windows
7. **Risk Budgeting**: Allocate stress limits across assets

---

## Support

For questions or issues:
- Review `stress_testing_examples.py` for usage patterns
- Check API response for `success: false` and error details
- Verify portfolio weights sum to ~1.0
- Ensure asset names match returns DataFrame columns
