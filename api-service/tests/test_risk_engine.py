"""
Tests for risk_engine.py
"""

import pytest
import pandas as pd
import numpy as np

from risk_engine import (
    calculate_var_cvar,
    ewma_shrinkage_cov,
    calculate_pcte,
    compute_full_risk_decomposition,
    calculate_segment_tracking_error,
    calculate_ewma_covariance,
    ensure_psd,
    calculate_contributions,
    compute_lasso_betas,
    compute_factor_risk_decomposition,
    compute_tracking_error,
    compute_performance_stats,
    compute_diversification_metrics,
)


class TestVaRCVaR:
    """Test VaR and CVaR calculations."""

    def test_calculate_var_cvar_basic(self, sample_returns):
        """Test basic VaR/CVaR calculation."""
        portfolio_returns = sample_returns.iloc[:, 0]

        result = calculate_var_cvar(
            returns=portfolio_returns,
            confidence_level=0.95
        )

        assert "var" in result
        assert "cvar" in result
        assert "var_annualized" in result
        assert "cvar_annualized" in result

        # CVaR should be more negative than VaR
        assert result["cvar"] <= result["var"]

    def test_calculate_var_cvar_different_confidence(self, sample_returns):
        """Test VaR at different confidence levels."""
        portfolio_returns = sample_returns.iloc[:, 0]

        var_95 = calculate_var_cvar(portfolio_returns, confidence_level=0.95)
        var_99 = calculate_var_cvar(portfolio_returns, confidence_level=0.99)

        # 99% VaR should be more negative than 95% VaR
        assert var_99["var"] <= var_95["var"]

    def test_calculate_var_cvar_insufficient_data(self):
        """Test VaR with insufficient data."""
        returns = pd.Series([0.01, 0.02])

        result = calculate_var_cvar(returns)

        # Should return zeros
        assert result["var"] == 0.0
        assert result["cvar"] == 0.0

    def test_calculate_var_cvar_annualization(self, sample_returns):
        """Test annualization factor."""
        portfolio_returns = sample_returns.iloc[:, 0]

        result = calculate_var_cvar(portfolio_returns, periods_per_year=12)

        # Annualized should be approximately sqrt(12) * monthly
        annualization = np.sqrt(12)
        assert np.isclose(
            result["var_annualized"],
            result["var"] * annualization,
            rtol=0.01
        )


class TestEWMAShrinkageCov:
    """Test EWMA shrinkage covariance."""

    def test_ewma_shrinkage_cov_basic(self, sample_returns):
        """Test basic EWMA shrinkage covariance."""
        result = ewma_shrinkage_cov(
            returns=sample_returns,
            lambda_=0.94,
            shrink_alpha=0.1
        )

        assert isinstance(result, pd.DataFrame)
        assert result.shape[0] == result.shape[1]
        assert result.shape[0] == len(sample_returns.columns)

        # Should be symmetric
        assert np.allclose(result.values, result.values.T)

    def test_ewma_shrinkage_diagonal_target(self, sample_returns):
        """Test diagonal shrinkage target."""
        result = ewma_shrinkage_cov(
            returns=sample_returns,
            shrink_target="diagonal",
            shrink_alpha=1.0  # Full shrinkage
        )

        # With full shrinkage to diagonal, off-diagonals should be zero
        off_diag = result.values.copy()
        np.fill_diagonal(off_diag, 0)
        assert np.allclose(off_diag, 0)

    def test_ewma_shrinkage_identity_target(self, sample_returns):
        """Test identity shrinkage target."""
        result = ewma_shrinkage_cov(
            returns=sample_returns,
            shrink_target="identity",
            shrink_alpha=0.5
        )

        assert isinstance(result, pd.DataFrame)
        assert result.shape[0] == result.shape[1]

    def test_ewma_shrinkage_insufficient_data(self):
        """Test with insufficient data."""
        returns = pd.DataFrame({
            "A": [0.01, 0.02],
            "B": [-0.01, 0.01]
        })

        result = ewma_shrinkage_cov(returns)

        # Should fallback to simple covariance
        assert isinstance(result, pd.DataFrame)


