"""
Tests for optimization_engine.py
"""

import pytest
import pandas as pd
import numpy as np

from optimization_engine import (
    CORE_ASSETS,
    PRIVATE_ASSETS,
    SPECIAL_ASSETS,
    build_universe,
    caps_from_template,
    special_caps,
    bucket_indices,
    build_bucket_env,
    ensure_psd,
    mean_cov_from_assets,
    qp_solver,
    compute_efficient_frontier,
    calculate_blended_benchmark,
    detect_inefficiencies,
    find_optimal_portfolio,
)


class TestAssetClassConstants:
    """Test asset class constant definitions."""

    def test_core_assets_defined(self):
        """Test core assets set is defined."""
        assert len(CORE_ASSETS) > 0
        assert "GLOBAL" in CORE_ASSETS
        assert "GLOBAL CASH" in CORE_ASSETS

    def test_private_assets_defined(self):
        """Test private assets set is defined."""
        assert len(PRIVATE_ASSETS) > 0
        assert "PRIVATE EQUITY" in PRIVATE_ASSETS

    def test_special_assets_defined(self):
        """Test special assets set is defined."""
        assert len(SPECIAL_ASSETS) > 0
        assert "VENTURE" in SPECIAL_ASSETS


class TestBuildUniverse:
    """Test universe selection."""

    def test_build_universe_core(self, sample_cma_data):
        """Test core universe selection."""
        result = build_universe("core", sample_cma_data)

        assert isinstance(result, pd.DataFrame)
        assert len(result) > 0

        # Should only contain core assets
        for asset in result["ASSET CLASS"].str.upper():
            assert asset in CORE_ASSETS

    def test_build_universe_core_private(self, sample_cma_data):
        """Test core + private universe selection."""
        result = build_universe("core_private", sample_cma_data)

        assert isinstance(result, pd.DataFrame)
        assert len(result) > 0

        # Should contain core or private assets
        valid_assets = CORE_ASSETS | PRIVATE_ASSETS
        for asset in result["ASSET CLASS"].str.upper():
            assert asset in valid_assets

    def test_build_universe_unconstrained(self, sample_cma_data):
        """Test unconstrained universe (all assets)."""
        result = build_universe("unconstrained", sample_cma_data)

        assert isinstance(result, pd.DataFrame)
        # Should include all valid assets
        assert len(result) == len(sample_cma_data)

    def test_build_universe_filters_invalid_risk(self):
        """Test universe filters out assets with zero or negative risk."""
        data = pd.DataFrame({
            "ASSET CLASS": ["GLOBAL", "CASH", "INVALID"],
            "RETURN": [0.08, 0.02, 0.05],
            "RISK": [0.16, 0.01, 0.0],  # INVALID has zero risk
            "CAP_MAX": [1.0, 1.0, 1.0]
        })

        result = build_universe("unconstrained", data)

        assert "INVALID" not in result["ASSET CLASS"].values

    def test_build_universe_missing_column_raises(self):
        """Test error when ASSET CLASS column missing."""
        data = pd.DataFrame({
            "NAME": ["GLOBAL"],
            "RETURN": [0.08],
            "RISK": [0.16]
        })

        with pytest.raises(ValueError, match="ASSET CLASS"):
            build_universe("core", data)


