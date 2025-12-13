"""
Data Loading Utilities for Risk and Optimization Engines
Loads CMA data, correlation matrices, and return series from the data directory.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional, Tuple
import warnings

warnings.filterwarnings('ignore')

# Data directory relative to this file
DATA_DIR = Path(__file__).parent.parent / "data"


def load_cma_data(file_path: Optional[str] = None) -> pd.DataFrame:
    """
    Load Capital Market Assumptions data.

    Expected columns: ASSET CLASS, RETURN, RISK, CAP_MAX, RISK ALLOCATION

    Args:
        file_path: Optional path to CMA file. If None, uses default location.

    Returns:
        DataFrame with CMA data
    """
    if file_path:
        path = Path(file_path)
    else:
        # Try multiple possible file locations
        possible_paths = [
            DATA_DIR / "cma_data.csv",
            DATA_DIR / "cma_input3.xlsx",
            DATA_DIR / "CMA_data.csv",
        ]
        path = None
        for p in possible_paths:
            if p.exists():
                path = p
                break

    if path is None or not path.exists():
        # Return mock CMA data for development
        return _generate_mock_cma_data()

    if path.suffix == '.xlsx':
        df = pd.read_excel(path, sheet_name='RR')
    else:
        df = pd.read_csv(path)

    # Normalize column names
    df.columns = df.columns.str.strip().str.upper()

    # Map common column name variations to standard names
    column_mapping = {
        'FORECAST RETURN': 'RETURN',
        'EXPECTED RETURN': 'RETURN',
        'EXP_RETURN': 'RETURN',
        'RET': 'RETURN',
        'FORECAST VOLATILITY': 'RISK',
        'VOLATILITY': 'RISK',
        'VOL': 'RISK',
        'STD': 'RISK',
        'ASSET': 'ASSET CLASS',
        'NAME': 'ASSET CLASS',
        'SECURITY': 'ASSET CLASS',
    }

    # Apply column name mapping
    df = df.rename(columns=column_mapping)

    # Ensure required columns exist
    required = ['ASSET CLASS', 'RETURN', 'RISK']
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"CMA data missing required columns: {missing}. Available: {list(df.columns)}")

    return df


def load_correlation_matrix(file_path: Optional[str] = None) -> pd.DataFrame:
    """
    Load asset correlation matrix.

    Args:
        file_path: Optional path to correlation file. If None, uses default.

    Returns:
        DataFrame with correlation matrix (assets x assets)
    """
    if file_path:
        path = Path(file_path)
    else:
        possible_paths = [
            DATA_DIR / "correlation_matrix.csv",
            DATA_DIR / "cma_input3.xlsx",
            DATA_DIR / "corr_matrix.csv",
        ]
        path = None
        for p in possible_paths:
            if p.exists():
                path = p
                break

    if path is None or not path.exists():
        return _generate_mock_correlation_matrix()

    if path.suffix == '.xlsx':
        df = pd.read_excel(path, sheet_name='CORR', index_col=0)
    else:
        df = pd.read_csv(path, index_col=0)

    # Ensure symmetric
    df = (df + df.T) / 2

    # Ensure diagonal is 1
    np.fill_diagonal(df.values, 1.0)

    # Clip correlation values to valid range [-1, 1]
    # Sometimes numerical issues can cause values slightly outside this range
    df = df.clip(lower=-1.0, upper=1.0)

    # Ensure positive semi-definite by adjusting small negative eigenvalues
    try:
        eigenvalues, eigenvectors = np.linalg.eigh(df.values)
        # Set small negative eigenvalues to zero
        eigenvalues = np.maximum(eigenvalues, 0)
        # Reconstruct the matrix
        corr_fixed = eigenvectors @ np.diag(eigenvalues) @ eigenvectors.T
        # Convert back to correlation (normalize by diagonal)
        d = np.sqrt(np.diag(corr_fixed))
        corr_fixed = corr_fixed / np.outer(d, d)
        # Ensure diagonal is exactly 1
        np.fill_diagonal(corr_fixed, 1.0)
        df = pd.DataFrame(corr_fixed, index=df.index, columns=df.columns)
    except np.linalg.LinAlgError:
        # If eigenvalue decomposition fails, just clip and use as-is
        pass

    return df


def load_return_series(
    currency: str = "USD",
    file_path: Optional[str] = None
) -> pd.DataFrame:
    """
    Load historical return series.

    Args:
        currency: Currency code (USD, EUR, GBP, etc.)
        file_path: Optional path to returns file.

    Returns:
        DataFrame with returns (dates x assets)
    """
    if file_path:
        path = Path(file_path)
    else:
        suffix = "" if currency.upper() == "USD" else f"_{currency.lower()}"
        possible_paths = [
            DATA_DIR / f"return_series{suffix}.csv",
            DATA_DIR / f"returns{suffix}.csv",
            DATA_DIR / "cma_input3.xlsx",
        ]
        path = None
        for p in possible_paths:
            if p.exists():
                path = p
                break

    if path is None or not path.exists():
        return _generate_mock_returns()

    if path.suffix == '.xlsx':
        df = pd.read_excel(path, sheet_name='RETURNS')
    else:
        # Read CSV - these files don't have a date column, just sequential data
        df = pd.read_csv(path)

    # Check if we have a date index/column
    has_dates = False

    # Skip RangeIndex - it's just sequential row numbers, not dates
    if not isinstance(df.index, pd.RangeIndex):
        # Try to convert index to datetime if it exists and looks like dates
        try:
            test_index = pd.to_datetime(df.index, errors='coerce')
            # Check if conversion succeeded and dates are reasonable
            if not test_index.isna().any() and (test_index.year >= 1900).all() and (test_index.year <= 2100).all():
                df.index = test_index
                df.index.name = 'Date'
                has_dates = True
        except (ValueError, TypeError, AttributeError):
            pass

    # If no date index yet, check for a date column
    if not has_dates:
        date_cols = ['DATE', 'Date', 'date']
        for col in date_cols:
            if col in df.columns:
                try:
                    df.index = pd.to_datetime(df[col])
                    df = df.drop(columns=[col])
                    df.index.name = 'Date'
                    has_dates = True
                    break
                except (ValueError, TypeError):
                    continue

    # If still no dates, generate monthly date index
    # Assume data ends at current month and goes back n_periods
    if not has_dates:
        n_periods = len(df)
        # Generate dates ending at the most recent month-end
        # Use current date minus 1 month to get last complete month
        now = pd.Timestamp.now()
        end_date = now.replace(day=1) - pd.DateOffset(days=1)
        dates = pd.date_range(end=end_date, periods=n_periods, freq='ME')
        df.index = dates
        df.index.name = 'Date'

    # Ensure all columns are numeric
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    # Drop rows with all NaN values
    df = df.dropna(how='all')

    # Sort by date
    df = df.sort_index()

    return df


def load_beta_matrix(date: Optional[str] = None) -> pd.DataFrame:
    """
    Load security-factor beta matrix.

    Args:
        date: Optional date string (YYYY-MM-DD). If None, loads latest.

    Returns:
        DataFrame with betas (securities x factors)
    """
    cov_dir = DATA_DIR / "Covariance_Matrix"

    if not cov_dir.exists():
        return _generate_mock_betas()

    if date is None:
        # Get latest file
        files = sorted(cov_dir.glob("betas_*.csv"))
        if not files:
            return _generate_mock_betas()
        path = files[-1]
    else:
        path = cov_dir / f"betas_{date}.csv"
        if not path.exists():
            path = cov_dir / f"betas_{date}_p.csv"

    if not path.exists():
        return _generate_mock_betas()

    # Try different encodings
    for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
        try:
            df = pd.read_csv(path, index_col=0, encoding=encoding)
            return df
        except (UnicodeDecodeError, Exception) as e:
            if encoding == 'iso-8859-1':  # Last attempt
                print(f"Warning: Could not load beta matrix from {path}: {e}")
                return _generate_mock_betas()
            continue

    return _generate_mock_betas()


def load_factor_covariance(date: Optional[str] = None) -> pd.DataFrame:
    """
    Load factor covariance matrix.

    Args:
        date: Optional date string. If None, loads latest.

    Returns:
        DataFrame with factor covariance (factors x factors)
    """
    cov_dir = DATA_DIR / "Covariance_Matrix"

    if not cov_dir.exists():
        return _generate_mock_factor_cov()

    if date is None:
        files = sorted(cov_dir.glob("factor_cov_*.csv"))
        if not files:
            return _generate_mock_factor_cov()
        path = files[-1]
    else:
        path = cov_dir / f"factor_cov_{date}.csv"

    if not path.exists():
        return _generate_mock_factor_cov()

    return pd.read_csv(path, index_col=0)


def load_all_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Load all data files at once.

    Returns:
        Tuple of (cma_data, correlation_matrix, returns, betas, factor_cov)
    """
    return (
        load_cma_data(),
        load_correlation_matrix(),
        load_return_series(),
        load_beta_matrix(),
        load_factor_covariance()
    )


