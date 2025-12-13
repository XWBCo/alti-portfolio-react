#!/usr/bin/env python3
"""
Quick verification script to confirm all data loads correctly.
Run this before starting the API to ensure data integrity.
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def verify_data():
    """Verify all data files load correctly."""

    print("=" * 80)
    print("DATA VERIFICATION")
    print("=" * 80)

    try:
        from data_loader import (
            load_cma_data,
            load_correlation_matrix,
            load_return_series,
            load_beta_matrix,
            load_factor_covariance,
        )

        # Load CMA
        print("\n1. Loading CMA data...")
        cma = load_cma_data()
        assert cma.shape[0] > 0, "CMA data is empty"
        assert 'RETURN' in cma.columns, "Missing RETURN column"
        assert 'RISK' in cma.columns, "Missing RISK column"
        print(f"   ✓ {cma.shape[0]} assets loaded")

        # Load correlation
        print("\n2. Loading correlation matrix...")
        corr = load_correlation_matrix()
        assert corr.shape[0] == corr.shape[1], "Correlation matrix not square"
        assert (corr.values >= -1.001).all() and (corr.values <= 1.001).all(), "Invalid correlation values"
        print(f"   ✓ {corr.shape[0]}x{corr.shape[1]} matrix loaded")

        # Load returns
        print("\n3. Loading return series...")
        for currency in ["USD", "EUR", "GBP"]:
            returns = load_return_series(currency)
            assert returns.shape[0] > 0, f"No {currency} returns"
            assert returns.shape[1] > 0, f"No {currency} assets"
            print(f"   ✓ {currency}: {returns.shape[0]} periods, {returns.shape[1]} assets")
            print(f"     Date range: {returns.index[0].date()} to {returns.index[-1].date()}")

        # Load betas
        print("\n4. Loading beta matrix...")
        betas = load_beta_matrix()
        assert betas.shape[0] > 0, "No securities in beta matrix"
        assert betas.shape[1] > 0, "No factors in beta matrix"
        print(f"   ✓ {betas.shape[0]} securities, {betas.shape[1]} factors")

        # Load factor covariance
        print("\n5. Loading factor covariance...")
        fcov = load_factor_covariance()
        assert fcov.shape[0] == fcov.shape[1], "Factor covariance not square"
        print(f"   ✓ {fcov.shape[0]}x{fcov.shape[1]} matrix loaded")

        print("\n" + "=" * 80)
        print("✅ ALL DATA VERIFIED SUCCESSFULLY")
        print("=" * 80)
        print("\nReady to start API server:")
        print("  python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload\n")

        return True

    except Exception as e:
        print("\n" + "=" * 80)
        print("❌ DATA VERIFICATION FAILED")
        print("=" * 80)
        print(f"\nError: {e}")
        print("\nPlease check:")
        print("  1. Data files exist in ../data/ directory")
        print("  2. Files have correct format and columns")
        print("  3. No file corruption or encoding issues\n")

        import traceback
        traceback.print_exc()

        return False


if __name__ == "__main__":
    import numpy as np
    import pandas as pd

    success = verify_data()
    sys.exit(0 if success else 1)