class TestConstraintBuilding:
    """Test constraint building functions."""

    def test_caps_from_template_std(self, sample_cma_data):
        """Test standard caps template."""
        bounds = caps_from_template(sample_cma_data, "std")

        assert len(bounds) == len(sample_cma_data)
        for lo, hi in bounds:
            assert lo == 0.0
            assert 0.0 <= hi <= 1.0

    def test_caps_from_template_tight(self, sample_cma_data):
        """Test tight caps template (max 25%)."""
        bounds = caps_from_template(sample_cma_data, "tight")

        assert len(bounds) == len(sample_cma_data)
        for lo, hi in bounds:
            assert lo == 0.0
            assert hi <= 0.25

    def test_caps_from_template_loose(self, sample_cma_data):
        """Test loose caps template."""
        bounds = caps_from_template(sample_cma_data, "loose")

        assert len(bounds) == len(sample_cma_data)
        for lo, hi in bounds:
            assert lo == 0.0
            assert hi <= 1.0

    def test_special_caps(self, sample_cma_data):
        """Test special asset caps."""
        # Add VENTURE (special asset) to test data
        data = sample_cma_data.copy()
        data.loc[len(data)] = ["VENTURE", 0.15, 0.35, 1.0, "GROWTH"]

        bounds = special_caps(data)

        # VENTURE should have tight cap
        venture_idx = data[data["ASSET CLASS"] == "VENTURE"].index[0]
        assert bounds[venture_idx] == (0.0, 0.25)

    def test_bucket_indices(self, sample_cma_data):
        """Test bucket index extraction."""
        stab_idx, div_idx, grow_idx = bucket_indices(sample_cma_data)

        assert isinstance(stab_idx, np.ndarray)
        assert isinstance(div_idx, np.ndarray)
        assert isinstance(grow_idx, np.ndarray)

        # Total should equal number of assets
        assert len(stab_idx) + len(div_idx) + len(grow_idx) == len(sample_cma_data)

    def test_bucket_indices_no_allocation_column(self):
        """Test bucket indices when RISK ALLOCATION missing."""
        data = pd.DataFrame({
            "ASSET CLASS": ["GLOBAL", "EM"],
            "RETURN": [0.08, 0.10],
            "RISK": [0.16, 0.22]
        })

        stab_idx, div_idx, grow_idx = bucket_indices(data)

        # All should be in stability when column missing
        assert len(stab_idx) == len(data)
        assert len(div_idx) == 0
        assert len(grow_idx) == 0

    def test_build_bucket_env(self, sample_cma_data):
        """Test bucket environment construction."""
        env = build_bucket_env(sample_cma_data)

        assert isinstance(env, list)
        assert len(env) > 0

        for indices, lo, hi in env:
            assert isinstance(indices, np.ndarray)
            assert 0.0 <= lo <= 1.0
            assert 0.0 <= hi <= 1.0
            assert lo <= hi


class TestMeanCovarianceParameters:
    """Test mean-variance parameter computation."""

    def test_ensure_psd(self):
        """Test PSD repair via eigenvalue clipping."""
        # Create a non-PSD matrix
        matrix = np.array([
            [1.0, 0.9, 0.9],
            [0.9, 1.0, 0.9],
            [0.9, 0.9, 1.0]
        ])

        # Make it slightly non-PSD
        matrix[2, 2] = 0.5

        result = ensure_psd(matrix)

        # Check eigenvalues are non-negative
        eigenvalues = np.linalg.eigvalsh(result)
        assert (eigenvalues >= 0).all()

    def test_mean_cov_from_assets(self, sample_cma_data, sample_correlation_matrix):
        """Test mean vector and covariance matrix construction."""
        assets = sample_cma_data.iloc[:5]  # Use first 5 assets
        mu, Sigma, asset_names = mean_cov_from_assets(assets, sample_correlation_matrix)

        assert len(mu) == len(assets)
        assert Sigma.shape == (len(assets), len(assets))
        assert len(asset_names) == len(assets)

        # Covariance should be symmetric
        assert np.allclose(Sigma, Sigma.T)

        # Covariance should be PSD
        eigenvalues = np.linalg.eigvalsh(Sigma)
        assert (eigenvalues >= -1e-10).all()

    def test_mean_cov_handles_missing_correlation(self, sample_cma_data):
        """Test mean_cov with incomplete correlation matrix."""
        # Create correlation matrix with only 3 assets
        corr = pd.DataFrame(
            np.eye(3),
            index=["GLOBAL", "EM", "GLOBAL CASH"],
            columns=["GLOBAL", "EM", "GLOBAL CASH"]
        )

        mu, Sigma, asset_names = mean_cov_from_assets(sample_cma_data, corr)

        # Should still work, filling missing with 0
        assert len(mu) == len(sample_cma_data)
        assert Sigma.shape[0] == len(sample_cma_data)