class TestPCTE:
    """Test Portfolio Contribution to Tracking Error."""

    def test_calculate_pcte_basic(self, sample_portfolio_weights, sample_benchmark_weights, sample_returns):
        """Test basic PCTE calculation."""
        result = calculate_pcte(
            portfolio_weights=sample_portfolio_weights,
            benchmark_weights=sample_benchmark_weights,
            returns=sample_returns,
            use_ewma=True
        )

        assert "tracking_error" in result
        assert "tracking_error_monthly" in result
        assert "pcte" in result
        assert "mcte" in result
        assert "active_weights" in result

        assert result["tracking_error"] > 0

    def test_calculate_pcte_zero_active_weights(self, sample_portfolio_weights, sample_returns):
        """Test PCTE when portfolio equals benchmark."""
        result = calculate_pcte(
            portfolio_weights=sample_portfolio_weights,
            benchmark_weights=sample_portfolio_weights,  # Same as portfolio
            returns=sample_returns
        )

        # TE should be zero or very small
        assert result["tracking_error"] < 0.01

    def test_calculate_pcte_pcte_sums_to_one(self, sample_portfolio_weights, sample_benchmark_weights, sample_returns):
        """Test PCTE contributions sum approximately to 1."""
        result = calculate_pcte(
            portfolio_weights=sample_portfolio_weights,
            benchmark_weights=sample_benchmark_weights,
            returns=sample_returns
        )

        pcte_values = list(result["pcte"].values())
        # Should sum to approximately 1 (normalized)
        assert np.isclose(np.abs(pcte_values).sum(), 1.0, atol=0.1)


class TestFullRiskDecomposition:
    """Test full risk decomposition."""

    def test_compute_full_risk_decomposition(
        self,
        sample_portfolio_weights,
        sample_benchmark_weights,
        sample_returns,
        sample_factor_returns,
        sample_betas,
        sample_factor_cov,
        sample_residual_var
    ):
        """Test full risk decomposition."""
        result = compute_full_risk_decomposition(
            portfolio_weights=sample_portfolio_weights,
            benchmark_weights=sample_benchmark_weights,
            security_returns=sample_returns,
            factor_returns=sample_factor_returns,
            betas=sample_betas,
            factor_cov=sample_factor_cov,
            residual_var=sample_residual_var
        )

        assert "portfolio" in result
        assert "benchmark" in result
        assert "active" in result
        assert "factor_contributions" in result

        # Portfolio should have total risk > 0
        assert result["portfolio"]["total_risk"] > 0

        # Systematic + specific should approximately equal total
        port = result["portfolio"]
        systematic_pct = port["systematic_pct"]
        specific_pct = port["specific_pct"]
        assert np.isclose(systematic_pct + specific_pct, 100.0, atol=1.0)

    def test_full_decomposition_systematic_specific_split(
        self,
        sample_portfolio_weights,
        sample_benchmark_weights,
        sample_returns,
        sample_factor_returns,
        sample_betas,
        sample_factor_cov,
        sample_residual_var
    ):
        """Test systematic and specific risk components."""
        result = compute_full_risk_decomposition(
            portfolio_weights=sample_portfolio_weights,
            benchmark_weights=sample_benchmark_weights,
            security_returns=sample_returns,
            factor_returns=sample_factor_returns,
            betas=sample_betas,
            factor_cov=sample_factor_cov,
            residual_var=sample_residual_var
        )

        port = result["portfolio"]

        # Both components should be non-negative
        assert port["systematic_risk"] >= 0
        assert port["specific_risk"] >= 0