# ============================================================================
# Mock Data Generators (for development/testing)
# ============================================================================

def _generate_mock_cma_data() -> pd.DataFrame:
    """Generate mock CMA data for testing."""
    assets = [
        ("GLOBAL CASH", 0.025, 0.01, "STABILITY"),
        ("GLOBAL GOVERNMENT", 0.035, 0.05, "STABILITY"),
        ("GLOBAL AGGREGATE", 0.045, 0.06, "STABILITY"),
        ("HIGH YIELD", 0.065, 0.10, "DIVERSIFIED"),
        ("GOLD", 0.04, 0.15, "DIVERSIFIED"),
        ("GLOBAL", 0.08, 0.16, "GROWTH"),
        ("EM", 0.10, 0.22, "GROWTH"),
        ("PRIVATE DEBT", 0.07, 0.08, "DIVERSIFIED"),
        ("PRIVATE INFRASTRUCTURE", 0.075, 0.12, "DIVERSIFIED"),
        ("REAL ESTATE", 0.065, 0.14, "DIVERSIFIED"),
        ("ABSOLUTE RETURN HS", 0.055, 0.08, "DIVERSIFIED"),
        ("GROWTH DIRECTIONAL HF", 0.07, 0.12, "GROWTH"),
        ("PRIVATE EQUITY", 0.12, 0.25, "GROWTH"),
        ("VENTURE", 0.15, 0.35, "GROWTH"),
        ("CLO", 0.08, 0.12, "DIVERSIFIED"),
    ]

    return pd.DataFrame(
        [(a[0], a[1], a[2], 1.0, a[3]) for a in assets],
        columns=["ASSET CLASS", "RETURN", "RISK", "CAP_MAX", "RISK ALLOCATION"]
    )