class TestQPSolver:
    """Test quadratic programming solver."""

    def test_qp_solver_creates_solver(self):
        """Test QP solver creation."""
        mu = np.array([0.08, 0.10, 0.05])
        Sigma = np.array([
            [0.16**2, 0.02, 0.01],
            [0.02, 0.22**2, 0.015],
            [0.01, 0.015, 0.06**2]
        ])
        bounds = [(0.0, 1.0) for _ in range(3)]

        solver = qp_solver(mu, Sigma, bounds)

        assert callable(solver)

    def test_qp_solver_solves_simple_problem(self):
        """Test QP solver on simple portfolio problem."""
        mu = np.array([0.08, 0.10, 0.05])
        Sigma = np.array([
            [0.16**2, 0.02, 0.01],
            [0.02, 0.22**2, 0.015],
            [0.01, 0.015, 0.06**2]
        ])
        bounds = [(0.0, 1.0) for _ in range(3)]

        solver = qp_solver(mu, Sigma, bounds)
        result = solver(10.0)

        assert result.success or result.x is not None
        if result.success:
            weights = result.x
            assert np.isclose(weights.sum(), 1.0, atol=1e-4)
            assert (weights >= -1e-6).all()  # Allow small numerical errors

    def test_qp_solver_with_bucket_constraints(self):
        """Test QP solver with bucket constraints."""
        mu = np.array([0.08, 0.10, 0.05, 0.06])
        Sigma = np.eye(4) * 0.04

        bounds = [(0.0, 1.0) for _ in range(4)]

        # Bucket constraints: first 2 assets >= 40%
        bucket_env = [(np.array([0, 1]), 0.4, 1.0)]

        solver = qp_solver(mu, Sigma, bounds, bucket_env=bucket_env)
        result = solver(10.0)

        if result.success:
            weights = result.x
            # Check bucket constraint satisfied
            assert weights[0] + weights[1] >= 0.39  # Allow small tolerance


class TestEfficientFrontier:
    """Test efficient frontier computation."""

    def test_compute_efficient_frontier_basic(self, sample_cma_data, sample_correlation_matrix):
        """Test basic efficient frontier computation."""
        result = compute_efficient_frontier(
            cma_data=sample_cma_data,
            correlation_matrix=sample_correlation_matrix,
            mode="unconstrained",
            n_points=10
        )

        assert "risks" in result
        assert "returns" in result
        assert "weights" in result
        assert "assets" in result

        assert len(result["risks"]) > 0
        assert len(result["returns"]) == len(result["risks"])
        assert len(result["weights"]) == len(result["risks"])

    def test_compute_efficient_frontier_core_mode(self, sample_cma_data, sample_correlation_matrix):
        """Test frontier with core mode."""
        result = compute_efficient_frontier(
            cma_data=sample_cma_data,
            correlation_matrix=sample_correlation_matrix,
            mode="core",
            n_points=10
        )

        assert len(result["assets"]) > 0
        # All assets should be core assets
        for asset in result["assets"]:
            assert asset in CORE_ASSETS

    def test_compute_efficient_frontier_custom_assets(self, sample_cma_data, sample_correlation_matrix):
        """Test frontier with custom asset list."""
        custom = ["GLOBAL", "GLOBAL AGGREGATE"]

        result = compute_efficient_frontier(
            cma_data=sample_cma_data,
            correlation_matrix=sample_correlation_matrix,
            custom_assets=custom,
            n_points=10
        )

        assert set(result["assets"]) == set([a.upper() for a in custom])

    def test_compute_efficient_frontier_insufficient_assets(self, sample_cma_data, sample_correlation_matrix):
        """Test frontier with single asset returns error."""
        # Create CMA data with only one valid asset
        single_asset_cma = pd.DataFrame({
            "ASSET CLASS": ["GLOBAL"],
            "RETURN": [0.08],
            "RISK": [0.16],
            "CAP_MAX": [1.0],
            "RISK ALLOCATION": ["GROWTH"]
        })

        result = compute_efficient_frontier(
            cma_data=single_asset_cma,
            correlation_matrix=sample_correlation_matrix,
            mode="unconstrained",
            n_points=10
        )

        assert "error" in result
        assert len(result["risks"]) == 0

    def test_compute_efficient_frontier_tight_caps(self, sample_cma_data, sample_correlation_matrix):
        """Test frontier with tight position caps."""
        result = compute_efficient_frontier(
            cma_data=sample_cma_data,
            correlation_matrix=sample_correlation_matrix,
            caps_template="tight",
            n_points=10
        )

        # Check that weights respect tight caps
        for weights_dict in result["weights"]:
            for asset, weight in weights_dict.items():
                assert weight <= 0.26  # 25% + small tolerance


