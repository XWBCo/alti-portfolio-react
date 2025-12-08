"""
Risk Contribution API Service
FastAPI backend for portfolio risk analysis
"""

import os
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import pandas as pd
import numpy as np
import io

from risk_engine import (
    calculate_contributions,
    compute_lasso_betas,
    compute_factor_risk_decomposition,
    compute_tracking_error,
    compute_performance_stats,
    compute_diversification_metrics,
    calculate_ewma_covariance,
)

app = FastAPI(
    title="Risk Contribution API",
    description="Portfolio risk analysis and factor decomposition",
    version="1.0.0"
)

# CORS for Next.js frontend - configurable via CORS_ORIGINS env var
cors_origins = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Mock Data - In production, load from CSV files
# ============================================================================

def generate_mock_returns(n_periods: int = 60, n_assets: int = 20) -> pd.DataFrame:
    """Generate synthetic monthly returns for testing."""
    np.random.seed(42)
    dates = pd.date_range(end=pd.Timestamp.now(), periods=n_periods, freq='M')
    asset_names = [f"Asset_{i+1}" for i in range(n_assets)]

    # Generate correlated returns
    base_vol = 0.04  # 4% monthly vol
    returns = np.random.randn(n_periods, n_assets) * base_vol

    # Add some correlation structure
    market_factor = np.random.randn(n_periods) * base_vol
    for i in range(n_assets):
        beta = 0.5 + np.random.rand() * 0.5  # Beta between 0.5 and 1.0
        returns[:, i] = beta * market_factor + (1 - beta) * returns[:, i]

    return pd.DataFrame(returns, index=dates, columns=asset_names)


def generate_mock_factor_returns(n_periods: int = 60) -> pd.DataFrame:
    """Generate synthetic factor returns."""
    np.random.seed(123)
    dates = pd.date_range(end=pd.Timestamp.now(), periods=n_periods, freq='M')
    factors = [
        'US_Equity', 'Intl_Equity', 'EM_Equity',
        'US_Rates', 'EU_Rates', 'Credit_Spread',
        'USD_FX', 'Commodities', 'Gold', 'VIX'
    ]

    returns = np.random.randn(n_periods, len(factors)) * 0.03
    return pd.DataFrame(returns, index=dates, columns=factors)


# Initialize mock data
MOCK_RETURNS = generate_mock_returns()
MOCK_FACTOR_RETURNS = generate_mock_factor_returns()
MOCK_FACTOR_COV = MOCK_FACTOR_RETURNS.cov()

# ============================================================================
# Request/Response Models
# ============================================================================

class PortfolioWeights(BaseModel):
    weights: Dict[str, float]  # asset_name -> weight

class BenchmarkWeights(BaseModel):
    weights: Dict[str, float]

class ContributionsRequest(BaseModel):
    portfolio: Dict[str, float]
    use_ewma: bool = True
    ewma_decay: float = 0.94

class TrackingErrorRequest(BaseModel):
    portfolio: Dict[str, float]
    benchmark: Dict[str, float]
    use_ewma: bool = True

class FactorDecompositionRequest(BaseModel):
    portfolio: Dict[str, float]

class DiversificationRequest(BaseModel):
    portfolio: Dict[str, float]
    use_ewma: bool = True

class PerformanceRequest(BaseModel):
    portfolio: Dict[str, float]
    benchmark: Optional[Dict[str, float]] = None

class StressScenarioRequest(BaseModel):
    portfolio: Dict[str, float]
    benchmark: Optional[Dict[str, float]] = None
    scenarios: List[Dict[str, str]]  # List of {name, start, end}

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    return {"message": "Risk Contribution API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/assets")
async def get_available_assets():
    """Get list of available assets for portfolio construction."""
    return {
        "assets": list(MOCK_RETURNS.columns),
        "factors": list(MOCK_FACTOR_RETURNS.columns),
        "date_range": {
            "start": str(MOCK_RETURNS.index[0].date()),
            "end": str(MOCK_RETURNS.index[-1].date())
        }
    }


