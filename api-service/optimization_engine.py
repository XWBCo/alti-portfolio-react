"""
Portfolio Optimization Engine
Ported from Dash app_eval.py for FastAPI service

Contains:
- Efficient frontier computation via mean-variance optimization
- QP solver with scipy.optimize (SLSQP)
- Asset universe selection (core/core_private/unconstrained)
- Bucket allocation constraints (Stability/Growth/Diversified)
- Blended benchmark calculation
"""

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from typing import Dict, List, Tuple, Optional, Callable
import warnings

warnings.filterwarnings('ignore')


# ============================================================================
# Asset Class Definitions
# ============================================================================

CORE_ASSETS = {
    "GLOBAL CASH",
    "GLOBAL GOVERNMENT",
    "GLOBAL AGGREGATE",
    "HIGH YIELD",
    "GOLD",
    "GLOBAL",
    "EM"
}

PRIVATE_ASSETS = {
    "GLOBAL CASH",
    "GLOBAL GOVERNMENT",
    "PRIVATE DEBT",
    "PRIVATE INFRASTRUCTURE",
    "REAL ESTATE",
    "ABSOLUTE RETURN HS",
    "GROWTH DIRECTIONAL HF",
    "PRIVATE EQUITY"
}

SPECIAL_ASSETS = {"VENTURE", "CLO", "DEVELOPMENT", "SPECIAL SITS", "GROWTH"}


# ============================================================================
# Universe Selection
# ============================================================================

def build_universe(
    mode: str,
    cma_data: pd.DataFrame
) -> pd.DataFrame:
    """
    Select asset universe based on mode.

    Args:
        mode: "core" | "core_private" | "unconstrained" (or None)
        cma_data: DataFrame with columns [ASSET CLASS, RETURN, RISK, ...]

    Returns:
        Filtered DataFrame of assets to include in optimization
    """
    # Normalize asset names
    if "ASSET CLASS" not in cma_data.columns:
        raise ValueError("CMA data must have 'ASSET CLASS' column")

    names = cma_data["ASSET CLASS"].str.upper()

    if mode == "core":
        mask = names.isin(CORE_ASSETS)
    elif mode == "core_private":
        mask = names.isin(CORE_ASSETS | PRIVATE_ASSETS)
    else:
        # Unconstrained: use all assets
        mask = np.ones(len(cma_data), dtype=bool)

    sub = cma_data.loc[mask].copy()

    # Filter out assets with invalid risk/return
    sub = sub[(sub["RISK"].fillna(0) > 0) & sub["RETURN"].notna()]

    return sub


# ============================================================================
# Constraint Building
# ============================================================================

def caps_from_template(
    assets: pd.DataFrame,
    template: str
) -> List[Tuple[float, float]]:
    """
    Generate position bounds from template.

    Args:
        assets: DataFrame with optional CAP_MAX column
        template: "tight" | "loose" | "std" (standard)

    Returns:
        List of (min, max) bounds per asset
    """
    # Get CAP_MAX if available, default to 1.0
    caps = assets.get("CAP_MAX", pd.Series(1.0, index=assets.index))
    caps = caps.clip(0.0, 1.0).astype(float).values

    if template == "tight":
        caps = np.minimum(caps, 0.25)
    elif template == "loose":
        caps = np.minimum(caps, 1.00)
    # "std" uses caps as-is

    return [(0.0, float(c)) for c in caps]


def special_caps(assets: pd.DataFrame) -> List[Tuple[float, float]]:
    """
    Apply tighter limits to specialized/illiquid assets.

    Args:
        assets: DataFrame with ASSET CLASS column

    Returns:
        List of (min, max) bounds per asset
    """
    bounds = []
    for asset_name in assets["ASSET CLASS"].str.upper():
        if asset_name in SPECIAL_ASSETS:
            bounds.append((0.0, 0.25))
        else:
            bounds.append((0.0, 1.0))
    return bounds