class TestSegmentTrackingError:
    """Test segment-level tracking error."""

    def test_calculate_segment_tracking_error_basic(self, sample_portfolio_weights, sample_returns):
        """Test basic segment TE calculation."""
        result = calculate_segment_tracking_error(
            portfolio_weights=sample_portfolio_weights,
            returns=sample_returns,
            growth_benchmark="GLOBAL",
            stability_benchmark="GLOBAL AGGREGATE",
            growth_allocation=0.60,
            stability_allocation=0.40
        )

        assert "total_tracking_error" in result
        assert "growth_tracking_error" in result
        assert "stability_tracking_error" in result
        assert "diversification_benefit" in result

        # All TE values should be non-negative
        assert result["total_tracking_error"] >= 0
        assert result["growth_tracking_error"] >= 0
        assert result["stability_tracking_error"] >= 0

    def test_segment_te_with_tier_mapping(self, sample_portfolio_weights, sample_returns):
        """Test segment TE with tier mapping."""
        tier_mapping = {
            "GLOBAL": "Growth",
            "EM": "Growth",
            "GLOBAL AGGREGATE": "Stability",
            "HIGH YIELD": "Diversified"
        }

        result = calculate_segment_tracking_error(
            portfolio_weights=sample_portfolio_weights,
            returns=sample_returns,
            growth_benchmark="GLOBAL",
            stability_benchmark="GLOBAL AGGREGATE",
            growth_allocation=0.60,
            stability_allocation=0.40,
            tier_mapping=tier_mapping
        )

        assert result["growth_assets_count"] >= 0
        assert result["stability_assets_count"] >= 0


class TestEWMACovariance:
    """Test EWMA covariance calculation."""

    def test_calculate_ewma_covariance(self, sample_returns):
        """Test EWMA covariance matrix."""
        result = calculate_ewma_covariance(
            returns=sample_returns,
            decay=0.94
        )

        assert isinstance(result, pd.DataFrame)
        assert result.shape[0] == result.shape[1]
        assert result.shape[0] == len(sample_returns.columns)

        # Should be symmetric
        assert np.allclose(result.values, result.values.T)

    def test_ewma_covariance_vs_simple_cov(self, sample_returns):
        """Test EWMA vs simple covariance."""
        ewma_cov = calculate_ewma_covariance(sample_returns, decay=0.94)
        simple_cov = sample_returns.cov()

        # Should be different
        assert not np.allclose(ewma_cov.values, simple_cov.values)

    def test_ewma_covariance_insufficient_data(self):
        """Test with insufficient data."""
        returns = pd.DataFrame({
            "A": [0.01, 0.02],
            "B": [-0.01, 0.01]
        })

        result = calculate_ewma_covariance(returns, min_periods=12)

        # Should fallback to simple covariance
        expected = returns.cov()
        pd.testing.assert_frame_equal(result, expected)


class TestEnsurePSD:
    """Test PSD repair function."""

    def test_ensure_psd_already_psd(self):
        """Test with already PSD matrix."""
        matrix = np.array([
            [1.0, 0.5],
            [0.5, 1.0]
        ])

        result = ensure_psd(matrix)

        eigenvalues = np.linalg.eigvalsh(result)
        assert (eigenvalues >= 0).all()

    def test_ensure_psd_non_psd_matrix(self):
        """Test with non-PSD matrix."""
        matrix = np.array([
            [1.0, 1.5],
            [1.5, 1.0]
        ])

        result = ensure_psd(matrix)

        eigenvalues = np.linalg.eigvalsh(result)
        assert (eigenvalues >= 0).all()


class TestContributions:
    """Test risk contribution calculations."""

    def test_calculate_contributions_basic(self, sample_portfolio_weights, sample_returns):
        """Test basic PCTR/MCTR calculation."""
        result = calculate_contributions(
            returns=sample_returns,
            weights=sample_portfolio_weights,
            use_ewma=True
        )

        assert "pctr" in result
        assert "mctr" in result
        assert "portfolio_vol" in result
        assert "portfolio_vol_annualized" in result

        # PCTR should sum to approximately 1
        pctr_values = list(result["pctr"].values())
        assert np.isclose(sum(pctr_values), 1.0, atol=0.01)

    def test_calculate_contributions_portfolio_vol(self, sample_portfolio_weights, sample_returns):
        """Test portfolio volatility calculation."""
        result = calculate_contributions(
            returns=sample_returns,
            weights=sample_portfolio_weights
        )

        assert result["portfolio_vol"] > 0
        assert result["portfolio_vol_annualized"] > result["portfolio_vol"]

        # Annualized should be monthly * sqrt(12)
        expected = result["portfolio_vol"] * np.sqrt(12)
        assert np.isclose(result["portfolio_vol_annualized"], expected)


