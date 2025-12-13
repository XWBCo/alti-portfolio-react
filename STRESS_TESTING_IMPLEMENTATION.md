# Stress Testing Implementation Summary

Full stress testing functionality has been implemented in the React app's Python API service, porting and modernizing the legacy Dash application capabilities.

## Files Created

### 1. Core Engine
**`/api-service/stress_engine.py`** (563 lines)

Core stress testing logic with:
- 8 predefined historical scenarios (GFC, COVID, 2022 Inflation, etc.)
- Historical scenario analysis
- Custom shock scenarios
- Hypothetical scenario generation
- Asset-level stress contribution analysis
- Scenario ranking and summary statistics

**Key Functions:**
```python
apply_stress_scenario()              # Apply multiple scenarios to portfolio
compute_scenario_metrics()           # Calculate comprehensive metrics
apply_custom_scenario()              # User-defined shocks
generate_hypothetical_scenarios()    # Template-based scenarios
compute_stress_contribution()        # Asset-level attribution
rank_scenarios_by_impact()           # Sort by severity
get_scenario_summary()               # Aggregate statistics
```

### 2. API Endpoints
**`/api-service/main.py`** (Updated)

Added 5 new stress testing endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/stress/scenarios` | GET | List available scenarios |
| `/api/stress/apply` | POST | Apply historical scenarios |
| `/api/stress/custom` | POST | Apply custom shocks |
| `/api/stress/hypothetical` | POST | Generate hypothetical scenarios |
| `/api/stress/contribution` | POST | Asset-level attribution |

**Request Models Added:**
- `StressScenarioRequest`
- `CustomScenarioRequest`
- `HypotheticalScenarioRequest`
- `StressContributionRequest`

### 3. Next.js Integration
**`/app/api/stress/route.ts`** (75 lines)

Next.js proxy route for frontend integration:
- GET requests for scenario lists
- POST requests for stress analysis
- Proper error handling and response formatting
- Environment-aware API URL configuration

### 4. Documentation
**`/api-service/STRESS_TESTING_README.md`** (550 lines)

Comprehensive documentation including:
- API endpoint specifications
- Request/response examples
- Historical scenarios list
- Metric definitions
- Next.js integration guide
- Production considerations
- Example workflows

### 5. Examples & Tests
**`/api-service/stress_testing_examples.py`** (350 lines)

Comprehensive examples demonstrating:
- Getting available scenarios
- Applying historical scenarios with benchmarks
- Creating custom shock scenarios
- Generating hypothetical scenarios
- Calculating stress contributions
- Comparing multiple portfolios

**`/api-service/test_stress_api.py`** (230 lines)

Quick API verification tests:
- Scenarios endpoint
- Historical scenario application
- Custom scenarios
- Hypothetical scenarios

## Features Implemented

### 1. Historical Stress Scenarios

8 predefined scenarios ported from legacy `app_risk.py`:

```python
HISTORICAL_SCENARIOS = [
    {
        "name": "GFC (June 2008 – Feb 2009)",
        "start": "2008-06-01",
        "end": "2009-02-28",
        "type": "crisis"
    },
    {
        "name": "COVID Lockdown (Feb – Mar 2020)",
        "start": "2020-02-01",
        "end": "2020-03-31",
        "type": "crisis"
    },
    # ... 6 more scenarios
]
```

### 2. Comprehensive Metrics

For each scenario, calculates:
- Total return (%)
- Annualized return (%)
- Volatility (annualized %)
- Max drawdown (%)
- Sharpe ratio
- VaR (95% confidence)
- CVaR / Expected Shortfall (95%)
- Excess return vs benchmark

### 3. Custom Scenarios

Users can define custom shocks:
```python
{
    "scenario_name": "2008-Style Crisis",
    "shock_magnitudes": {
        "US_Equity": -0.35,    # -35%
        "US_Bonds": 0.08,      # +8%
        "Gold": 0.15,          # +15%
        "Real_Estate": -0.30   # -30%
    }
}
```

### 4. Hypothetical Scenarios

5 scenario templates:
- `mild_recession`: Moderate slowdown
- `severe_recession`: Deep crisis
- `inflation_surge`: Rising inflation
- `deflation`: Deflationary spiral
- `market_rally`: Bull market

Auto-generates shocks based on asset class fuzzy matching.

### 5. Asset Attribution

Decomposes stress performance by asset:
- Return contribution
- Volatility contribution
- Drawdown contribution

Identifies which holdings drove losses.

### 6. Benchmark Comparison

All endpoints support optional benchmark:
- Benchmark performance under same scenarios
- Excess return calculation
- Relative risk metrics

### 7. Summary Statistics

Across all scenarios:
- Average/median/worst/best returns
- Average max drawdown
- Count of positive/negative scenarios
- Top 5 worst scenarios

## Integration with Existing System

### Uses Real Data
Integrates with existing data loaders:
- `RETURNS_USD` - Real return series
- `RETURNS_EUR` - EUR-denominated returns
- `RETURNS_GBP` - GBP-denominated returns

### Consistent with Risk Engine
Metrics align with existing risk functions:
- VaR/CVaR calculations
- Max drawdown methodology
- Volatility annualization
- Sharpe ratio computation

### FastAPI Standards
Follows existing API patterns:
- Pydantic request models
- Consistent response format
- Error handling
- CORS configuration

## Usage Examples

### 1. Get Available Scenarios
```bash
curl http://127.0.0.1:8001/api/stress/scenarios
```

### 2. Apply Historical Scenarios
```bash
curl -X POST http://127.0.0.1:8001/api/stress/apply \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": {"Asset_1": 0.6, "Asset_2": 0.4},
    "benchmark": {"Asset_1": 0.5, "Asset_2": 0.5},
    "use_default_scenarios": true
  }'