def bucket_indices(assets: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Get indices for Stability/Diversified/Growth buckets.

    Args:
        assets: DataFrame with RISK ALLOCATION column

    Returns:
        Tuple of (stability_idx, diversified_idx, growth_idx)
    """
    if "RISK ALLOCATION" not in assets.columns:
        # Default: all stability
        return np.arange(len(assets)), np.array([]), np.array([])

    ra = assets["RISK ALLOCATION"].astype(str).str.strip().str.upper().fillna("")

    div_idx = np.where(ra == "DIVERSIFIED")[0]
    grow_idx = np.where(ra == "GROWTH")[0]

    if len(div_idx) + len(grow_idx) > 0:
        stab_idx = np.setdiff1d(np.arange(len(assets)), np.concatenate([div_idx, grow_idx]))
    else:
        stab_idx = np.arange(len(assets))

    return stab_idx, div_idx, grow_idx


def build_bucket_env(assets: pd.DataFrame) -> List[Tuple[np.ndarray, float, float]]:
    """
    Build bucket constraint environment for optimizer.

    Args:
        assets: DataFrame with RISK ALLOCATION column

    Returns:
        List of (indices, lo, hi) tuples for each bucket
    """
    stab_idx, div_idx, grow_idx = bucket_indices(assets)

    env = []
    if len(stab_idx) > 0:
        env.append((stab_idx, 0.0, 1.0))
    if len(div_idx) > 0:
        env.append((div_idx, 0.0, 1.0))
    if len(grow_idx) > 0:
        env.append((grow_idx, 0.0, 1.0))

    return env


# ============================================================================
# Mean-Variance Parameters
# ============================================================================

def ensure_psd(matrix: np.ndarray, epsilon: float = 1e-10) -> np.ndarray:
    """Ensure matrix is positive semi-definite via eigenvalue clipping."""
    eigenvalues, eigenvectors = np.linalg.eigh(matrix)
    eigenvalues = np.maximum(eigenvalues, epsilon)
    return eigenvectors @ np.diag(eigenvalues) @ eigenvectors.T


def mean_cov_from_assets(
    assets: pd.DataFrame,
    correlation_matrix: pd.DataFrame
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Build mean vector and PSD-repaired covariance matrix.

    Args:
        assets: DataFrame with ASSET CLASS, RETURN, RISK columns
        correlation_matrix: Correlation matrix (assets x assets)

    Returns:
        Tuple of (mu, Sigma, asset_names)
    """
    asset_names = assets["ASSET CLASS"].str.upper().tolist()
    mu = assets["RETURN"].astype(float).values
    sig = assets["RISK"].astype(float).values

    # Get correlation submatrix for selected assets
    corr = correlation_matrix.reindex(index=asset_names, columns=asset_names).fillna(0.0).values

    # Build covariance: Sigma = outer(sig, sig) * Corr
    Sigma = np.outer(sig, sig) * corr

    # PSD repair via eigenvalue clipping
    Sigma = ensure_psd(Sigma)

    return mu, Sigma, asset_names


# ============================================================================
# QP Solver
# ============================================================================

def qp_solver(
    mu: np.ndarray,
    Sigma: np.ndarray,
    bounds: List[Tuple[float, float]],
    bucket_env: Optional[List[Tuple[np.ndarray, float, float]]] = None
) -> Callable:
    """
    Create SLSQP solver for efficient frontier.

    Args:
        mu: Expected returns vector
        Sigma: Covariance matrix
        bounds: Per-asset (min, max) bounds
        bucket_env: Optional bucket constraints [(indices, lo, hi), ...]

    Returns:
        Callable solver(lambda, x0=None) -> OptimizeResult
    """
    n = len(mu)

    def solve_for_lambda(lmbd: float, x0: Optional[np.ndarray] = None):
        """
        Solve mean-variance optimization for given risk aversion lambda.

        Objective: minimize lambda * (w @ Sigma @ w) - mu @ w
        """
        def obj(w):
            return float(lmbd * (w @ Sigma @ w) - mu @ w)

        def grad(w):
            return (2 * lmbd) * (Sigma @ w) - mu

        # Constraints
        constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1.0}]

        # Bucket constraints
        if bucket_env:
            for idxs, lo, hi in bucket_env:
                # Lower bound: sum(w[idxs]) >= lo
                constraints.append({
                    "type": "ineq",
                    "fun": lambda w, idx=idxs, L=lo: np.sum(w[idx]) - L
                })
                # Upper bound: sum(w[idxs]) <= hi
                constraints.append({
                    "type": "ineq",
                    "fun": lambda w, idx=idxs, H=hi: H - np.sum(w[idx])
                })

        # Initial guess
        if x0 is None:
            x0 = np.full(n, 1.0 / n)

        # Clip to bounds
        x0 = np.clip(x0, [b[0] for b in bounds], [b[1] for b in bounds])

        # Solve
        result = minimize(
            obj,
            x0,
            jac=grad,
            method="SLSQP",
            bounds=bounds,
            constraints=constraints,
            options={"maxiter": 200, "ftol": 1e-9, "disp": False}
        )

        return result

    return solve_for_lambda


# ============================================================================
# Efficient Frontier
# ============================================================================

