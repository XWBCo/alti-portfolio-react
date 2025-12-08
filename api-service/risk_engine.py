"""
Risk Computation Engine
Ported from Dash app risk_functions.py for FastAPI service
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import LassoCV
from typing import Dict, List, Tuple, Optional
import warnings

warnings.filterwarnings('ignore')


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