def _generate_mock_correlation_matrix() -> pd.DataFrame:
    """Generate mock correlation matrix."""
    assets = [
        "GLOBAL CASH", "GLOBAL GOVERNMENT", "GLOBAL AGGREGATE", "HIGH YIELD",
        "GOLD", "GLOBAL", "EM", "PRIVATE DEBT", "PRIVATE INFRASTRUCTURE",
        "REAL ESTATE", "ABSOLUTE RETURN HS", "GROWTH DIRECTIONAL HF",
        "PRIVATE EQUITY", "VENTURE", "CLO"
    ]

    n = len(assets)
    np.random.seed(42)

    # Generate a valid correlation matrix
    A = np.random.randn(n, n) * 0.3
    corr = A @ A.T
    D = np.sqrt(np.diag(corr))
    corr = corr / np.outer(D, D)
    np.fill_diagonal(corr, 1.0)

    return pd.DataFrame(corr, index=assets, columns=assets)


def _generate_mock_returns(n_periods: int = 60) -> pd.DataFrame:
    """Generate mock return series."""
    np.random.seed(42)

    assets = [
        "GLOBAL CASH", "GLOBAL GOVERNMENT", "GLOBAL AGGREGATE", "HIGH YIELD",
        "GOLD", "GLOBAL", "EM", "PRIVATE DEBT", "PRIVATE INFRASTRUCTURE",
        "REAL ESTATE", "ABSOLUTE RETURN HS", "GROWTH DIRECTIONAL HF",
        "PRIVATE EQUITY"
    ]

    dates = pd.date_range(end=pd.Timestamp.now(), periods=n_periods, freq='M')

    # Expected monthly returns and vols
    expected_rets = [0.002, 0.003, 0.004, 0.005, 0.003, 0.007, 0.008, 0.006, 0.006, 0.005, 0.004, 0.006, 0.01]
    vols = [0.003, 0.015, 0.018, 0.03, 0.04, 0.045, 0.06, 0.025, 0.035, 0.04, 0.025, 0.035, 0.07]

    returns = np.zeros((n_periods, len(assets)))
    for i, (ret, vol) in enumerate(zip(expected_rets, vols)):
        returns[:, i] = np.random.normal(ret, vol, n_periods)

    return pd.DataFrame(returns, index=dates, columns=assets)


def _generate_mock_betas() -> pd.DataFrame:
    """Generate mock beta matrix."""
    np.random.seed(123)

    securities = [f"Security_{i}" for i in range(20)]
    factors = ['US_Equity', 'Intl_Equity', 'EM_Equity', 'US_Rates', 'EU_Rates',
               'Credit_Spread', 'USD_FX', 'Commodities', 'Gold', 'VIX']

    betas = np.random.randn(len(securities), len(factors)) * 0.3

    return pd.DataFrame(betas, index=securities, columns=factors)


def _generate_mock_factor_cov() -> pd.DataFrame:
    """Generate mock factor covariance matrix."""
    np.random.seed(456)

    factors = ['US_Equity', 'Intl_Equity', 'EM_Equity', 'US_Rates', 'EU_Rates',
               'Credit_Spread', 'USD_FX', 'Commodities', 'Gold', 'VIX']

    n = len(factors)
    vols = np.array([0.04, 0.045, 0.06, 0.015, 0.015, 0.02, 0.02, 0.05, 0.04, 0.08])

    # Generate correlation structure
    A = np.random.randn(n, n) * 0.3
    corr = A @ A.T
    D = np.sqrt(np.diag(corr))
    corr = corr / np.outer(D, D)
    np.fill_diagonal(corr, 1.0)

    # Convert to covariance
    cov = np.outer(vols, vols) * corr

    return pd.DataFrame(cov, index=factors, columns=factors)