class TestBlendedBenchmark:
    """Test blended benchmark calculation."""

    def test_calculate_blended_benchmark_basic(self, sample_cma_data, sample_correlation_matrix):
        """Test basic blended benchmark calculation."""
        result = calculate_blended_benchmark(
            cma_data=sample_cma_data,
            correlation_matrix=sample_correlation_matrix,
            equity_type="GLOBAL",
            fixed_income_type="GLOBAL AGGREGATE",
            equity_allocation=0.60,
            fixed_income_allocation=0.40
        )

        assert "blended_return" in result
        assert "blended_risk" in result
        assert "equity" in result
        assert "fixed_income" in result
        assert "correlation" in result

        assert result["blended_return"] > 0
        assert result["blended_risk"] > 0

    def test_blended_benchmark_weighted_average_return(self, sample_cma_data, sample_correlation_matrix):
        """Test blended return is weighted average."""
        result = calculate_blended_benchmark(
            cma_data=sample_cma_data,
            correlation_matrix=sample_correlation_matrix,
            equity_type="GLOBAL",
            fixed_income_type="GLOBAL AGGREGATE",
            equity_allocation=0.60,
            fixed_income_allocation=0.40
        )

        expected_return = (
            0.60 * result["equity"]["return"] +
            0.40 * result["fixed_income"]["return"]
        )

        assert np.isclose(result["blended_return"], expected_return)

    def test_blended_benchmark_missing_assets(self, sample_cma_data, sample_correlation_matrix):
        """Test blended benchmark with missing asset types."""
        result = calculate_blended_benchmark(
            cma_data=sample_cma_data,
            correlation_matrix=sample_correlation_matrix,
            equity_type="NONEXISTENT_EQUITY",
            fixed_income_type="GLOBAL AGGREGATE",
            equity_allocation=0.60,
            fixed_income_allocation=0.40
        )

        # Should use fallback values
        assert "blended_return" in result
        assert result["blended_return"] > 0

    def test_blended_benchmark_100_equity(self, sample_cma_data, sample_correlation_matrix):
        """Test 100% equity benchmark."""
        result = calculate_blended_benchmark(
            cma_data=sample_cma_data,
            correlation_matrix=sample_correlation_matrix,
            equity_type="GLOBAL",
            fixed_income_type="GLOBAL AGGREGATE",
            equity_allocation=1.0,
            fixed_income_allocation=0.0
        )

        # Risk should equal equity risk
        assert np.isclose(result["blended_risk"], result["equity"]["risk"], atol=1e-6)