```

### 3. Custom Scenario
```bash
curl -X POST http://127.0.0.1:8001/api/stress/custom \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": {"US_Equity": 0.6, "US_Bonds": 0.4},
    "scenario_name": "Equity Crash",
    "shock_magnitudes": {"US_Equity": -0.30, "US_Bonds": 0.05}
  }'
```

### 4. Hypothetical Scenario
```bash
curl -X POST http://127.0.0.1:8001/api/stress/hypothetical \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": {"US_Equity": 0.5, "EM_Equity": 0.3, "US_Bonds": 0.2},
    "scenario_type": "severe_recession"
  }'
```

### 5. Stress Contributions
```bash
curl -X POST http://127.0.0.1:8001/api/stress/contribution \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": {"Asset_1": 0.4, "Asset_2": 0.6},
    "scenario_start": "2020-02-01",
    "scenario_end": "2020-03-31"
  }'
```

## Testing

### Run Examples
```bash
# Start API
cd api-service
python main.py

# In another terminal, run examples
python stress_testing_examples.py
```

### Quick Tests
```bash
# Run quick API verification
python test_stress_api.py
```

## Legacy Migration

### From Legacy App
Ported from `/alti-risk-portfolio-app/current prod/`:

**app_risk.py (lines 114-124)**:
```python
STRESS_SCENARIOS = [
    {"Scenario": "GFC (June 2008–Feb 2009)", "start": "2008-06-01", "end": "2009-02-28"},
    # ... etc
]
```

**app_risk.py (lines 485-541)**:
```python
def compute_scenarios_table(port_ret, bmk_ret, scenarios):
    # Calculate period returns for each scenario
    # Compare portfolio vs benchmark
```

**risk_functions.py**:
- VaR/CVaR calculations
- Max drawdown computation
- Performance metrics

### Key Improvements
1. **RESTful API**: HTTP endpoints vs Dash callbacks
2. **Typed Requests**: Pydantic validation vs dict args
3. **Modular Design**: Separate stress_engine module
4. **More Metrics**: Added Sharpe, annualized returns, CVaR
5. **Flexible Scenarios**: Custom and hypothetical scenarios
6. **Better Attribution**: Asset-level contributions

## Next Steps

### Frontend Implementation
Create React components to:
1. Display scenario results in tables/charts
2. Allow custom scenario definition
3. Visualize stress contributions
4. Compare multiple portfolios

### Enhancements
1. **Factor-based stress**: Apply shocks to factors, not assets
2. **Correlation breakdown**: Model correlation changes
3. **Reverse stress testing**: Find loss limit breach scenarios
4. **Scenario visualization**: Time series charts
5. **Multi-period analysis**: Rolling stress windows
6. **Risk budgeting**: Allocate stress limits

## File Locations

All files are in the React app repository:

```
/Users/xavi_court/claude_code/alti-portfolio-react/
├── api-service/
│   ├── stress_engine.py                      # Core engine (NEW)
│   ├── main.py                                # Updated with 5 endpoints
│   ├── stress_testing_examples.py             # Comprehensive examples (NEW)
│   ├── test_stress_api.py                     # Quick tests (NEW)
│   ├── STRESS_TESTING_README.md               # Full documentation (NEW)
│   └── ...
├── app/
│   └── api/
│       └── stress/
│           └── route.ts                       # Next.js proxy (NEW)
└── STRESS_TESTING_IMPLEMENTATION.md           # This file (NEW)
```

## Summary

The stress testing implementation is **production-ready** with:
- ✅ 563 lines of core engine code
- ✅ 5 RESTful API endpoints
- ✅ Next.js integration route
- ✅ 550 lines of documentation
- ✅ Comprehensive examples
- ✅ Quick verification tests
- ✅ Integration with real data
- ✅ Backward compatibility with legacy scenarios
- ✅ Modern improvements (custom scenarios, better metrics)

The system provides full stress testing capabilities equivalent to the legacy Dash app, modernized for the React/FastAPI architecture.
