"""
Pytest fixtures for risk engine tests
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path


@pytest.fixture
def sample_cma_data():
    """Sample CMA data for testing."""
    return pd.DataFrame({
        "ASSET CLASS": [
            "GLOBAL CASH",
            "GLOBAL GOVERNMENT",
            "GLOBAL AGGREGATE",
            "HIGH YIELD",
            "GLOBAL",
            "EM",
            "PRIVATE EQUITY"
        ],
        "RETURN": [0.025, 0.035, 0.045, 0.065, 0.08, 0.10, 0.12],
        "RISK": [0.01, 0.05, 0.06, 0.10, 0.16, 0.22, 0.25],
        "CAP_MAX": [1.0, 1.0, 1.0, 0.5, 1.0, 0.5, 0.3],
        "RISK ALLOCATION": [
            "STABILITY",
            "STABILITY",
            "STABILITY",
            "DIVERSIFIED",
            "GROWTH",
            "GROWTH",
            "GROWTH"
        ]
    })


@pytest.fixture
def sample_correlation_matrix():
    """Sample correlation matrix for testing."""
    assets = [
        "GLOBAL CASH",
        "GLOBAL GOVERNMENT",
        "GLOBAL AGGREGATE",
        "HIGH YIELD",
        "GLOBAL",
        "EM",
        "PRIVATE EQUITY"
    ]

    n = len(assets)
    np.random.seed(42)

    # Generate valid correlation matrix
    A = np.random.randn(n, n) * 0.3
    corr = A @ A.T
    D = np.sqrt(np.diag(corr))
    corr = corr / np.outer(D, D)
    np.fill_diagonal(corr, 1.0)

    return pd.DataFrame(corr, index=assets, columns=assets)


@pytest.fixture
def sample_returns():
    """Sample return series for testing."""
    np.random.seed(42)

    assets = ["GLOBAL", "EM", "GLOBAL AGGREGATE", "HIGH YIELD", "GLOBAL CASH"]
    n_periods = 60

    dates = pd.date_range(end=pd.Timestamp.now(), periods=n_periods, freq='M')

    # Expected monthly returns and vols
    expected_rets = [0.007, 0.008, 0.004, 0.005, 0.002]
    vols = [0.045, 0.06, 0.018, 0.03, 0.003]

    returns = np.zeros((n_periods, len(assets)))
    for i, (ret, vol) in enumerate(zip(expected_rets, vols)):
        returns[:, i] = np.random.normal(ret, vol, n_periods)

    return pd.DataFrame(returns, index=dates, columns=assets)


@pytest.fixture
def sample_portfolio_weights():
    """Sample portfolio weights for testing."""
    return pd.Series({
        "GLOBAL": 0.40,
        "EM": 0.20,
        "GLOBAL AGGREGATE": 0.30,
        "HIGH YIELD": 0.10
    })


@pytest.fixture
def sample_benchmark_weights():
    """Sample benchmark weights for testing."""
    return pd.Series({
        "GLOBAL": 0.60,
        "GLOBAL AGGREGATE": 0.40
    })


@pytest.fixture
def sample_factor_returns():
    """Sample factor returns for testing."""
    np.random.seed(123)

    factors = ['US_Equity', 'Intl_Equity', 'EM_Equity', 'US_Rates', 'Credit_Spread']
    n_periods = 60

    dates = pd.date_range(end=pd.Timestamp.now(), periods=n_periods, freq='M')
    returns = np.random.randn(n_periods, len(factors)) * 0.03

    return pd.DataFrame(returns, index=dates, columns=factors)


@pytest.fixture
def sample_betas(sample_returns, sample_factor_returns):
    """Sample beta matrix for testing."""
    np.random.seed(456)

    securities = sample_returns.columns
    factors = sample_factor_returns.columns

    betas = np.random.randn(len(securities), len(factors)) * 0.5

    return pd.DataFrame(betas, index=securities, columns=factors)


@pytest.fixture
def sample_factor_cov(sample_factor_returns):
    """Sample factor covariance matrix."""
    return sample_factor_returns.cov()


@pytest.fixture
def sample_residual_var(sample_returns):
    """Sample residual variance."""
    np.random.seed(789)
    return pd.Series(
        np.random.uniform(0.0001, 0.001, len(sample_returns.columns)),
        index=sample_returns.columns
    )


@pytest.fixture
def temp_data_dir(tmp_path):
    """Temporary data directory for file I/O tests."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    return data_dir


@pytest.fixture
def mock_cma_file(temp_data_dir, sample_cma_data):
    """Create temporary CMA CSV file."""
    file_path = temp_data_dir / "cma_data.csv"
    sample_cma_data.to_csv(file_path, index=False)
    return file_path


@pytest.fixture
def mock_correlation_file(temp_data_dir, sample_correlation_matrix):
    """Create temporary correlation CSV file."""
    file_path = temp_data_dir / "correlation_matrix.csv"
    sample_correlation_matrix.to_csv(file_path)
    return file_path


@pytest.fixture
def mock_returns_file(temp_data_dir, sample_returns):
    """Create temporary returns CSV file."""
    file_path = temp_data_dir / "return_series.csv"
    sample_returns.to_csv(file_path)
    return file_path
