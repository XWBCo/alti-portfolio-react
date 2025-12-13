"""
Stress Testing Engine
Portfolio stress testing and scenario analysis
Ported from legacy app_risk.py with modern improvements
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime


# Historical stress scenarios (from legacy STRESS_SCENARIOS)
HISTORICAL_SCENARIOS = [
    {
        "name": "GFC (June 2008 – Feb 2009)",
        "start": "2008-06-01",
        "end": "2009-02-28",
        "description": "Global Financial Crisis - severe market downturn",
        "type": "crisis"
    },
    {
        "name": "Extended Rally Pre (Mar 2016 – Dec 2020)",
        "start": "2016-03-01",
        "end": "2020-12-31",
        "description": "Extended bull market period",
        "type": "rally"
    },
    {
        "name": "Q4 2018 Holiday Selloff (Oct – Dec 2018)",
        "start": "2018-10-01",
        "end": "2018-12-31",
        "description": "Sharp year-end market correction",
        "type": "correction"
    },
    {
        "name": "COVID Lockdown (Feb – Mar 2020)",
        "start": "2020-02-01",
        "end": "2020-03-31",
        "description": "COVID-19 pandemic market crash",
        "type": "crisis"
    },
    {
        "name": "Post COVID Rally (Mar 2020 – Dec 2021)",
        "start": "2020-03-01",
        "end": "2021-12-31",
        "description": "Post-pandemic recovery rally",
        "type": "rally"
    },
    {
        "name": "2022 Inflation / Rate Hikes",
        "start": "2022-01-01",
        "end": "2022-12-31",
        "description": "Rising inflation and interest rate increases",
        "type": "correction"
    },
    {
        "name": "YTD (Jan 2025 – Sep 2025)",
        "start": "2025-01-01",
        "end": "2025-09-30",
        "description": "Year-to-date performance",
        "type": "current"
    },
    {
        "name": "Latest Year (Oct 2024 – Sep 2025)",
        "start": "2024-10-01",
        "end": "2025-09-30",
        "description": "Trailing 12 months",
        "type": "current"
    }
]


def get_scenario_returns(
    returns: pd.DataFrame,
    start_date: str,
    end_date: str
) -> pd.DataFrame:
    """
    Extract returns for a specific time period.

    Args:
        returns: DataFrame with datetime index and asset returns
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)

    Returns:
        Filtered DataFrame with returns in the specified period
    """
    start = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)

    mask = (returns.index >= start) & (returns.index <= end)
    return returns[mask]


def compute_scenario_metrics(
    returns: pd.Series,
    scenario_name: str,
    start_date: str,
    end_date: str
) -> Dict:
    """
    Calculate comprehensive metrics for a scenario.

    Args:
        returns: Portfolio or benchmark returns time series
        scenario_name: Name of the scenario
        start_date: Start date
        end_date: End date

    Returns:
        Dictionary with scenario metrics
    """
    if len(returns) == 0:
        return {
            "scenario": scenario_name,
            "start": start_date,
            "end": end_date,
            "periods": 0,
            "total_return": 0.0,
            "annualized_return": 0.0,
            "volatility": 0.0,
            "max_drawdown": 0.0,
            "sharpe_ratio": 0.0,
            "var_95": 0.0,
            "cvar_95": 0.0
        }

    # Total return
    cumulative = (1 + returns).cumprod()
    total_return = float(cumulative.iloc[-1] - 1)

    # Annualized return
    n_periods = len(returns)
    years = n_periods / 12  # Assuming monthly returns
    annualized_return = float((1 + total_return) ** (1 / years) - 1) if years > 0 else 0.0

    # Volatility (annualized)
    volatility = float(returns.std() * np.sqrt(12))

    # Max drawdown
    rolling_max = cumulative.cummax()
    drawdown = (cumulative - rolling_max) / rolling_max
    max_drawdown = float(drawdown.min())

    # Sharpe ratio (assuming 0% risk-free rate for simplicity)
    sharpe = float(annualized_return / volatility) if volatility > 0 else 0.0

    # VaR and CVaR (95% confidence)
    var_95 = float(np.percentile(returns, 5))
    cvar_95 = float(returns[returns <= var_95].mean())

    return {
        "scenario": scenario_name,
        "start": start_date,
        "end": end_date,
        "periods": n_periods,
        "total_return": round(total_return * 100, 2),
        "annualized_return": round(annualized_return * 100, 2),
        "volatility": round(volatility * 100, 2),
        "max_drawdown": round(max_drawdown * 100, 2),
        "sharpe_ratio": round(sharpe, 2),
        "var_95": round(var_95 * 100, 2),
        "cvar_95": round(cvar_95 * 100, 2)
    }


def apply_stress_scenario(
    portfolio_weights: pd.Series,
    returns: pd.DataFrame,
    scenarios: List[Dict],
    benchmark_weights: Optional[pd.Series] = None
) -> List[Dict]:
    """
    Apply multiple stress scenarios to a portfolio.

    Args:
        portfolio_weights: Portfolio weights (asset -> weight)
        returns: Historical returns DataFrame
        scenarios: List of scenario dictionaries with name, start, end
        benchmark_weights: Optional benchmark weights for comparison

    Returns:
        List of scenario results with portfolio and benchmark metrics
    """
    # Normalize weights
    portfolio_weights = portfolio_weights / portfolio_weights.sum()
    if benchmark_weights is not None:
        benchmark_weights = benchmark_weights / benchmark_weights.sum()

    results = []

    for scenario in scenarios:
        scenario_name = scenario.get("name", "Unknown")
        start_date = scenario.get("start")
        end_date = scenario.get("end")

        # Filter returns to scenario period
        scenario_returns = get_scenario_returns(returns, start_date, end_date)

        if len(scenario_returns) < 2:
            # No data for this period
            results.append({
                "scenario": scenario_name,
                "start": start_date,
                "end": end_date,
                "periods": 0,
                "data_available": False,
                "portfolio_return": 0.0,
                "benchmark_return": 0.0 if benchmark_weights is not None else None,
                "excess_return": 0.0 if benchmark_weights is not None else None
            })
            continue

        # Calculate portfolio returns
        common_assets = portfolio_weights.index.intersection(scenario_returns.columns)
        if len(common_assets) == 0:
            continue

        port_weights = portfolio_weights[common_assets]
        port_weights = port_weights / port_weights.sum()
        portfolio_returns = (scenario_returns[common_assets] * port_weights).sum(axis=1)

        # Calculate portfolio metrics
        port_metrics = compute_scenario_metrics(
            portfolio_returns, scenario_name, start_date, end_date
        )
        port_metrics["data_available"] = True

        # Calculate benchmark metrics if provided
        if benchmark_weights is not None:
            bench_common = benchmark_weights.index.intersection(scenario_returns.columns)
            if len(bench_common) > 0:
                bench_weights = benchmark_weights[bench_common]
                bench_weights = bench_weights / bench_weights.sum()
                benchmark_returns = (scenario_returns[bench_common] * bench_weights).sum(axis=1)

                bench_metrics = compute_scenario_metrics(
                    benchmark_returns, scenario_name, start_date, end_date
                )

                # Add benchmark and excess return
                port_metrics["benchmark_return"] = bench_metrics["total_return"]
                port_metrics["benchmark_volatility"] = bench_metrics["volatility"]
                port_metrics["benchmark_max_drawdown"] = bench_metrics["max_drawdown"]
                port_metrics["excess_return"] = round(
                    port_metrics["total_return"] - bench_metrics["total_return"], 2
                )

        results.append(port_metrics)

    return results


def create_custom_scenario(
    name: str,
    shock_magnitudes: Dict[str, float],
    description: str = ""
) -> Dict:
    """
    Create a custom shock scenario.

    Args:
        name: Scenario name
        shock_magnitudes: Dictionary of asset -> shock magnitude (e.g., -0.20 for -20%)
        description: Optional description

    Returns:
        Custom scenario definition
    """
    return {
        "name": name,
        "type": "custom",
        "description": description,
        "shocks": shock_magnitudes
    }


def apply_custom_scenario(
    portfolio_weights: pd.Series,
    shock_magnitudes: Dict[str, float],
    covariance_matrix: Optional[pd.DataFrame] = None
) -> Dict:
    """
    Apply a custom shock scenario to calculate impact.

    Args:
        portfolio_weights: Portfolio weights
        shock_magnitudes: Asset-level shocks (asset -> shock as decimal)
        covariance_matrix: Optional covariance matrix for correlation effects

    Returns:
        Dictionary with scenario impact metrics
    """
    # Normalize weights
    weights = portfolio_weights / portfolio_weights.sum()

    # Create shock vector
    shocks = pd.Series(shock_magnitudes)

    # Direct impact (no correlation effects)
    common = weights.index.intersection(shocks.index)
    direct_impact = (weights[common] * shocks[common]).sum()

    result = {
        "direct_impact": round(direct_impact * 100, 2),
        "assets_affected": len(common),
        "total_assets": len(weights)
    }

    # If covariance provided, calculate correlation-adjusted impact
    if covariance_matrix is not None:
        # This is a simplified approach - in practice would use full factor model
        common_cov = covariance_matrix.loc[common, common]
        shock_vec = shocks[common].values

        # Correlation-adjusted shock
        adjusted_shock = np.dot(common_cov.values, shock_vec)
        corr_impact = np.dot(weights[common].values, adjusted_shock)

        result["correlation_adjusted_impact"] = round(corr_impact * 100, 2)

    return result


def compute_stress_contribution(
    portfolio_weights: pd.Series,
    returns: pd.DataFrame,
    scenario_start: str,
    scenario_end: str
) -> pd.DataFrame:
    """
    Calculate each asset's contribution to portfolio stress.

    Args:
        portfolio_weights: Portfolio weights
        returns: Historical returns
        scenario_start: Scenario start date
        scenario_end: Scenario end date

    Returns:
        DataFrame with asset-level stress contributions
    """
    # Get scenario returns
    scenario_returns = get_scenario_returns(returns, scenario_start, scenario_end)

    if len(scenario_returns) < 2:
        return pd.DataFrame()

    # Normalize weights
    weights = portfolio_weights / portfolio_weights.sum()
    common = weights.index.intersection(scenario_returns.columns)

    if len(common) == 0:
        return pd.DataFrame()

    # Calculate contributions
    contributions = []

    for asset in common:
        asset_returns = scenario_returns[asset]
        weight = weights[asset]

        # Total return contribution
        cumulative = (1 + asset_returns).prod() - 1
        contribution = weight * cumulative

        # Volatility contribution (approximate)
        asset_vol = asset_returns.std() * np.sqrt(12)
        vol_contribution = weight * asset_vol

        # Drawdown contribution
        asset_cumulative = (1 + asset_returns).cumprod()
        asset_peak = asset_cumulative.cummax()
        asset_dd = ((asset_cumulative - asset_peak) / asset_peak).min()
        dd_contribution = weight * asset_dd

        contributions.append({
            "asset": asset,
            "weight": round(weight * 100, 2),
            "return_contribution": round(contribution * 100, 2),
            "volatility_contribution": round(vol_contribution * 100, 2),
            "drawdown_contribution": round(dd_contribution * 100, 2)
        })

    df = pd.DataFrame(contributions)
    df = df.sort_values("drawdown_contribution", ascending=True)

    return df


def generate_hypothetical_scenarios(
    asset_classes: List[str],
    scenario_type: str = "mild_recession"
) -> Dict[str, float]:
    """
    Generate hypothetical shock scenarios based on typical market moves.

    Args:
        asset_classes: List of asset class names
        scenario_type: Type of scenario to generate

    Returns:
        Dictionary of shocks by asset class
    """
    scenarios = {
        "mild_recession": {
            "US_Equity": -0.15,
            "Intl_Equity": -0.18,
            "EM_Equity": -0.22,
            "US_Rates": 0.03,
            "Credit_Spread": -0.08,
            "Gold": 0.05,
            "Real_Estate": -0.12
        },
        "severe_recession": {
            "US_Equity": -0.35,
            "Intl_Equity": -0.40,
            "EM_Equity": -0.45,
            "US_Rates": 0.08,
            "Credit_Spread": -0.20,
            "Gold": 0.15,
            "Real_Estate": -0.25
        },
        "inflation_surge": {
            "US_Equity": -0.10,
            "Intl_Equity": -0.12,
            "EM_Equity": -0.08,
            "US_Rates": -0.12,
            "Credit_Spread": -0.10,
            "Gold": 0.20,
            "Real_Estate": 0.08,
            "Commodities": 0.25
        },
        "deflation": {
            "US_Equity": -0.08,
            "Intl_Equity": -0.10,
            "EM_Equity": -0.15,
            "US_Rates": 0.10,
            "Credit_Spread": -0.05,
            "Gold": -0.05,
            "Commodities": -0.20
        },
        "market_rally": {
            "US_Equity": 0.20,
            "Intl_Equity": 0.25,
            "EM_Equity": 0.30,
            "US_Rates": -0.02,
            "Credit_Spread": 0.05,
            "Real_Estate": 0.15
        }
    }

    template = scenarios.get(scenario_type, scenarios["mild_recession"])

    # Match to provided asset classes (fuzzy matching)
    shocks = {}
    for asset in asset_classes:
        asset_upper = asset.upper()
        # Try exact match first
        if asset in template:
            shocks[asset] = template[asset]
        # Try fuzzy matching
        elif "EQUITY" in asset_upper or "STOCK" in asset_upper:
            if "EM" in asset_upper or "EMERGING" in asset_upper:
                shocks[asset] = template.get("EM_Equity", -0.15)
            elif "INTL" in asset_upper or "INTERNATIONAL" in asset_upper:
                shocks[asset] = template.get("Intl_Equity", -0.12)
            else:
                shocks[asset] = template.get("US_Equity", -0.10)
        elif "BOND" in asset_upper or "FIXED" in asset_upper or "RATE" in asset_upper:
            shocks[asset] = template.get("US_Rates", 0.02)
        elif "CREDIT" in asset_upper:
            shocks[asset] = template.get("Credit_Spread", -0.05)
        elif "GOLD" in asset_upper:
            shocks[asset] = template.get("Gold", 0.05)
        elif "REAL" in asset_upper or "REIT" in asset_upper:
            shocks[asset] = template.get("Real_Estate", -0.08)
        elif "COMMODITY" in asset_upper or "COMMODITIES" in asset_upper:
            shocks[asset] = template.get("Commodities", 0.10)
        else:
            # Default moderate negative shock
            shocks[asset] = -0.08

    return shocks


def rank_scenarios_by_impact(
    scenario_results: List[Dict],
    metric: str = "total_return"
) -> List[Dict]:
    """
    Rank scenarios by impact severity.

    Args:
        scenario_results: List of scenario result dictionaries
        metric: Metric to rank by (total_return, max_drawdown, volatility)

    Returns:
        Sorted list of scenarios (worst impact first)
    """
    if not scenario_results:
        return []

    # Filter out scenarios without data
    valid_results = [r for r in scenario_results if r.get("data_available", True)]

    if metric == "total_return":
        # Sort ascending (most negative first)
        return sorted(valid_results, key=lambda x: x.get(metric, 0))
    elif metric in ["max_drawdown", "volatility"]:
        # Sort ascending (most negative/highest first)
        return sorted(valid_results, key=lambda x: x.get(metric, 0))
    else:
        return valid_results


def get_scenario_summary(scenario_results: List[Dict]) -> Dict:
    """
    Generate summary statistics across all scenarios.

    Args:
        scenario_results: List of scenario result dictionaries

    Returns:
        Dictionary with summary statistics
    """
    if not scenario_results:
        return {}

    valid_results = [r for r in scenario_results if r.get("data_available", True)]

    if not valid_results:
        return {}

    returns = [r["total_return"] for r in valid_results]
    drawdowns = [r["max_drawdown"] for r in valid_results]

    return {
        "scenarios_analyzed": len(valid_results),
        "average_return": round(np.mean(returns), 2),
        "median_return": round(np.median(returns), 2),
        "worst_return": round(min(returns), 2),
        "best_return": round(max(returns), 2),
        "average_max_drawdown": round(np.mean(drawdowns), 2),
        "worst_max_drawdown": round(min(drawdowns), 2),
        "scenarios_with_negative_returns": sum(1 for r in returns if r < 0),
        "scenarios_with_positive_returns": sum(1 for r in returns if r > 0)
    }