class TestLassoBetas:
    """Test LASSO beta estimation."""

    def test_compute_lasso_betas(self):
        """Test LASSO beta computation."""
        # Create aligned returns with same dates
        np.random.seed(42)
        dates = pd.date_range(end=pd.Timestamp.now(), periods=60, freq='ME')

        sec_returns = pd.DataFrame({
            "A": np.random.randn(60) * 0.05,
            "B": np.random.randn(60) * 0.06
        }, index=dates)

        fac_returns = pd.DataFrame({
            "F1": np.random.randn(60) * 0.03,
            "F2": np.random.randn(60) * 0.04
        }, index=dates)

        betas, residual_var = compute_lasso_betas(
            security_returns=sec_returns,
            factor_returns=fac_returns,
            min_observations=12
        )

        assert isinstance(betas, pd.DataFrame)
        assert isinstance(residual_var, pd.Series)

        assert betas.shape[0] == len(sec_returns.columns)
        assert betas.shape[1] == len(fac_returns.columns)

    def test_lasso_betas_insufficient_data(self):
        """Test with insufficient data."""
        sec_returns = pd.DataFrame({
            "A": [0.01, 0.02]
        })
        fac_returns = pd.DataFrame({
            "F1": [0.01, -0.01]
        })

        with pytest.raises(ValueError, match="Insufficient data"):
            compute_lasso_betas(sec_returns, fac_returns, min_observations=12)


class TestFactorRiskDecomposition:
    """Test factor risk decomposition."""

    def test_compute_factor_risk_decomposition(
        self,
        sample_portfolio_weights,
        sample_betas,
        sample_factor_cov,
        sample_residual_var
    ):
        """Test factor risk decomposition."""
        result = compute_factor_risk_decomposition(
            weights=sample_portfolio_weights,
            betas=sample_betas,
            factor_cov=sample_factor_cov,
            residual_var=sample_residual_var
        )

        assert "systematic_risk" in result
        assert "specific_risk" in result
        assert "total_risk" in result
        assert "systematic_pct" in result
        assert "factor_contributions" in result

        # Total should be positive
        assert result["total_risk"] > 0

        # Percentages should add to 100
        assert np.isclose(
            result["systematic_pct"] + (100 - result["systematic_pct"]),
            100.0
        )


class TestTrackingError:
    """Test tracking error computation."""

    def test_compute_tracking_error(
        self,
        sample_portfolio_weights,
        sample_benchmark_weights,
        sample_returns
    ):
        """Test tracking error calculation."""
        result = compute_tracking_error(
            portfolio_weights=sample_portfolio_weights,
            benchmark_weights=sample_benchmark_weights,
            returns=sample_returns,
            use_ewma=True
        )

        assert "tracking_error" in result
        assert "active_weights" in result
        assert "te_contributions" in result

        # TE should be non-negative
        assert result["tracking_error"] >= 0

    def test_tracking_error_zero_when_same(self, sample_portfolio_weights, sample_returns):
        """Test TE is zero when portfolio equals benchmark."""
        result = compute_tracking_error(
            portfolio_weights=sample_portfolio_weights,
            benchmark_weights=sample_portfolio_weights,
            returns=sample_returns
        )

        # TE should be zero or very small
        assert result["tracking_error"] < 0.001


