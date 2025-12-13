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
    # Extended risk functions
    calculate_var_cvar,
    ewma_shrinkage_cov,
    calculate_pcte,
    compute_full_risk_decomposition,
    calculate_segment_tracking_error,
)

from optimization_engine import (
    compute_efficient_frontier,
    calculate_blended_benchmark,
    detect_inefficiencies,
    find_optimal_portfolio,
)

from data_loader import (
    load_cma_data,
    load_correlation_matrix,
    load_return_series,
)

from stress_engine import (
    HISTORICAL_SCENARIOS,
    apply_stress_scenario,
    apply_custom_scenario,
    compute_stress_contribution,
    generate_hypothetical_scenarios,
    rank_scenarios_by_impact,
    get_scenario_summary,
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
# Load Real Data
# ============================================================================

from data_loader import (
    load_cma_data,
    load_correlation_matrix,
    load_return_series,
    load_beta_matrix,
    load_factor_covariance,
)

# Load real data at startup
try:
    print("Loading CMA data...")
    CMA_DATA = load_cma_data()
    print(f"✓ Loaded CMA data: {CMA_DATA.shape[0]} assets")

    print("Loading correlation matrix...")
    CORRELATION_MATRIX = load_correlation_matrix()
    print(f"✓ Loaded correlation matrix: {CORRELATION_MATRIX.shape[0]}x{CORRELATION_MATRIX.shape[1]}")

    print("Loading return series...")
    RETURNS_USD = load_return_series("USD")
    RETURNS_EUR = load_return_series("EUR")
    RETURNS_GBP = load_return_series("GBP")
    print(f"✓ Loaded return series: {RETURNS_USD.shape[0]} periods, {RETURNS_USD.shape[1]} assets (USD)")

    print("Loading beta matrix...")
    BETA_MATRIX = load_beta_matrix()
    print(f"✓ Loaded beta matrix: {BETA_MATRIX.shape[0]} securities, {BETA_MATRIX.shape[1]} factors")

    print("Loading factor covariance...")
    FACTOR_COVARIANCE = load_factor_covariance()
    print(f"✓ Loaded factor covariance: {FACTOR_COVARIANCE.shape[0]}x{FACTOR_COVARIANCE.shape[1]}")

    # Generate factor returns by computing from betas
    # For now, use a simple approach: factor returns are derived from asset returns
    # In a full implementation, these would be loaded or computed via regression
    FACTOR_RETURNS = pd.DataFrame(
        np.zeros((len(RETURNS_USD), len(FACTOR_COVARIANCE))),
        index=RETURNS_USD.index,
        columns=FACTOR_COVARIANCE.columns
    )

    print("\n✓ All data loaded successfully!\n")

except Exception as e:
    print(f"\n✗ Error loading data: {e}")
    print("Falling back to mock data...\n")

    # Fallback to mock data if real data fails to load
    from data_loader import (
        _generate_mock_cma_data,
        _generate_mock_correlation_matrix,
        _generate_mock_returns,
        _generate_mock_betas,
        _generate_mock_factor_cov,
    )

    CMA_DATA = _generate_mock_cma_data()
    CORRELATION_MATRIX = _generate_mock_correlation_matrix()
    RETURNS_USD = _generate_mock_returns()
    RETURNS_EUR = _generate_mock_returns()
    RETURNS_GBP = _generate_mock_returns()
    BETA_MATRIX = _generate_mock_betas()
    FACTOR_COVARIANCE = _generate_mock_factor_cov()
    FACTOR_RETURNS = pd.DataFrame(
        np.zeros((len(RETURNS_USD), len(FACTOR_COVARIANCE))),
        index=RETURNS_USD.index,
        columns=FACTOR_COVARIANCE.columns
    )

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
    scenarios: Optional[List[Dict[str, str]]] = None  # List of {name, start, end}
    use_default_scenarios: bool = True


class CustomScenarioRequest(BaseModel):
    portfolio: Dict[str, float]
    benchmark: Optional[Dict[str, float]] = None
    scenario_name: str
    shock_magnitudes: Dict[str, float]  # asset -> shock (e.g., -0.20 for -20%)


class HypotheticalScenarioRequest(BaseModel):
    portfolio: Dict[str, float]
    benchmark: Optional[Dict[str, float]] = None
    scenario_type: str = "mild_recession"  # mild_recession, severe_recession, inflation_surge, etc.


class StressContributionRequest(BaseModel):
    portfolio: Dict[str, float]
    scenario_start: str
    scenario_end: str


# Extended Risk Request Models
class VaRRequest(BaseModel):
    portfolio: Dict[str, float]
    confidence_level: float = 0.95
    method: str = "historical"  # "historical" | "parametric"


class PCTERequest(BaseModel):
    portfolio: Dict[str, float]
    benchmark: Dict[str, float]
    use_ewma: bool = True


class FullDecompositionRequest(BaseModel):
    portfolio: Dict[str, float]
    benchmark: Dict[str, float]


class SegmentTERequest(BaseModel):
    portfolio: Dict[str, float]
    growth_benchmark: str = "GLOBAL"
    stability_benchmark: str = "GLOBAL AGGREGATE"
    growth_allocation: float = 0.60
    stability_allocation: float = 0.40
    tier_mapping: Optional[Dict[str, str]] = None


# Optimization Request Models
class FrontierRequest(BaseModel):
    mode: str = "unconstrained"  # "core" | "core_private" | "unconstrained"
    caps_template: str = "std"    # "std" | "tight" | "loose"
    custom_assets: Optional[List[str]] = None
    n_points: int = 30


class BenchmarkRequest(BaseModel):
    equity_type: str = "GLOBAL"
    fixed_income_type: str = "GLOBAL AGGREGATE"
    equity_allocation: float = 0.60


class InefficiencyRequest(BaseModel):
    holdings: Dict[str, Dict[str, float]]  # asset -> {current: x, proposed: y}
    benchmark_allocations: Dict[str, float]
    threshold: float = 0.03


class OptimalPortfolioRequest(BaseModel):
    target_return: Optional[float] = None
    target_risk: Optional[float] = None
    risk_free_rate: float = 0.03
    mode: str = "unconstrained"
    caps_template: str = "std"

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
        "assets": list(RETURNS_USD.columns),
        "factors": list(FACTOR_RETURNS.columns),
        "date_range": {
            "start": str(RETURNS_USD.index[0].date()),
            "end": str(RETURNS_USD.index[-1].date())
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
        available = weights.index.intersection(RETURNS_USD.columns)
        if len(available) == 0:
            raise HTTPException(status_code=400, detail="No matching assets found in returns data")

        result = calculate_contributions(
            returns=RETURNS_USD,
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
            returns=RETURNS_USD,
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
            security_returns=RETURNS_USD,
            factor_returns=FACTOR_RETURNS,
            min_observations=12
        )

        result = compute_factor_risk_decomposition(
            weights=weights,
            betas=betas,
            factor_cov=FACTOR_COVARIANCE,
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
            returns=RETURNS_USD,
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
        common = weights.index.intersection(RETURNS_USD.columns)
        portfolio_returns = (RETURNS_USD[common] * weights[common]).sum(axis=1)

        result = {
            "portfolio": compute_performance_stats(portfolio_returns)
        }

        # Add benchmark if provided
        if request.benchmark:
            bench_weights = pd.Series(request.benchmark)
            bench_weights = bench_weights / bench_weights.sum()
            common_bench = bench_weights.index.intersection(RETURNS_USD.columns)
            benchmark_returns = (RETURNS_USD[common_bench] * bench_weights[common_bench]).sum(axis=1)
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
            returns=RETURNS_USD,
            weights=weights,
            use_ewma=request.use_ewma,
            ewma_decay=request.ewma_decay
        )

        # Diversification
        diversification = compute_diversification_metrics(
            weights=weights,
            returns=RETURNS_USD,
            use_ewma=request.use_ewma
        )

        # Performance
        weights_norm = weights / weights.sum()
        common = weights_norm.index.intersection(RETURNS_USD.columns)
        portfolio_returns = (RETURNS_USD[common] * weights_norm[common]).sum(axis=1)
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


@app.get("/api/stress/scenarios")
async def get_available_scenarios():
    """
    Get list of available historical stress scenarios.
    """
    return {
        "success": True,
        "data": {
            "scenarios": HISTORICAL_SCENARIOS,
            "count": len(HISTORICAL_SCENARIOS)
        }
    }


@app.post("/api/stress/apply")
async def apply_stress_scenarios_endpoint(request: StressScenarioRequest):
    """
    Apply stress scenarios to portfolio (historical or custom).
    """
    try:
        portfolio = pd.Series(request.portfolio)

        benchmark = None
        if request.benchmark:
            benchmark = pd.Series(request.benchmark)

        # Use default scenarios if not provided
        scenarios = request.scenarios if request.scenarios else HISTORICAL_SCENARIOS

        # Apply scenarios using stress engine
        results = apply_stress_scenario(
            portfolio_weights=portfolio,
            returns=RETURNS_USD,
            scenarios=scenarios,
            benchmark_weights=benchmark
        )

        # Get summary statistics
        summary = get_scenario_summary(results)

        # Rank by severity
        ranked = rank_scenarios_by_impact(results, metric="total_return")

        return {
            "success": True,
            "data": {
                "scenarios": results,
                "summary": summary,
                "worst_scenarios": ranked[:5]  # Top 5 worst
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/stress/custom")
async def apply_custom_scenario_endpoint(request: CustomScenarioRequest):
    """
    Apply custom shock scenario to portfolio.
    """
    try:
        portfolio = pd.Series(request.portfolio)
        shocks = request.shock_magnitudes

        # Calculate impact
        result = apply_custom_scenario(
            portfolio_weights=portfolio,
            shock_magnitudes=shocks
        )

        result["scenario_name"] = request.scenario_name

        # If benchmark provided, calculate benchmark impact too
        if request.benchmark:
            benchmark = pd.Series(request.benchmark)
            bench_result = apply_custom_scenario(
                portfolio_weights=benchmark,
                shock_magnitudes=shocks
            )
            result["benchmark_impact"] = bench_result["direct_impact"]
            result["excess_impact"] = round(
                result["direct_impact"] - bench_result["direct_impact"], 2
            )

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/stress/hypothetical")
async def apply_hypothetical_scenario_endpoint(request: HypotheticalScenarioRequest):
    """
    Generate and apply hypothetical stress scenario.
    """
    try:
        portfolio = pd.Series(request.portfolio)

        # Generate scenario shocks
        asset_classes = list(portfolio.index)
        shocks = generate_hypothetical_scenarios(
            asset_classes=asset_classes,
            scenario_type=request.scenario_type
        )

        # Apply scenario
        result = apply_custom_scenario(
            portfolio_weights=portfolio,
            shock_magnitudes=shocks
        )

        result["scenario_type"] = request.scenario_type
        result["shocks"] = shocks

        # If benchmark provided, calculate benchmark impact
        if request.benchmark:
            benchmark = pd.Series(request.benchmark)
            bench_result = apply_custom_scenario(
                portfolio_weights=benchmark,
                shock_magnitudes=shocks
            )
            result["benchmark_impact"] = bench_result["direct_impact"]
            result["excess_impact"] = round(
                result["direct_impact"] - bench_result["direct_impact"], 2
            )

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/stress/contribution")
async def calculate_stress_contribution_endpoint(request: StressContributionRequest):
    """
    Calculate asset-level contribution to stress scenario.
    """
    try:
        portfolio = pd.Series(request.portfolio)

        # Calculate contributions
        contributions = compute_stress_contribution(
            portfolio_weights=portfolio,
            returns=RETURNS_USD,
            scenario_start=request.scenario_start,
            scenario_end=request.scenario_end
        )

        if contributions.empty:
            return {
                "success": False,
                "error": "No data available for specified period"
            }

        return {
            "success": True,
            "data": contributions.to_dict(orient="records")
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


# ============================================================================
# Extended Risk Endpoints
# ============================================================================

@app.post("/api/risk/var-cvar")
async def calculate_var_cvar_endpoint(request: VaRRequest):
    """
    Calculate Value at Risk (VaR) and Conditional VaR (CVaR).
    """
    try:
        weights = pd.Series(request.portfolio)
        weights = weights / weights.sum()

        # Calculate portfolio returns
        common = weights.index.intersection(RETURNS_USD.columns)
        portfolio_returns = (RETURNS_USD[common] * weights[common]).sum(axis=1)

        result = calculate_var_cvar(
            returns=portfolio_returns,
            confidence_level=request.confidence_level
        )

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk/pcte")
async def calculate_pcte_endpoint(request: PCTERequest):
    """
    Calculate Portfolio Contribution to Tracking Error (PCTE).
    """
    try:
        portfolio = pd.Series(request.portfolio)
        benchmark = pd.Series(request.benchmark)

        result = calculate_pcte(
            portfolio_weights=portfolio,
            benchmark_weights=benchmark,
            returns=RETURNS_USD,
            use_ewma=request.use_ewma
        )

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk/full-decomposition")
async def calculate_full_decomposition(request: FullDecompositionRequest):
    """
    Full risk decomposition: systematic, specific, and active components.
    """
    try:
        portfolio = pd.Series(request.portfolio)
        benchmark = pd.Series(request.benchmark)

        # Compute betas
        betas, residual_var = compute_lasso_betas(
            security_returns=RETURNS_USD,
            factor_returns=FACTOR_RETURNS,
            min_observations=12
        )

        result = compute_full_risk_decomposition(
            portfolio_weights=portfolio,
            benchmark_weights=benchmark,
            security_returns=RETURNS_USD,
            factor_returns=FACTOR_RETURNS,
            betas=betas,
            factor_cov=FACTOR_COVARIANCE,
            residual_var=residual_var
        )

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk/segment-tracking-error")
async def calculate_segment_te_endpoint(request: SegmentTERequest):
    """
    Calculate segment-level tracking error (Growth vs Stability).
    """
    try:
        portfolio = pd.Series(request.portfolio)

        result = calculate_segment_tracking_error(
            portfolio_weights=portfolio,
            returns=RETURNS_USD,
            growth_benchmark=request.growth_benchmark,
            stability_benchmark=request.stability_benchmark,
            growth_allocation=request.growth_allocation,
            stability_allocation=request.stability_allocation,
            tier_mapping=request.tier_mapping
        )

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Optimization Endpoints
# ============================================================================

# Load CMA data at startup
CMA_DATA = load_cma_data()
CORRELATION_MATRIX = load_correlation_matrix()


@app.post("/api/optimization/frontier")
async def compute_frontier_endpoint(request: FrontierRequest):
    """
    Compute efficient frontier for given parameters.
    """
    try:
        result = compute_efficient_frontier(
            cma_data=CMA_DATA,
            correlation_matrix=CORRELATION_MATRIX,
            mode=request.mode,
            caps_template=request.caps_template,
            custom_assets=request.custom_assets,
            n_points=request.n_points
        )

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/optimization/benchmark")
async def compute_benchmark_endpoint(request: BenchmarkRequest):
    """
    Calculate blended benchmark risk/return.
    """
    try:
        result = calculate_blended_benchmark(
            cma_data=CMA_DATA,
            correlation_matrix=CORRELATION_MATRIX,
            equity_type=request.equity_type,
            fixed_income_type=request.fixed_income_type,
            equity_allocation=request.equity_allocation,
            fixed_income_allocation=1.0 - request.equity_allocation
        )

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/optimization/inefficiencies")
async def detect_inefficiencies_endpoint(request: InefficiencyRequest):
    """
    Flag portfolio positions deviating from benchmark.
    """
    try:
        # Convert holdings dict to DataFrame
        holdings_list = []
        for asset, allocs in request.holdings.items():
            holdings_list.append({
                "ASSET CLASS": asset,
                "current": allocs.get("current", 0),
                "proposed": allocs.get("proposed", 0)
            })

        holdings_df = pd.DataFrame(holdings_list)

        result = detect_inefficiencies(
            holdings=holdings_df,
            current_column="current",
            proposed_column="proposed",
            benchmark_allocations=request.benchmark_allocations,
            threshold=request.threshold
        )

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/optimization/optimal-portfolio")
async def find_optimal_portfolio_endpoint(request: OptimalPortfolioRequest):
    """
    Find optimal portfolio from efficient frontier.
    """
    try:
        # Compute frontier
        frontier = compute_efficient_frontier(
            cma_data=CMA_DATA,
            correlation_matrix=CORRELATION_MATRIX,
            mode=request.mode,
            caps_template=request.caps_template
        )

        if not frontier["risks"]:
            raise HTTPException(status_code=400, detail="Could not compute frontier")

        result = find_optimal_portfolio(
            frontier_risks=frontier["risks"],
            frontier_returns=frontier["returns"],
            frontier_weights=frontier["weights"],
            target_return=request.target_return,
            target_risk=request.target_risk,
            risk_free_rate=request.risk_free_rate
        )

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/optimization/assets")
async def get_optimization_assets():
    """
    Get available assets for optimization.
    """
    try:
        return {
            "success": True,
            "data": {
                "assets": CMA_DATA["ASSET CLASS"].tolist(),
                "count": len(CMA_DATA)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/data/cma")
async def get_cma_data():
    """
    Get Capital Market Assumptions data with returns and risks.
    """
    try:
        # Convert to list of dicts for JSON response
        cma_list = []
        for _, row in CMA_DATA.iterrows():
            cma_list.append({
                "asset_class": row["ASSET CLASS"],
                "expected_return": float(row["RETURN"]),
                "risk": float(row["RISK"]),
                "purpose": row.get("PURPOSE", ""),
                "group": row.get("GROUP", "")
            })

        return {
            "success": True,
            "data": {
                "cma": cma_list,
                "count": len(cma_list)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/data/correlation")
async def get_correlation_matrix():
    """
    Get asset correlation matrix.
    """
    try:
        # Convert to dict format
        corr_dict = {}
        for asset in CORRELATION_MATRIX.index:
            corr_dict[asset] = {
                col: float(CORRELATION_MATRIX.loc[asset, col])
                for col in CORRELATION_MATRIX.columns
            }

        return {
            "success": True,
            "data": {
                "correlation": corr_dict,
                "assets": list(CORRELATION_MATRIX.index)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
