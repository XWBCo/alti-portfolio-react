"""
Risk Computation Engine
Ported from Dash app risk_functions.py for FastAPI service
Extended with EWMA shrinkage, VaR/CVaR, PCTE, and full risk decomposition
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import LassoCV
from typing import Dict, List, Tuple, Optional
import warnings

warnings.filterwarnings('ignore')


# ============================================================================
# Extended Risk Functions (ported from legacy risk_functions.py/risk_functions2.py)
# ============================================================================

def calculate_var_cvar(
    returns: pd.Series,
    confidence_level: float = 0.95,
    periods_per_year: int = 12
) -> Dict:
    """
    Calculate Value at Risk (VaR) and Conditional VaR (CVaR / Expected Shortfall).

    Args:
        returns: Series of periodic returns
        confidence_level: Confidence level (e.g., 0.95 for 95% VaR)
        periods_per_year: 12 for monthly, 252 for daily

    Returns:
        Dict with var, cvar, var_annualized, cvar_annualized
    """
    returns = returns.dropna()
    if len(returns) < 10:
        return {
            'var': 0.0,
            'cvar': 0.0,
            'var_annualized': 0.0,
            'cvar_annualized': 0.0
        }

    # VaR at (1 - confidence_level) percentile
    alpha = 1 - confidence_level
    var = float(np.percentile(returns, alpha * 100))

    # CVaR: Expected value of losses beyond VaR
    cvar = float(returns[returns <= var].mean())

    # Annualize (scale by sqrt for volatility-like measures)
    annualization = np.sqrt(periods_per_year)

    return {
        'var': var,
        'cvar': cvar,
        'var_annualized': var * annualization,
        'cvar_annualized': cvar * annualization,
        'confidence_level': confidence_level
    }


def ewma_shrinkage_cov(
    returns: pd.DataFrame,
    lambda_: float = 0.94,
    shrink_target: str = "diagonal",
    shrink_alpha: float = 0.1
) -> pd.DataFrame:
    """
    Calculate EWMA covariance matrix with Ledoit-Wolf style shrinkage.

    Shrinkage moves the covariance matrix toward a structured target,
    improving estimation for portfolios with many assets.

    Args:
        returns: DataFrame of asset returns (dates x assets)
        lambda_: EWMA decay factor (0.94 typical for monthly)
        shrink_target: "diagonal" or "identity"
        shrink_alpha: Shrinkage intensity (0 = no shrinkage, 1 = full shrinkage)

    Returns:
        Shrinkage-adjusted covariance matrix
    """
    n_obs = len(returns)
    n_assets = len(returns.columns)

    if n_obs < 12:
        return returns.cov()

    # Calculate EWMA covariance
    weights = np.array([(1 - lambda_) * (lambda_ ** i) for i in range(n_obs)])
    weights = weights[::-1]
    weights = weights / weights.sum()

    centered = returns - returns.mean()
    weighted_returns = centered.multiply(np.sqrt(weights), axis=0)
    ewma_cov = weighted_returns.T @ weighted_returns

    # Build shrinkage target
    if shrink_target == "diagonal":
        # Diagonal matrix with EWMA variances
        target = pd.DataFrame(
            np.diag(np.diag(ewma_cov.values)),
            index=ewma_cov.index,
            columns=ewma_cov.columns
        )
    else:  # identity
        # Scaled identity matrix
        avg_var = np.mean(np.diag(ewma_cov.values))
        target = pd.DataFrame(
            np.eye(n_assets) * avg_var,
            index=ewma_cov.index,
            columns=ewma_cov.columns
        )

    # Apply shrinkage
    shrunk_cov = (1 - shrink_alpha) * ewma_cov + shrink_alpha * target

    return shrunk_cov


def calculate_pcte(
    portfolio_weights: pd.Series,
    benchmark_weights: pd.Series,
    returns: pd.DataFrame,
    use_ewma: bool = True,
    ewma_decay: float = 0.94
) -> Dict:
    """
    Calculate Portfolio Contribution to Tracking Error (PCTE).

    Similar to PCTR but measures each asset's contribution to tracking error
    vs benchmark rather than total portfolio risk.

    Args:
        portfolio_weights: Portfolio weights
        benchmark_weights: Benchmark weights
        returns: Asset returns
        use_ewma: Use EWMA covariance
        ewma_decay: EWMA decay factor

    Returns:
        Dict with pcte contributions per asset, total tracking error
    """
    # Align all inputs
    all_assets = portfolio_weights.index.union(benchmark_weights.index)
    all_assets = all_assets.intersection(returns.columns)

    port_w = portfolio_weights.reindex(all_assets).fillna(0)
    bench_w = benchmark_weights.reindex(all_assets).fillna(0)
    ret = returns[all_assets]

    # Normalize
    port_w = port_w / port_w.sum() if port_w.sum() > 0 else port_w
    bench_w = bench_w / bench_w.sum() if bench_w.sum() > 0 else bench_w

    # Active weights
    active_w = port_w - bench_w

    # Covariance
    if use_ewma:
        cov = calculate_ewma_covariance(ret, decay=ewma_decay)
    else:
        cov = ret.cov()

    cov = pd.DataFrame(ensure_psd(cov.values), index=cov.index, columns=cov.columns)

    # Tracking error variance
    te_var = float(active_w.values @ cov.values @ active_w.values)
    te_vol = np.sqrt(te_var) if te_var > 0 else 0

    # Marginal contribution to TE
    if te_vol > 0:
        mcte = (cov.values @ active_w.values) / te_vol
        pcte = active_w.values * mcte
        pcte_normalized = pcte / np.abs(pcte).sum() if np.abs(pcte).sum() > 0 else pcte
    else:
        mcte = np.zeros(len(active_w))
        pcte = np.zeros(len(active_w))
        pcte_normalized = pcte

    return {
        'tracking_error': float(te_vol * np.sqrt(12)),  # Annualized
        'tracking_error_monthly': float(te_vol),
        'pcte': pd.Series(pcte_normalized, index=all_assets).to_dict(),
        'mcte': pd.Series(mcte, index=all_assets).to_dict(),
        'active_weights': active_w.to_dict()
    }


def compute_full_risk_decomposition(
    portfolio_weights: pd.Series,
    benchmark_weights: pd.Series,
    security_returns: pd.DataFrame,
    factor_returns: pd.DataFrame,
    betas: pd.DataFrame,
    factor_cov: pd.DataFrame,
    residual_var: pd.Series
) -> Dict:
    """
    Full risk decomposition into systematic, specific, and active components.

    Ported from legacy risk_functions2.py compute_risk_decomposition().

    Args:
        portfolio_weights: Portfolio weights
        benchmark_weights: Benchmark weights
        security_returns: Security returns
        factor_returns: Factor returns
        betas: Security-factor betas
        factor_cov: Factor covariance matrix
        residual_var: Residual variance per security

    Returns:
        Dict with full risk breakdown
    """
    # Align all inputs
    common_securities = portfolio_weights.index.intersection(betas.index)
    common_securities = common_securities.intersection(benchmark_weights.index)
    common_factors = betas.columns.intersection(factor_cov.index)

    port_w = portfolio_weights[common_securities].values
    bench_w = benchmark_weights.reindex(common_securities).fillna(0).values
    active_w = port_w - bench_w

    B = betas.loc[common_securities, common_factors].values
    F = ensure_psd(factor_cov.loc[common_factors, common_factors].values)
    eps = residual_var.reindex(common_securities).fillna(0).values

    # ========== Portfolio Risk ==========
    port_factor_exp = port_w @ B
    port_systematic_var = port_factor_exp @ F @ port_factor_exp
    port_specific_var = np.sum(port_w**2 * eps)
    port_total_var = port_systematic_var + port_specific_var
    port_total_vol = np.sqrt(port_total_var) * np.sqrt(12)

    # ========== Benchmark Risk ==========
    bench_factor_exp = bench_w @ B
    bench_systematic_var = bench_factor_exp @ F @ bench_factor_exp
    bench_specific_var = np.sum(bench_w**2 * eps)
    bench_total_var = bench_systematic_var + bench_specific_var
    bench_total_vol = np.sqrt(bench_total_var) * np.sqrt(12)

    # ========== Active Risk (Tracking Error) ==========
    active_factor_exp = active_w @ B
    active_systematic_var = active_factor_exp @ F @ active_factor_exp
    active_specific_var = np.sum(active_w**2 * eps)
    active_total_var = active_systematic_var + active_specific_var
    tracking_error = np.sqrt(active_total_var) * np.sqrt(12)

    # ========== Factor Contributions ==========
    factor_marginal = F @ port_factor_exp
    factor_contrib = port_factor_exp * factor_marginal
    factor_contrib_pct = factor_contrib / factor_contrib.sum() if factor_contrib.sum() > 0 else factor_contrib

    return {
        'portfolio': {
            'total_risk': float(port_total_vol),
            'systematic_risk': float(np.sqrt(port_systematic_var) * np.sqrt(12)),
            'specific_risk': float(np.sqrt(port_specific_var) * np.sqrt(12)),
            'systematic_pct': float(port_systematic_var / port_total_var * 100) if port_total_var > 0 else 0,
            'specific_pct': float(port_specific_var / port_total_var * 100) if port_total_var > 0 else 0,
        },
        'benchmark': {
            'total_risk': float(bench_total_vol),
            'systematic_risk': float(np.sqrt(bench_systematic_var) * np.sqrt(12)),
            'specific_risk': float(np.sqrt(bench_specific_var) * np.sqrt(12)),
        },
        'active': {
            'tracking_error': float(tracking_error),
            'systematic_te': float(np.sqrt(active_systematic_var) * np.sqrt(12)),
            'specific_te': float(np.sqrt(active_specific_var) * np.sqrt(12)),
        },
        'factor_contributions': pd.Series(factor_contrib_pct, index=common_factors).to_dict(),
        'portfolio_factor_exposures': pd.Series(port_factor_exp, index=common_factors).to_dict(),
        'benchmark_factor_exposures': pd.Series(bench_factor_exp, index=common_factors).to_dict(),
        'active_factor_exposures': pd.Series(active_factor_exp, index=common_factors).to_dict()
    }


def calculate_segment_tracking_error(
    portfolio_weights: pd.Series,
    returns: pd.DataFrame,
    growth_benchmark: str,
    stability_benchmark: str,
    growth_allocation: float,
    stability_allocation: float,
    tier_mapping: Optional[Dict[str, str]] = None,
    use_ewma: bool = True
) -> Dict:
    """
    Calculate segment-level tracking error (Growth vs Stability portions).

    Args:
        portfolio_weights: Portfolio weights
        returns: Asset returns
        growth_benchmark: Name of growth benchmark asset
        stability_benchmark: Name of stability benchmark asset
        growth_allocation: Target growth allocation (e.g., 0.60)
        stability_allocation: Target stability allocation (e.g., 0.40)
        tier_mapping: Optional mapping of assets to tiers (Growth/Stability)
        use_ewma: Use EWMA covariance

    Returns:
        Dict with segment-level TE breakdown
    """
    common = portfolio_weights.index.intersection(returns.columns)
    weights = portfolio_weights[common]
    ret = returns[common]

    weights = weights / weights.sum() if weights.sum() > 0 else weights

    # If no tier mapping, assume all growth
    if tier_mapping is None:
        tier_mapping = {asset: "Growth" for asset in common}

    # Split portfolio by tier
    growth_assets = [a for a in common if tier_mapping.get(a, "Growth") == "Growth"]
    stability_assets = [a for a in common if tier_mapping.get(a, "Growth") in ["Stability", "Diversified"]]

    growth_w = weights.reindex(growth_assets).fillna(0)
    stability_w = weights.reindex(stability_assets).fillna(0)

    # Rescale segment weights
    growth_w_scaled = growth_w / growth_w.sum() if growth_w.sum() > 0 else growth_w
    stability_w_scaled = stability_w / stability_w.sum() if stability_w.sum() > 0 else stability_w

    # Calculate portfolio segment returns
    if len(growth_assets) > 0:
        growth_port_ret = (ret[growth_assets] * growth_w_scaled).sum(axis=1)
    else:
        growth_port_ret = pd.Series(0, index=ret.index)

    if len(stability_assets) > 0:
        stability_port_ret = (ret[stability_assets] * stability_w_scaled).sum(axis=1)
    else:
        stability_port_ret = pd.Series(0, index=ret.index)

    # Get benchmark returns
    if growth_benchmark in ret.columns:
        growth_bench_ret = ret[growth_benchmark]
    else:
        growth_bench_ret = pd.Series(0, index=ret.index)

    if stability_benchmark in ret.columns:
        stability_bench_ret = ret[stability_benchmark]
    else:
        stability_bench_ret = pd.Series(0, index=ret.index)

    # Calculate tracking errors
    growth_te = (growth_port_ret - growth_bench_ret).std() * np.sqrt(12)
    stability_te = (stability_port_ret - stability_bench_ret).std() * np.sqrt(12)

    # Blended benchmark
    blended_bench = growth_allocation * growth_bench_ret + stability_allocation * stability_bench_ret

    # Total portfolio return
    total_port_ret = (ret[common] * weights).sum(axis=1)

    # Total TE
    total_te = (total_port_ret - blended_bench).std() * np.sqrt(12)

    # Diversification benefit
    weighted_te = growth_allocation * growth_te + stability_allocation * stability_te
    diversification_benefit = weighted_te - total_te

    return {
        'total_tracking_error': float(total_te),
        'growth_tracking_error': float(growth_te),
        'stability_tracking_error': float(stability_te),
        'weighted_average_te': float(weighted_te),
        'diversification_benefit': float(diversification_benefit),
        'growth_allocation': growth_allocation,
        'stability_allocation': stability_allocation,
        'growth_assets_count': len(growth_assets),
        'stability_assets_count': len(stability_assets)
    }


# ============================================================================
# Original Functions (kept for backward compatibility)
# ============================================================================


def calculate_ewma_covariance(
    returns: pd.DataFrame,
    decay: float = 0.94,
    min_periods: int = 12
) -> pd.DataFrame:
    """
    Calculate EWMA covariance matrix with decay factor.

    Args:
        returns: DataFrame of asset returns (dates x assets)
        decay: Exponential decay factor (0.94 typical for monthly)
        min_periods: Minimum observations required

    Returns:
        Covariance matrix as DataFrame
    """
    n_obs = len(returns)
    if n_obs < min_periods:
        return returns.cov()

    # Generate exponential weights (most recent gets highest weight)
    weights = np.array([(1 - decay) * (decay ** i) for i in range(n_obs)])
    weights = weights[::-1]  # Reverse so recent data has higher weight
    weights = weights / weights.sum()  # Normalize

    # Center returns
    centered = returns - returns.mean()

    # Weighted covariance
    weighted_returns = centered.multiply(np.sqrt(weights), axis=0)
    cov_matrix = weighted_returns.T @ weighted_returns

    return pd.DataFrame(cov_matrix, index=returns.columns, columns=returns.columns)


def ensure_psd(matrix: np.ndarray, epsilon: float = 1e-10) -> np.ndarray:
    """Ensure matrix is positive semi-definite via eigenvalue clipping."""
    eigenvalues, eigenvectors = np.linalg.eigh(matrix)
    eigenvalues = np.maximum(eigenvalues, epsilon)
    return eigenvectors @ np.diag(eigenvalues) @ eigenvectors.T


def calculate_contributions(
    returns: pd.DataFrame,
    weights: pd.Series,
    use_ewma: bool = True,
    ewma_decay: float = 0.94
) -> Dict:
    """
    Calculate PCTR (Percentage Contribution to Risk) and MCTR (Marginal CTR).

    Args:
        returns: DataFrame of asset returns
        weights: Series of portfolio weights (should sum to 1)
        use_ewma: Use EWMA covariance vs simple covariance
        ewma_decay: Decay factor for EWMA

    Returns:
        Dict with pctr, mctr, portfolio_vol
    """
    # Align weights with returns columns
    common_assets = returns.columns.intersection(weights.index)
    returns = returns[common_assets]
    weights = weights[common_assets]

    # Normalize weights
    weights = weights / weights.sum()

    # Calculate covariance matrix
    if use_ewma:
        cov_matrix = calculate_ewma_covariance(returns, decay=ewma_decay)
    else:
        cov_matrix = returns.cov()

    cov_matrix = pd.DataFrame(
        ensure_psd(cov_matrix.values),
        index=cov_matrix.index,
        columns=cov_matrix.columns
    )

    # Portfolio variance and volatility
    w = weights.values
    cov = cov_matrix.values
    portfolio_var = w @ cov @ w
    portfolio_vol = np.sqrt(portfolio_var)

    # Marginal Contribution to Risk
    mctr = (cov @ w) / portfolio_vol if portfolio_vol > 0 else np.zeros_like(w)

    # Percentage Contribution to Risk
    pctr = w * mctr
    pctr = pctr / pctr.sum() if pctr.sum() != 0 else pctr  # Normalize to 100%

    return {
        'pctr': pd.Series(pctr, index=weights.index).to_dict(),
        'mctr': pd.Series(mctr, index=weights.index).to_dict(),
        'portfolio_vol': float(portfolio_vol),
        'portfolio_vol_annualized': float(portfolio_vol * np.sqrt(12))  # Monthly to annual
    }


def compute_lasso_betas(
    security_returns: pd.DataFrame,
    factor_returns: pd.DataFrame,
    min_observations: int = 24,
    cv_folds: int = 5
) -> pd.DataFrame:
    """
    Compute factor betas using LASSO regression with cross-validation.

    Args:
        security_returns: DataFrame of security returns (dates x securities)
        factor_returns: DataFrame of factor returns (dates x factors)
        min_observations: Minimum overlapping observations required
        cv_folds: Number of cross-validation folds

    Returns:
        DataFrame of betas (securities x factors)
    """
    # Align dates
    common_dates = security_returns.index.intersection(factor_returns.index)
    if len(common_dates) < min_observations:
        raise ValueError(f"Insufficient data: {len(common_dates)} < {min_observations}")

    sec_ret = security_returns.loc[common_dates]
    fac_ret = factor_returns.loc[common_dates]

    betas = pd.DataFrame(index=sec_ret.columns, columns=fac_ret.columns, dtype=float)
    residual_var = pd.Series(index=sec_ret.columns, dtype=float)

    X = fac_ret.values

    for security in sec_ret.columns:
        y = sec_ret[security].values

        # Handle NaNs
        valid_mask = ~(np.isnan(y) | np.any(np.isnan(X), axis=1))
        if valid_mask.sum() < min_observations:
            betas.loc[security] = 0.0
            residual_var[security] = np.nan
            continue

        X_valid = X[valid_mask]
        y_valid = y[valid_mask]

        try:
            lasso = LassoCV(cv=min(cv_folds, len(y_valid) // 2), max_iter=5000)
            lasso.fit(X_valid, y_valid)
            betas.loc[security] = lasso.coef_
            residual_var[security] = np.var(y_valid - lasso.predict(X_valid))
        except Exception:
            betas.loc[security] = 0.0
            residual_var[security] = np.var(y_valid) if len(y_valid) > 0 else np.nan

    return betas.fillna(0.0), residual_var


def compute_factor_risk_decomposition(
    weights: pd.Series,
    betas: pd.DataFrame,
    factor_cov: pd.DataFrame,
    residual_var: pd.Series
) -> Dict:
    """
    Decompose portfolio risk into systematic (factor) and specific components.

    Args:
        weights: Portfolio weights
        betas: Security betas to factors
        factor_cov: Factor covariance matrix
        residual_var: Residual variance per security

    Returns:
        Dict with systematic_risk, specific_risk, total_risk, factor_contributions
    """
    # Align all inputs
    common_securities = weights.index.intersection(betas.index)
    common_factors = betas.columns.intersection(factor_cov.index)

    w = weights[common_securities].values
    B = betas.loc[common_securities, common_factors].values
    F = factor_cov.loc[common_factors, common_factors].values
    eps = residual_var[common_securities].fillna(0).values

    # Ensure PSD
    F = ensure_psd(F)

    # Portfolio factor exposure
    portfolio_betas = w @ B  # 1 x factors

    # Systematic variance
    systematic_var = portfolio_betas @ F @ portfolio_betas

    # Specific variance
    specific_var = np.sum(w**2 * eps)

    # Total variance
    total_var = systematic_var + specific_var

    # Factor contributions to systematic risk
    factor_marginal = F @ portfolio_betas
    factor_contribution = portfolio_betas * factor_marginal
    factor_contribution = factor_contribution / factor_contribution.sum() if factor_contribution.sum() != 0 else factor_contribution

    return {
        'systematic_risk': float(np.sqrt(systematic_var) * np.sqrt(12)),
        'specific_risk': float(np.sqrt(specific_var) * np.sqrt(12)),
        'total_risk': float(np.sqrt(total_var) * np.sqrt(12)),
        'systematic_pct': float(systematic_var / total_var * 100) if total_var > 0 else 0,
        'factor_contributions': pd.Series(factor_contribution, index=common_factors).to_dict(),
        'portfolio_factor_exposures': pd.Series(portfolio_betas, index=common_factors).to_dict()
    }


def compute_tracking_error(
    portfolio_weights: pd.Series,
    benchmark_weights: pd.Series,
    returns: pd.DataFrame,
    use_ewma: bool = True
) -> Dict:
    """
    Compute tracking error between portfolio and benchmark.

    Args:
        portfolio_weights: Portfolio weights
        benchmark_weights: Benchmark weights
        returns: Asset returns
        use_ewma: Use EWMA covariance

    Returns:
        Dict with tracking_error, active_weights, contributions
    """
    # Align all inputs
    all_assets = portfolio_weights.index.union(benchmark_weights.index)
    all_assets = all_assets.intersection(returns.columns)

    port_w = portfolio_weights.reindex(all_assets).fillna(0)
    bench_w = benchmark_weights.reindex(all_assets).fillna(0)
    ret = returns[all_assets]

    # Active weights
    active_w = port_w - bench_w

    # Covariance
    if use_ewma:
        cov = calculate_ewma_covariance(ret)
    else:
        cov = ret.cov()

    cov = pd.DataFrame(ensure_psd(cov.values), index=cov.index, columns=cov.columns)

    # Tracking error
    te_var = active_w.values @ cov.values @ active_w.values
    te = np.sqrt(te_var) * np.sqrt(12)  # Annualized

    # Contributions to TE
    if te > 0:
        mcte = (cov.values @ active_w.values) / np.sqrt(te_var)
        te_contrib = active_w.values * mcte
        te_contrib = te_contrib / te_contrib.sum() if te_contrib.sum() != 0 else te_contrib
    else:
        te_contrib = np.zeros(len(active_w))

    return {
        'tracking_error': float(te),
        'active_weights': active_w.to_dict(),
        'te_contributions': pd.Series(te_contrib, index=all_assets).to_dict()
    }


def compute_performance_stats(
    returns: pd.Series,
    periods_per_year: int = 12,
    risk_free_rate: float = 0.03
) -> Dict:
    """
    Compute performance statistics for a return series.

    Args:
        returns: Series of returns
        periods_per_year: 12 for monthly, 252 for daily
        risk_free_rate: Annual risk-free rate

    Returns:
        Dict with CAGR, volatility, sharpe, max_drawdown
    """
    returns = returns.dropna()
    if len(returns) < 2:
        return {
            'cagr': 0.0,
            'volatility': 0.0,
            'sharpe': 0.0,
            'max_drawdown': 0.0,
            'total_return': 0.0
        }

    # Cumulative growth
    cumulative = (1 + returns).cumprod()
    total_return = cumulative.iloc[-1] - 1

    # CAGR
    n_periods = len(returns)
    n_years = n_periods / periods_per_year
    cagr = (cumulative.iloc[-1] ** (1 / n_years)) - 1 if n_years > 0 else 0

    # Volatility (annualized)
    volatility = returns.std() * np.sqrt(periods_per_year)

    # Sharpe ratio
    excess_return = cagr - risk_free_rate
    sharpe = excess_return / volatility if volatility > 0 else 0

    # Max drawdown
    rolling_max = cumulative.cummax()
    drawdown = (cumulative - rolling_max) / rolling_max
    max_drawdown = drawdown.min()

    return {
        'cagr': float(cagr),
        'volatility': float(volatility),
        'sharpe': float(sharpe),
        'max_drawdown': float(max_drawdown),
        'total_return': float(total_return)
    }


def compute_diversification_metrics(
    weights: pd.Series,
    returns: pd.DataFrame,
    use_ewma: bool = True
) -> Dict:
    """
    Compute portfolio diversification metrics.

    Args:
        weights: Portfolio weights
        returns: Asset returns
        use_ewma: Use EWMA covariance

    Returns:
        Dict with diversification_ratio, avg_correlation, benefit_pct
    """
    common = weights.index.intersection(returns.columns)
    w = weights[common]
    ret = returns[common]

    w = w / w.sum()  # Normalize

    if use_ewma:
        cov = calculate_ewma_covariance(ret)
    else:
        cov = ret.cov()

    # Individual volatilities
    individual_vols = np.sqrt(np.diag(cov.values))

    # Weighted average volatility (undiversified)
    weighted_avg_vol = np.sum(w.values * individual_vols)

    # Portfolio volatility (diversified)
    portfolio_var = w.values @ cov.values @ w.values
    portfolio_vol = np.sqrt(portfolio_var)

    # Diversification ratio
    div_ratio = weighted_avg_vol / portfolio_vol if portfolio_vol > 0 else 1.0

    # Diversification benefit
    div_benefit_pct = (1 - portfolio_vol / weighted_avg_vol) * 100 if weighted_avg_vol > 0 else 0

    # Weighted average pairwise correlation
    corr = ret.corr()
    n = len(w)
    if n > 1:
        total_weight = 0
        weighted_corr = 0
        for i in range(n):
            for j in range(i + 1, n):
                pair_weight = w.iloc[i] * w.iloc[j]
                weighted_corr += pair_weight * corr.iloc[i, j]
                total_weight += pair_weight
        avg_corr = weighted_corr / total_weight if total_weight > 0 else 0
    else:
        avg_corr = 1.0

    return {
        'diversification_ratio': float(div_ratio),
        'diversification_benefit_pct': float(div_benefit_pct),
        'weighted_avg_correlation': float(avg_corr),
        'portfolio_vol_annualized': float(portfolio_vol * np.sqrt(12)),
        'weighted_avg_vol_annualized': float(weighted_avg_vol * np.sqrt(12))
    }