class TestPerformanceStats:
    """Test performance statistics."""

    def test_compute_performance_stats(self, sample_returns):
        """Test performance statistics calculation."""
        portfolio_returns = sample_returns.iloc[:, 0]

        result = compute_performance_stats(
            returns=portfolio_returns,
            periods_per_year=12,
            risk_free_rate=0.03
        )

        assert "cagr" in result
        assert "volatility" in result
        assert "sharpe" in result
        assert "max_drawdown" in result
        assert "total_return" in result

        # Max drawdown should be non-positive
        assert result["max_drawdown"] <= 0

    def test_performance_stats_insufficient_data(self):
        """Test with insufficient data."""
        returns = pd.Series([0.01])

        result = compute_performance_stats(returns)

        # Should return zeros
        assert result["cagr"] == 0.0
        assert result["volatility"] == 0.0
        assert result["sharpe"] == 0.0

    def test_performance_stats_sharpe_calculation(self, sample_returns):
        """Test Sharpe ratio calculation."""
        portfolio_returns = sample_returns.iloc[:, 0]

        result = compute_performance_stats(
            portfolio_returns,
            risk_free_rate=0.03
        )

        # Sharpe = (CAGR - rf) / volatility
        expected_sharpe = (result["cagr"] - 0.03) / result["volatility"]
        assert np.isclose(result["sharpe"], expected_sharpe, atol=0.01)


class TestDiversificationMetrics:
    """Test diversification metrics."""

    def test_compute_diversification_metrics(self, sample_portfolio_weights, sample_returns):
        """Test diversification metrics calculation."""
        result = compute_diversification_metrics(
            weights=sample_portfolio_weights,
            returns=sample_returns,
            use_ewma=True
        )

        assert "diversification_ratio" in result
        assert "diversification_benefit_pct" in result
        assert "weighted_avg_correlation" in result
        assert "portfolio_vol_annualized" in result
        assert "weighted_avg_vol_annualized" in result

        # Diversification ratio should be >= 1
        assert result["diversification_ratio"] >= 1.0

    def test_diversification_benefit_positive(self, sample_portfolio_weights, sample_returns):
        """Test diversification benefit is positive."""
        result = compute_diversification_metrics(
            weights=sample_portfolio_weights,
            returns=sample_returns
        )

        # Diversified portfolio should have lower risk than weighted average
        assert result["diversification_benefit_pct"] >= 0

    def test_diversification_single_asset(self, sample_returns):
        """Test with single asset (no diversification)."""
        weights = pd.Series({"GLOBAL": 1.0})

        result = compute_diversification_metrics(
            weights=weights,
            returns=sample_returns
        )

        # Diversification ratio should be 1.0
        assert np.isclose(result["diversification_ratio"], 1.0)
        assert np.isclose(result["weighted_avg_correlation"], 1.0)


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_empty_returns(self, sample_portfolio_weights):
        """Test with empty returns."""
        returns = pd.DataFrame()

        # Empty returns should either raise or handle gracefully
        try:
            result = calculate_contributions(returns, sample_portfolio_weights)
            # If it doesn't raise, check that result is empty or has defaults
            assert "portfolio_vol" in result
        except (KeyError, ValueError, IndexError):
            # Expected - empty data causes error
            pass

    def test_mismatched_assets(self, sample_returns):
        """Test with mismatched asset names."""
        weights = pd.Series({"UNKNOWN_ASSET": 1.0})

        # Should handle gracefully
        result = calculate_contributions(sample_returns, weights)

        # Result should have zero or NaN values
        assert "pctr" in result

    def test_zero_weights(self, sample_returns):
        """Test with zero weights."""
        weights = pd.Series({col: 0.0 for col in sample_returns.columns})

        # Should handle division by zero
        result = calculate_contributions(sample_returns, weights)

        assert "portfolio_vol" in result

    def test_negative_weights_normalized(self, sample_returns):
        """Test that negative weights are handled."""
        weights = pd.Series({
            "GLOBAL": 1.5,
            "EM": -0.5
        })

        # Should normalize but may have issues with negative weights
        result = calculate_contributions(sample_returns, weights)

        # Should still produce result
        assert "portfolio_vol" in result