class TestInefficiencyDetection:
    """Test portfolio inefficiency detection."""

    def test_detect_inefficiencies_basic(self):
        """Test basic inefficiency detection."""
        holdings = pd.DataFrame({
            "ASSET CLASS": ["GLOBAL", "EM", "GLOBAL AGGREGATE"],
            "current": [0.50, 0.20, 0.30],
            "proposed": [0.60, 0.15, 0.25]
        })

        benchmark = {"GLOBAL": 0.60, "EM": 0.10, "GLOBAL AGGREGATE": 0.30}

        result = detect_inefficiencies(
            holdings=holdings,
            current_column="current",
            proposed_column="proposed",
            benchmark_allocations=benchmark,
            threshold=0.03
        )

        assert isinstance(result, list)
        # Should flag GLOBAL (10% change) and EM (5% change)
        assert len(result) >= 1

    def test_detect_inefficiencies_no_flags(self):
        """Test no inefficiencies flagged when changes small."""
        holdings = pd.DataFrame({
            "ASSET CLASS": ["GLOBAL", "EM"],
            "current": [0.60, 0.40],
            "proposed": [0.61, 0.39]  # 1% change
        })

        benchmark = {"GLOBAL": 0.60, "EM": 0.40}

        result = detect_inefficiencies(
            holdings=holdings,
            current_column="current",
            proposed_column="proposed",
            benchmark_allocations=benchmark,
            threshold=0.05  # 5% threshold
        )

        assert len(result) == 0

    def test_detect_inefficiencies_missing_columns(self):
        """Test with missing columns returns empty list."""
        holdings = pd.DataFrame({
            "ASSET CLASS": ["GLOBAL"],
            "current": [1.0]
        })

        result = detect_inefficiencies(
            holdings=holdings,
            current_column="current",
            proposed_column="missing",
            benchmark_allocations={},
            threshold=0.03
        )

        assert result == []


class TestOptimalPortfolio:
    """Test optimal portfolio selection."""

    def test_find_optimal_portfolio_max_sharpe(self):
        """Test max Sharpe ratio selection."""
        risks = [0.05, 0.10, 0.15, 0.20]
        returns = [0.03, 0.06, 0.09, 0.11]
        weights = [
            {"CASH": 0.8, "EQUITY": 0.2},
            {"CASH": 0.5, "EQUITY": 0.5},
            {"CASH": 0.3, "EQUITY": 0.7},
            {"CASH": 0.1, "EQUITY": 0.9}
        ]

        result = find_optimal_portfolio(
            frontier_risks=risks,
            frontier_returns=returns,
            frontier_weights=weights,
            risk_free_rate=0.02
        )

        assert "index" in result
        assert "return" in result
        assert "risk" in result
        assert "sharpe_ratio" in result
        assert "weights" in result

        # Sharpe should be calculated correctly
        expected_sharpe = (result["return"] - 0.02) / result["risk"]
        assert np.isclose(result["sharpe_ratio"], expected_sharpe)

    def test_find_optimal_portfolio_target_return(self):
        """Test optimal portfolio with target return."""
        risks = [0.05, 0.10, 0.15, 0.20]
        returns = [0.03, 0.06, 0.09, 0.11]
        weights = [{"CASH": 1.0} for _ in range(4)]

        result = find_optimal_portfolio(
            frontier_risks=risks,
            frontier_returns=returns,
            frontier_weights=weights,
            target_return=0.07
        )

        # Should select portfolio with return >= 0.07
        assert result["return"] >= 0.065  # Allow small tolerance

    def test_find_optimal_portfolio_target_risk(self):
        """Test optimal portfolio with target risk."""
        risks = [0.05, 0.10, 0.15, 0.20]
        returns = [0.03, 0.06, 0.09, 0.11]
        weights = [{"CASH": 1.0} for _ in range(4)]

        result = find_optimal_portfolio(
            frontier_risks=risks,
            frontier_returns=returns,
            frontier_weights=weights,
            target_risk=0.12
        )

        # Should select portfolio with risk <= 0.12
        assert result["risk"] <= 0.13  # Allow small tolerance

    def test_find_optimal_portfolio_empty_frontier(self):
        """Test with empty frontier."""
        result = find_optimal_portfolio(
            frontier_risks=[],
            frontier_returns=[],
            frontier_weights=[]
        )

        assert "error" in result

    def test_find_optimal_portfolio_unachievable_target(self):
        """Test with unachievable target return."""
        risks = [0.05, 0.10, 0.15]
        returns = [0.03, 0.06, 0.09]
        weights = [{"CASH": 1.0} for _ in range(3)]

        result = find_optimal_portfolio(
            frontier_risks=risks,
            frontier_returns=returns,
            frontier_weights=weights,
            target_return=0.20  # Higher than max frontier return
        )

        # Should return best available (max return)
        assert result["return"] == max(returns)
