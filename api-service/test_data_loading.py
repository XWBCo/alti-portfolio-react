"""
Test script to verify data loading from real files.
Run this to ensure all data files load correctly before integrating with API.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from data_loader import (
    load_cma_data,
    load_correlation_matrix,
    load_return_series,
    load_beta_matrix,
    load_factor_covariance,
    DATA_DIR
)

def test_data_loading():
    """Test all data loading functions."""

    print("=" * 80)
    print("DATA LOADING TEST")
    print("=" * 80)

    print(f"\nData directory: {DATA_DIR}")
    print(f"Exists: {DATA_DIR.exists()}")

    # Test CMA data
    print("\n" + "-" * 80)
    print("1. CMA DATA")
    print("-" * 80)
    try:
        cma = load_cma_data()
        print(f"✓ Loaded CMA data: {cma.shape[0]} rows, {cma.shape[1]} columns")
        print(f"  Columns: {list(cma.columns)}")
        print(f"\n  First 3 rows:")
        print(cma.head(3).to_string())

        # Check for required columns
        required = ['ASSET CLASS', 'RETURN', 'RISK']
        missing = [col for col in required if col not in cma.columns]
        if missing:
            print(f"  ⚠ Missing columns: {missing}")
        else:
            print(f"  ✓ All required columns present")

    except Exception as e:
        print(f"✗ Error loading CMA data: {e}")

    # Test correlation matrix
    print("\n" + "-" * 80)
    print("2. CORRELATION MATRIX")
    print("-" * 80)
    try:
        corr = load_correlation_matrix()
        print(f"✓ Loaded correlation matrix: {corr.shape[0]}x{corr.shape[1]}")
        print(f"  Assets: {list(corr.index)[:5]}... (showing first 5)")

        # Check if symmetric
        is_symmetric = (corr.values == corr.T.values).all()
        print(f"  Symmetric: {'✓' if is_symmetric else '✗'}")

        # Check diagonal is 1
        diag_is_one = (np.diag(corr.values) == 1.0).all()
        print(f"  Diagonal = 1.0: {'✓' if diag_is_one else '✗'}")

        # Check range [-1, 1]
        min_val, max_val = corr.values.min(), corr.values.max()
        print(f"  Range: [{min_val:.3f}, {max_val:.3f}]")

    except Exception as e:
        print(f"✗ Error loading correlation matrix: {e}")

    # Test return series
    print("\n" + "-" * 80)
    print("3. RETURN SERIES")
    print("-" * 80)

    for currency in ["USD", "EUR", "GBP"]:
        try:
            returns = load_return_series(currency=currency)
            print(f"✓ {currency}: {returns.shape[0]} periods, {returns.shape[1]} assets")
            print(f"  Date range: {returns.index[0]} to {returns.index[-1]}")
            print(f"  Assets: {list(returns.columns)[:5]}... (showing first 5)")
        except Exception as e:
            print(f"✗ Error loading {currency} returns: {e}")

    # Test beta matrix
    print("\n" + "-" * 80)
    print("4. BETA MATRIX")
    print("-" * 80)
    try:
        betas = load_beta_matrix()
        print(f"✓ Loaded beta matrix: {betas.shape[0]} securities, {betas.shape[1]} factors")
        print(f"  Factors: {list(betas.columns)}")
        print(f"  Securities (first 5): {list(betas.index)[:5]}...")
        print(f"\n  Sample betas (first security):")
        print(betas.iloc[0].to_string())
    except Exception as e:
        print(f"✗ Error loading beta matrix: {e}")

    # Test factor covariance
    print("\n" + "-" * 80)
    print("5. FACTOR COVARIANCE")
    print("-" * 80)
    try:
        factor_cov = load_factor_covariance()
        print(f"✓ Loaded factor covariance: {factor_cov.shape[0]}x{factor_cov.shape[1]}")
        print(f"  Factors: {list(factor_cov.index)}")

        # Check if symmetric
        is_symmetric = np.allclose(factor_cov.values, factor_cov.T.values)
        print(f"  Symmetric: {'✓' if is_symmetric else '✗'}")

        # Check positive semi-definite (all eigenvalues >= 0)
        eigenvalues = np.linalg.eigvals(factor_cov.values)
        is_psd = (eigenvalues >= -1e-10).all()
        print(f"  Positive semi-definite: {'✓' if is_psd else '✗'}")
        print(f"  Min eigenvalue: {eigenvalues.min():.6f}")

    except Exception as e:
        print(f"✗ Error loading factor covariance: {e}")

    # Test available covariance matrix files
    print("\n" + "-" * 80)
    print("6. AVAILABLE COVARIANCE FILES")
    print("-" * 80)
    cov_dir = DATA_DIR / "Covariance_Matrix"
    if cov_dir.exists():
        beta_files = sorted(cov_dir.glob("betas_*.csv"))
        cov_files = sorted(cov_dir.glob("factor_cov_*.csv"))

        print(f"Beta files: {len(beta_files)}")
        for f in beta_files[-3:]:  # Show last 3
            print(f"  - {f.name}")

        print(f"\nFactor covariance files: {len(cov_files)}")
        for f in cov_files[-3:]:  # Show last 3
            print(f"  - {f.name}")
    else:
        print(f"✗ Covariance directory not found: {cov_dir}")

    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    import numpy as np
    test_data_loading()