def compute_efficient_frontier(
    cma_data: pd.DataFrame,
    correlation_matrix: pd.DataFrame,
    mode: str = "unconstrained",
    caps_template: str = "std",
    custom_assets: Optional[List[str]] = None,
    n_points: int = 30,
    lambdas: Optional[np.ndarray] = None
) -> Dict:
    """
    Compute full efficient frontier with lambda sweep.

    Args:
        cma_data: CMA data with ASSET CLASS, RETURN, RISK, etc.
        correlation_matrix: Asset correlation matrix
        mode: "core" | "core_private" | "unconstrained"
        caps_template: "tight" | "loose" | "std"
        custom_assets: Optional list of asset names to use
        n_points: Number of frontier points
        lambdas: Optional array of risk aversion parameters

    Returns:
        Dict with frontier data: risks, returns, weights, assets
    """
    # Select universe
    if custom_assets and len(custom_assets) >= 2:
        wanted = {a.upper() for a in custom_assets}
        sub = cma_data[cma_data["ASSET CLASS"].str.upper().isin(wanted)].copy()
        sub = sub[(sub["RISK"].fillna(0) > 0) & sub["RETURN"].notna()]
    else:
        sub = build_universe(mode, cma_data)

    if len(sub) < 2:
        return {
            "risks": [],
            "returns": [],
            "weights": [],
            "assets": [],
            "error": "Need at least 2 assets"
        }

    # Build parameters
    mu, Sigma, asset_names = mean_cov_from_assets(sub, correlation_matrix)

    # Build constraints
    gen_bounds = caps_from_template(sub, caps_template)
    spec_bounds = special_caps(sub)

    # Combine bounds (take stricter)
    bounds = [(0.0, min(g[1], s[1])) for g, s in zip(gen_bounds, spec_bounds)]

    # Bucket constraints
    bucket_env = build_bucket_env(sub)

    # Create solver
    solver = qp_solver(mu, Sigma, bounds, bucket_env=bucket_env)

    # Lambda sweep (geometric spacing from low to high risk aversion)
    if lambdas is None:
        lambdas = np.geomspace(0.1, 200.0, n_points)

    # Compute frontier
    risks = []
    rets = []
    weights_list = []
    x0 = None

    for lam in lambdas:
        result = solver(lam, x0=x0)
        if result.success:
            w = result.x
            x0 = w  # Warm start for next iteration

            port_return = float(mu @ w)
            port_risk = float(np.sqrt(max(w @ Sigma @ w, 0.0)))

            rets.append(port_return)
            risks.append(port_risk)
            weights_list.append(dict(zip(asset_names, w.tolist())))

    return {
        "risks": risks,
        "returns": rets,
        "weights": weights_list,
        "assets": asset_names,
        "n_portfolios": len(risks),
        "mode": mode,
        "caps_template": caps_template
    }


# ============================================================================
# Blended Benchmark
# ============================================================================

def calculate_blended_benchmark(
    cma_data: pd.DataFrame,
    correlation_matrix: pd.DataFrame,
    equity_type: str = "GLOBAL",
    fixed_income_type: str = "GLOBAL AGGREGATE",
    equity_allocation: float = 0.60,
    fixed_income_allocation: float = 0.40
) -> Dict:
    """
    Calculate blended benchmark risk/return from 2-asset model.

    Args:
        cma_data: CMA data with ASSET CLASS, RETURN, RISK
        correlation_matrix: Correlation matrix
        equity_type: Equity asset class name
        fixed_income_type: Fixed income asset class name
        equity_allocation: Equity weight (e.g., 0.60)
        fixed_income_allocation: Fixed income weight (e.g., 0.40)

    Returns:
        Dict with blended return, risk, and component data
    """
    # Build lookup maps
    cma_data = cma_data.copy()
    cma_data["ASSET CLASS"] = cma_data["ASSET CLASS"].str.upper()

    return_map = dict(zip(cma_data["ASSET CLASS"], cma_data["RETURN"]))
    risk_map = dict(zip(cma_data["ASSET CLASS"], cma_data["RISK"]))

    eq_type = equity_type.upper()
    fi_type = fixed_income_type.upper()

    eq_ret = return_map.get(eq_type, 0.08)
    eq_risk = risk_map.get(eq_type, 0.16)
    fi_ret = return_map.get(fi_type, 0.04)
    fi_risk = risk_map.get(fi_type, 0.05)

    # Get correlation
    try:
        corr = correlation_matrix.loc[eq_type, fi_type]
        if pd.isna(corr):
            corr = 0.2
    except KeyError:
        corr = 0.2  # Default correlation

    # Blended return (weighted average)
    blended_return = equity_allocation * eq_ret + fixed_income_allocation * fi_ret

    # Blended risk (portfolio volatility formula)
    blended_var = (
        (equity_allocation ** 2) * (eq_risk ** 2) +
        (fixed_income_allocation ** 2) * (fi_risk ** 2) +
        2 * equity_allocation * fixed_income_allocation * eq_risk * fi_risk * corr
    )
    blended_risk = np.sqrt(blended_var)

    return {
        "blended_return": float(blended_return),
        "blended_risk": float(blended_risk),
        "equity": {
            "type": eq_type,
            "return": float(eq_ret),
            "risk": float(eq_risk),
            "allocation": equity_allocation
        },
        "fixed_income": {
            "type": fi_type,
            "return": float(fi_ret),
            "risk": float(fi_risk),
            "allocation": fixed_income_allocation
        },
        "correlation": float(corr)
    }


