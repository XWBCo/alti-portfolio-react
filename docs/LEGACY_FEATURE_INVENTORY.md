# LEGACY FEATURE INVENTORY FOR REACT MIGRATION

## Executive Summary

The legacy AlTi Risk & Portfolio Analytics Dashboard consists of 4 core Dash/Plotly applications with complementary shared risk calculation libraries. These apps implement quantitative portfolio analysis, risk attribution, Monte Carlo simulation, and an overview dashboard.

**Source Files:**
- `app_eval.py` - 2193 lines - Portfolio Evaluation
- `app_risk.py` - 1910 lines - Risk Contribution Model
- `app_mcs.py` - 2605 lines - Monte Carlo Simulation
- `app_dashboard3.py` - 1217 lines - Home/Navigation

**Total:** ~8,000 lines of Dash/Plotly Python

---

## 1. APP_EVAL.PY - CLIENT PORTFOLIO EVALUATION

### Core Purpose
Mean-variance optimization and efficient frontier analysis for portfolio construction and client comparison.

### UI Components

#### Sidebar Controls
- Portfolio Selection: Multi-select dropdown (supports 2+ portfolios)
- Benchmark Configuration: Fixed income type, Equity/Fixed allocation sliders
- Chart Display Settings: Width/height inputs, currency, caps template
- File Upload: Client input data (Excel .xlsx format)
- Custom Frontier: Toggle + multi-select asset picker
- Action Buttons: Run Optimization, Resample Portfolios, Download Results

#### Main Content Area
- **Efficient Frontier Graph**: 3 frontier curves (Core, Core+Private, Unconstrained)
- **Cumulative Compounding Chart**: Bar chart projecting growth over 3/5/10/20/30 years
- **Holdings Table**: Asset class allocations comparison
- **Portfolio Summary Table**: Return, Risk, VaR, CVaR, Sharpe metrics
- **Historical Metrics Table**: Annualized return, volatility, max drawdown
- **Ibbotson Cone Chart**: Probabilistic projection with percentile bands

### Key Algorithms
- `compute_frontier_fast()`: QP solver using scipy.optimize.minimize with SLSQP
- `calculate_blended_benchmark()`: Equity/bond blend calculation
- `calc_stats()`: Geometric annualized return, volatility, max drawdown
- Resampling with Dirichlet distribution (40K samples)

### Migration Status: **PARTIAL** (React has basic frontier, missing resampling & Ibbotson)

---

## 2. APP_RISK.PY - RISK CONTRIBUTION MODEL

### Core Purpose
Factor-based risk decomposition, performance attribution, and scenario analysis.

### UI Components
- KPI Boxes: Expected Return, Risk, Excess Return, Info Ratio, Sharpe
- Performance Chart: Cumulative growth (portfolio vs benchmark)
- Factor Contribution Charts: Active Exposures, Factor TE
- Risk Contribution Charts: By Tier 1 and Tier 4 (security-level)
- Diversification Analysis: Pie chart + table
- Beta Matrix Heatmap: Factor correlation visualization
- Security-Level Contributors: Top 25 by vol contribution

### Key Algorithms
- `compute_risk_decomposition()`: Factor betas + covariance → PCTR/MCTR
- `compute_te_diversification()`: TE breakdown by bucket (Stability/Diversified/Growth)
- `compute_scenarios_table()`: Stress test returns

### Migration Status: **PARTIAL** (React has basic PCTR, missing factor decomposition)

---

## 3. APP_MCS.PY - MONTE CARLO SIMULATION

### Core Purpose
Stochastic modeling of portfolio outcomes under various spending patterns.

### UI Components
- 3 Simulation Configurations (each with return, vol, spending params)
- Piecewise Return Schedules: 3 regimes with calendar transitions
- Custom Spending Upload: Excel file with quarterly schedule
- Summary Charts: Portfolio value over time, ending value distribution
- Probability Charts: Success rates at wealth thresholds

### Key Algorithms
- `simulate_monte_carlo()`: GBM with quarterly returns + spending
- `simulate_monte_carlo_with_custom_spending()`: Custom spending schedule support
- Percentile calculations: 5th, 25th, 50th, 75th, 95th bands

### Migration Status: **DONE** (React has full Monte Carlo with piecewise returns)

---

## 4. APP_DASHBOARD3.PY - HOME/NAVIGATION

### Core Purpose
Landing page with tool navigation, authentication, and personalization.

### Features
- SAML SSO integration (Azure AD)
- 6-card tile navigation to tools
- User personalization (greeting, local time)
- Feedback collection system
- File downloads (user guide, presentations)

### Migration Status: **PARTIAL** (React has navigation, missing SAML/personalization)

---

## 5. SHARED RISK FUNCTIONS

### risk_functions.py & risk_functions2.py

**Volatility/Return Metrics:**
- `calculate_var_cvar()`: VaR at 95% + CVaR
- `calculate_max_drawdown()`: Peak-to-trough decline
- `calculate_ewma_covariance_matrix()`: EWMA covariance (span=60)

**Risk Contribution:**
- `calculate_contributions()`: PCTR and MCTR calculations
- `add_tier_1_column()`: Asset classification
- `compute_te_diversification()`: TE decomposition by bucket

**Factor Analysis:**
- `align_factor_inputs()`: Security weights → factor betas
- `ewma_shrinkage_cov()`: Shrinkage estimator
- `compute_lasso_betas()`: L1-regularized factor loadings

---

## 6. MIGRATION STATUS MATRIX

| Feature | Legacy | React Status | Priority |
|---------|--------|--------------|----------|
| Efficient frontier (3 curves) | app_eval | Partial | Critical |
| Resampling (Dirichlet) | app_eval | Missing | High |
| Ibbotson cone projection | app_eval | Missing | High |
| Factor risk decomposition | app_risk | Missing | Critical |
| Beta matrix heatmap | app_risk | Missing | High |
| TE diversification metrics | app_risk | Missing | High |
| Monte Carlo simulation | app_mcs | **Done** | Critical |
| Piecewise return schedules | app_mcs | **Done** | High |
| Custom spending patterns | app_mcs | Partial | Medium |
| SAML SSO authentication | dashboard | Missing | Critical |
| User personalization | dashboard | Missing | Medium |
| EWMA covariance | shared | Missing | Medium |
| VaR/CVaR metrics | shared | Missing | Medium |

---

## 7. PRIORITY GAPS

### Tier 1: Must-Have (Production Parity)
1. Factor-based risk decomposition (PCTR/MCTR with betas)
2. SAML SSO authentication
3. Ibbotson cone projection
4. Tier classification system (Stability/Diversified/Growth)

### Tier 2: Should-Have (Feature Completeness)
1. Resampling with Dirichlet
2. Historical metrics from time-series
3. Excel multi-sheet export
4. Stress/scenario analysis
5. Editable portfolio tables

### Tier 3: Nice-to-Have (Polish)
1. EWMA covariance estimation
2. Shrinkage estimators
3. Feedback collection system
4. File download handlers

---

## 8. DATA DEPENDENCIES

### Required Data Files
1. `cma_input3.xlsx`: RR, CORR, RETURNS sheets
2. Factor betas: `betas_YYYY_MM.csv`
3. Factor covariance: `factor_cov_YYYY_MM.csv`
4. Return series: Historical asset class returns

### Data Pipeline
1. Load CMA on startup → memory
2. User uploads portfolio → parse Excel
3. Compute metrics using CMA + weights
4. Fetch factor data → risk decomposition
5. Generate time series returns

---

*Generated from comprehensive analysis of legacy Dash/Plotly applications*
*Last updated: December 2024*
