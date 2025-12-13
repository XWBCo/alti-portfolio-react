"""
Tests for data_loader.py
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path

from data_loader import (
    load_cma_data,
    load_correlation_matrix,
    load_return_series,
    load_beta_matrix,
    load_factor_covariance,
    load_all_data,
    _generate_mock_cma_data,
    _generate_mock_correlation_matrix,
    _generate_mock_returns,
    _generate_mock_betas,
    _generate_mock_factor_cov,
)


class TestLoadCMAData:
    """Test CMA data loading."""

    def test_load_cma_data_from_file(self, mock_cma_file):
        """Test loading CMA data from CSV file."""
        df = load_cma_data(str(mock_cma_file))

        assert isinstance(df, pd.DataFrame)
        assert "ASSET CLASS" in df.columns
        assert "RETURN" in df.columns
        assert "RISK" in df.columns
        assert len(df) > 0

    def test_load_cma_data_missing_file(self):
        """Test fallback to mock data when file missing."""
        df = load_cma_data("/nonexistent/path.csv")

        assert isinstance(df, pd.DataFrame)
        assert "ASSET CLASS" in df.columns
        assert len(df) > 0

    def test_load_cma_data_column_normalization(self, tmp_path):
        """Test column name normalization."""
        data = pd.DataFrame({
            "asset class": ["GLOBAL", "EM"],
            "return": [0.08, 0.10],
            "risk": [0.16, 0.22]
        })

        file_path = tmp_path / "test_cma.csv"
        data.to_csv(file_path, index=False)

        df = load_cma_data(str(file_path))

        assert "ASSET CLASS" in df.columns
        assert "RETURN" in df.columns
        assert "RISK" in df.columns

    def test_load_cma_data_alternative_column_names(self, tmp_path):
        """Test handling alternative column names."""
        data = pd.DataFrame({
            "Security": ["GLOBAL", "EM"],
            "Expected Return": [0.08, 0.10],
            "Volatility": [0.16, 0.22]
        })

        file_path = tmp_path / "test_cma_alt.csv"
        data.to_csv(file_path, index=False)

        df = load_cma_data(str(file_path))

        assert "ASSET CLASS" in df.columns
        assert "RETURN" in df.columns
        assert "RISK" in df.columns

    def test_mock_cma_data_structure(self):
        """Test mock CMA data has expected structure."""
        df = _generate_mock_cma_data()

        assert isinstance(df, pd.DataFrame)
        assert "ASSET CLASS" in df.columns
        assert "RETURN" in df.columns
        assert "RISK" in df.columns
        assert "CAP_MAX" in df.columns
        assert "RISK ALLOCATION" in df.columns
        assert len(df) >= 10


class TestLoadCorrelationMatrix:
    """Test correlation matrix loading."""

    def test_load_correlation_from_file(self, mock_correlation_file):
        """Test loading correlation matrix from CSV."""
        df = load_correlation_matrix(str(mock_correlation_file))

        assert isinstance(df, pd.DataFrame)
        assert df.shape[0] == df.shape[1]  # Square matrix
        assert np.allclose(df.values, df.values.T)  # Symmetric
        assert np.allclose(np.diag(df.values), 1.0)  # Diagonal = 1

    def test_load_correlation_missing_file(self):
        """Test fallback to mock correlation when file missing."""
        df = load_correlation_matrix("/nonexistent/corr.csv")

        assert isinstance(df, pd.DataFrame)
        assert df.shape[0] == df.shape[1]

    def test_correlation_matrix_valid(self, mock_correlation_file):
        """Test correlation matrix has valid values."""
        df = load_correlation_matrix(str(mock_correlation_file))

        # All values should be between -1 and 1
        assert (df.values >= -1.0).all()
        assert (df.values <= 1.0).all()

    def test_mock_correlation_valid(self):
        """Test mock correlation matrix is valid."""
        df = _generate_mock_correlation_matrix()

        assert isinstance(df, pd.DataFrame)
        assert df.shape[0] == df.shape[1]
        assert np.allclose(df.values, df.values.T)
        assert np.allclose(np.diag(df.values), 1.0)
        assert (df.values >= -1.0).all()
        assert (df.values <= 1.0).all()


class TestLoadReturnSeries:
    """Test return series loading."""

    def test_load_returns_from_file(self, mock_returns_file):
        """Test loading return series from CSV."""
        df = load_return_series(file_path=str(mock_returns_file))

        assert isinstance(df, pd.DataFrame)
        assert isinstance(df.index, pd.DatetimeIndex)
        assert len(df) > 0
        assert len(df.columns) > 0

    def test_load_returns_missing_file(self):
        """Test fallback to mock returns when file missing."""
        df = load_return_series(file_path="/nonexistent/returns.csv")

        assert isinstance(df, pd.DataFrame)
        assert len(df) > 0

    def test_load_returns_currency_suffix(self):
        """Test currency suffix handling."""
        df_usd = load_return_series(currency="USD")
        df_eur = load_return_series(currency="EUR")

        # Both should return DataFrames (fallback to mock)
        assert isinstance(df_usd, pd.DataFrame)
        assert isinstance(df_eur, pd.DataFrame)

    def test_mock_returns_structure(self):
        """Test mock returns have expected structure."""
        df = _generate_mock_returns(n_periods=60)

        assert isinstance(df, pd.DataFrame)
        assert len(df) == 60
        assert isinstance(df.index, pd.DatetimeIndex)
        assert len(df.columns) > 5


class TestLoadBetaMatrix:
    """Test beta matrix loading."""

    def test_load_beta_missing_file(self):
        """Test fallback to mock betas when file missing."""
        df = load_beta_matrix()

        assert isinstance(df, pd.DataFrame)
        assert len(df) > 0

    def test_load_beta_with_date(self):
        """Test loading betas with specific date."""
        df = load_beta_matrix(date="2024-01-01")

        assert isinstance(df, pd.DataFrame)

    def test_mock_betas_structure(self):
        """Test mock beta matrix structure."""
        df = _generate_mock_betas()

        assert isinstance(df, pd.DataFrame)
        assert len(df.index) > 0  # Securities
        assert len(df.columns) > 0  # Factors


class TestLoadFactorCovariance:
    """Test factor covariance loading."""

    def test_load_factor_cov_missing_file(self):
        """Test fallback to mock factor cov when file missing."""
        df = load_factor_covariance()

        assert isinstance(df, pd.DataFrame)
        assert df.shape[0] == df.shape[1]

    def test_load_factor_cov_with_date(self):
        """Test loading factor cov with specific date."""
        df = load_factor_covariance(date="2024-01-01")

        assert isinstance(df, pd.DataFrame)

    def test_mock_factor_cov_structure(self):
        """Test mock factor covariance structure."""
        df = _generate_mock_factor_cov()

        assert isinstance(df, pd.DataFrame)
        assert df.shape[0] == df.shape[1]  # Square matrix
        assert np.allclose(df.values, df.values.T)  # Symmetric


class TestLoadAllData:
    """Test loading all data at once."""

    def test_load_all_data(self):
        """Test loading all data files."""
        cma, corr, returns, betas, factor_cov = load_all_data()

        assert isinstance(cma, pd.DataFrame)
        assert isinstance(corr, pd.DataFrame)
        assert isinstance(returns, pd.DataFrame)
        assert isinstance(betas, pd.DataFrame)
        assert isinstance(factor_cov, pd.DataFrame)

        # CMA validation
        assert "ASSET CLASS" in cma.columns

        # Correlation validation
        assert corr.shape[0] == corr.shape[1]

        # Returns validation
        assert isinstance(returns.index, pd.DatetimeIndex)

        # Factor cov validation
        assert factor_cov.shape[0] == factor_cov.shape[1]


class TestDataValidation:
    """Test data validation and edge cases."""

    def test_cma_data_no_negative_risk(self):
        """Test CMA data has no negative risk values."""
        df = _generate_mock_cma_data()

        assert (df["RISK"] > 0).all()

    def test_cma_data_realistic_returns(self):
        """Test CMA data has realistic return values."""
        df = _generate_mock_cma_data()

        # Annual returns should be between -50% and +50%
        assert (df["RETURN"] >= -0.5).all()
        assert (df["RETURN"] <= 0.5).all()

    def test_correlation_eigenvalues_positive(self):
        """Test correlation matrix is positive semi-definite."""
        df = _generate_mock_correlation_matrix()

        eigenvalues = np.linalg.eigvalsh(df.values)
        assert (eigenvalues >= -1e-10).all()  # Allow small numerical errors

    def test_returns_no_all_nan_columns(self):
        """Test returns have no all-NaN columns."""
        df = _generate_mock_returns(n_periods=60)

        for col in df.columns:
            assert not df[col].isna().all()

    def test_mock_data_reproducibility(self):
        """Test mock data generation is reproducible."""
        df1 = _generate_mock_cma_data()
        df2 = _generate_mock_cma_data()

        pd.testing.assert_frame_equal(df1, df2)

        corr1 = _generate_mock_correlation_matrix()
        corr2 = _generate_mock_correlation_matrix()

        pd.testing.assert_frame_equal(corr1, corr2)