# ============================================================================
# Portfolio Inefficiency Detection
# ============================================================================

def detect_inefficiencies(
    holdings: pd.DataFrame,
    current_column: str,
    proposed_column: str,
    benchmark_allocations: Dict[str, float],
    threshold: float = 0.03
) -> List[Dict]:
    """
    Flag portfolio positions deviating significantly from benchmark.

    Args:
        holdings: DataFrame with ASSET CLASS column and portfolio weight columns
        current_column: Name of current allocation column
        proposed_column: Name of proposed allocation column
        benchmark_allocations: Dict of {asset: benchmark_weight}
        threshold: Minimum deviation to flag (e.g., 0.03 = 3%)

    Returns:
        List of dicts with flagged assets and deviations
    """
    if current_column not in holdings.columns or proposed_column not in holdings.columns:
        return []

    # Normalize allocations
    holdings = holdings.copy()
    for col in [current_column, proposed_column]:
        s = holdings[col].fillna(0.0)
        tot = s.sum()
        if tot > 0:
            holdings[col] = s / tot

    # Map benchmark allocations
    benchmark_allocations = {k.upper(): v for k, v in benchmark_allocations.items()}
    holdings["BENCHMARK"] = holdings["ASSET CLASS"].str.upper().map(benchmark_allocations).fillna(0.0)

    flags = []
    for _, row in holdings.iterrows():
        asset = row["ASSET CLASS"]
        bucket = row.get("RISK ALLOCATION", "")

        curr = float(row[current_column])
        prop = float(row[proposed_column])
        bench = float(row["BENCHMARK"])

        delta_curr = prop - curr  # vs current
        delta_bench = prop - bench  # vs benchmark

        if abs(delta_curr) >= threshold or abs(delta_bench) >= threshold:
            flags.append({
                "asset": asset,
                "bucket": bucket,
                "current_pct": round(curr * 100, 1),
                "proposed_pct": round(prop * 100, 1),
                "benchmark_pct": round(bench * 100, 1),
                "vs_current_delta": round(delta_curr * 100, 1),
                "vs_benchmark_delta": round(delta_bench * 100, 1)
            })

    return flags


# ============================================================================
# Optimal Portfolio Selection
# ============================================================================

def find_optimal_portfolio(
    frontier_risks: List[float],
    frontier_returns: List[float],
    frontier_weights: List[Dict],
    target_return: Optional[float] = None,
    target_risk: Optional[float] = None,
    risk_free_rate: float = 0.03
) -> Dict:
    """
    Find optimal portfolio from efficient frontier.

    Args:
        frontier_risks: List of portfolio risks
        frontier_returns: List of portfolio returns
        frontier_weights: List of portfolio weight dicts
        target_return: Target return (finds min-risk portfolio achieving it)
        target_risk: Target risk (finds max-return portfolio within it)
        risk_free_rate: Risk-free rate for Sharpe calculation

    Returns:
        Dict with optimal portfolio data
    """
    if len(frontier_risks) == 0:
        return {"error": "Empty frontier"}

    risks = np.array(frontier_risks)
    rets = np.array(frontier_returns)

    # Calculate Sharpe ratios
    sharpes = (rets - risk_free_rate) / np.maximum(risks, 1e-10)

    if target_return is not None:
        # Find min-risk portfolio achieving target return
        valid = rets >= target_return
        if not np.any(valid):
            idx = np.argmax(rets)  # Best return if target not achievable
        else:
            valid_risks = np.where(valid, risks, np.inf)
            idx = np.argmin(valid_risks)

    elif target_risk is not None:
        # Find max-return portfolio within target risk
        valid = risks <= target_risk
        if not np.any(valid):
            idx = np.argmin(risks)  # Min risk if target not achievable
        else:
            valid_rets = np.where(valid, rets, -np.inf)
            idx = np.argmax(valid_rets)

    else:
        # Max Sharpe ratio
        idx = np.argmax(sharpes)

    return {
        "index": int(idx),
        "return": float(rets[idx]),
        "risk": float(risks[idx]),
        "sharpe_ratio": float(sharpes[idx]),
        "weights": frontier_weights[idx],
        "selection_method": (
            f"target_return={target_return}" if target_return else
            f"target_risk={target_risk}" if target_risk else
            "max_sharpe"
        )
    }