@app.post("/api/risk/contributions")
async def calculate_risk_contributions(request: ContributionsRequest):
    """
    Calculate PCTR (Percentage Contribution to Risk) and MCTR.
    """
    try:
        weights = pd.Series(request.portfolio)

        # Validate weights
        if weights.sum() <= 0:
            raise HTTPException(status_code=400, detail="Weights must sum to a positive value")

        # Filter to available assets
        available = weights.index.intersection(MOCK_RETURNS.columns)
        if len(available) == 0:
            raise HTTPException(status_code=400, detail="No matching assets found in returns data")

        result = calculate_contributions(
            returns=MOCK_RETURNS,
            weights=weights,
            use_ewma=request.use_ewma,
            ewma_decay=request.ewma_decay
        )

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk/tracking-error")
async def calculate_tracking_error(request: TrackingErrorRequest):
    """
    Calculate tracking error between portfolio and benchmark.
    """
    try:
        portfolio = pd.Series(request.portfolio)
        benchmark = pd.Series(request.benchmark)

        result = compute_tracking_error(
            portfolio_weights=portfolio,
            benchmark_weights=benchmark,
            returns=MOCK_RETURNS,
            use_ewma=request.use_ewma
        )

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk/factor-decomposition")
async def calculate_factor_decomposition(request: FactorDecompositionRequest):
    """
    Decompose portfolio risk into systematic (factor) and specific components.
    """
    try:
        weights = pd.Series(request.portfolio)

        # Compute betas via LASSO
        betas, residual_var = compute_lasso_betas(
            security_returns=MOCK_RETURNS,
            factor_returns=MOCK_FACTOR_RETURNS,
            min_observations=12
        )

        result = compute_factor_risk_decomposition(
            weights=weights,
            betas=betas,
            factor_cov=MOCK_FACTOR_COV,
            residual_var=residual_var
        )

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk/diversification")
async def calculate_diversification(request: DiversificationRequest):
    """
    Calculate portfolio diversification metrics.
    """
    try:
        weights = pd.Series(request.portfolio)

        result = compute_diversification_metrics(
            weights=weights,
            returns=MOCK_RETURNS,
            use_ewma=request.use_ewma
        )

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk/performance")
async def calculate_performance(request: PerformanceRequest):
    """
    Calculate portfolio performance statistics.
    """
    try:
        weights = pd.Series(request.portfolio)
        weights = weights / weights.sum()

        # Calculate portfolio returns
        common = weights.index.intersection(MOCK_RETURNS.columns)
        portfolio_returns = (MOCK_RETURNS[common] * weights[common]).sum(axis=1)

        result = {
            "portfolio": compute_performance_stats(portfolio_returns)
        }

        # Add benchmark if provided
        if request.benchmark:
            bench_weights = pd.Series(request.benchmark)
            bench_weights = bench_weights / bench_weights.sum()
            common_bench = bench_weights.index.intersection(MOCK_RETURNS.columns)
            benchmark_returns = (MOCK_RETURNS[common_bench] * bench_weights[common_bench]).sum(axis=1)
            result["benchmark"] = compute_performance_stats(benchmark_returns)

            # Excess return stats
            excess_returns = portfolio_returns - benchmark_returns
            result["excess"] = compute_performance_stats(excess_returns)

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk/full-analysis")
async def full_risk_analysis(request: ContributionsRequest):
    """
    Run complete risk analysis: contributions, diversification, and performance.
    """
    try:
        weights = pd.Series(request.portfolio)

        # Risk contributions
        contributions = calculate_contributions(
            returns=MOCK_RETURNS,
            weights=weights,
            use_ewma=request.use_ewma,
            ewma_decay=request.ewma_decay
        )

        # Diversification
        diversification = compute_diversification_metrics(
            weights=weights,
            returns=MOCK_RETURNS,
            use_ewma=request.use_ewma
        )

        # Performance
        weights_norm = weights / weights.sum()
        common = weights_norm.index.intersection(MOCK_RETURNS.columns)
        portfolio_returns = (MOCK_RETURNS[common] * weights_norm[common]).sum(axis=1)
        performance = compute_performance_stats(portfolio_returns)

        return {
            "success": True,
            "data": {
                "contributions": contributions,
                "diversification": diversification,
                "performance": performance
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk/stress-scenarios")
async def calculate_stress_scenarios(request: StressScenarioRequest):
    """
    Calculate portfolio performance under historical stress scenarios.
    """
    try:
        weights = pd.Series(request.portfolio)
        weights = weights / weights.sum()

        benchmark_weights = None
        if request.benchmark:
            benchmark_weights = pd.Series(request.benchmark)
            benchmark_weights = benchmark_weights / benchmark_weights.sum()

        results = []

        for scenario in request.scenarios:
            scenario_name = scenario.get("name", "Unknown")
            start_date = pd.Timestamp(scenario.get("start", "2020-01-01"))
            end_date = pd.Timestamp(scenario.get("end", "2020-12-31"))

            # Filter returns to scenario period
            mask = (MOCK_RETURNS.index >= start_date) & (MOCK_RETURNS.index <= end_date)
            scenario_returns = MOCK_RETURNS[mask]

            if len(scenario_returns) < 2:
                # Not enough data - generate synthetic
                n_months = max(3, (end_date - start_date).days // 30)
                np.random.seed(hash(scenario_name) % 2**32)

                # Generate returns based on scenario type
                if "COVID" in scenario_name or "GFC" in scenario_name or "Selloff" in scenario_name:
                    base_return = -0.08  # Negative scenario
                    vol = 0.10
                elif "Rally" in scenario_name:
                    base_return = 0.02  # Positive scenario
                    vol = 0.04
                else:
                    base_return = 0.005  # Neutral
                    vol = 0.05

                synthetic = np.random.randn(n_months, len(weights)) * vol + base_return
                scenario_returns = pd.DataFrame(
                    synthetic,
                    columns=[f"Asset_{i+1}" for i in range(len(weights))]
                )

            # Calculate portfolio returns for scenario
            common = weights.index.intersection(scenario_returns.columns)
            if len(common) == 0:
                # Use all columns with equal weights portion
                common = scenario_returns.columns[:len(weights)]
                weights_adj = pd.Series({c: weights.iloc[i] if i < len(weights) else 0.05
                                        for i, c in enumerate(common)})
            else:
                weights_adj = weights[common]

            port_returns = (scenario_returns[common] * weights_adj).sum(axis=1)

            # Calculate cumulative return
            cumulative = (1 + port_returns).cumprod()
            total_return = float(cumulative.iloc[-1] - 1) if len(cumulative) > 0 else 0

            # Max drawdown
            rolling_max = cumulative.cummax()
            drawdown = (cumulative - rolling_max) / rolling_max
            max_dd = float(drawdown.min()) if len(drawdown) > 0 else 0

            # Volatility (annualized)
            vol_ann = float(port_returns.std() * np.sqrt(12)) if len(port_returns) > 1 else 0

            result = {
                "scenario": scenario_name,
                "portfolio_return": round(total_return * 100, 2),
                "max_drawdown": round(max_dd * 100, 2),
                "volatility": round(vol_ann * 100, 2),
                "start_date": str(start_date.date()),
                "end_date": str(end_date.date()),
            }

            # Add benchmark if provided
            if benchmark_weights is not None:
                bench_common = benchmark_weights.index.intersection(scenario_returns.columns)
                if len(bench_common) > 0:
                    bench_returns = (scenario_returns[bench_common] * benchmark_weights[bench_common]).sum(axis=1)
                    bench_cumulative = (1 + bench_returns).cumprod()
                    bench_total = float(bench_cumulative.iloc[-1] - 1) if len(bench_cumulative) > 0 else 0
                    result["benchmark_return"] = round(bench_total * 100, 2)

            results.append(result)

        return {
            "success": True,
            "data": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CSV Upload Endpoint
# ============================================================================

@app.post("/api/upload/portfolio")
async def upload_portfolio(file: UploadFile = File(...)):
    """
    Upload portfolio CSV file.
    Expected format: columns [Security Name, Weight] or [Asset, Weight]
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        # Detect columns
        name_col = None
        weight_col = None

        for col in df.columns:
            col_lower = col.lower()
            if 'name' in col_lower or 'security' in col_lower or 'asset' in col_lower:
                name_col = col
            if 'weight' in col_lower or 'allocation' in col_lower:
                weight_col = col

        if not name_col or not weight_col:
            raise HTTPException(
                status_code=400,
                detail="CSV must have columns for asset names and weights"
            )

        # Build portfolio dict
        portfolio = dict(zip(df[name_col], df[weight_col]))

        return {
            "success": True,
            "portfolio": portfolio,
            "asset_count": len(portfolio)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
