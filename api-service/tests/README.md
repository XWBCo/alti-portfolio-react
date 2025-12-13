# API Service Test Suite

Comprehensive pytest unit tests for the Python computational engines in the React app.

## Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures
├── test_data_loader.py      # Data loading tests
├── test_optimization_engine.py  # Portfolio optimization tests
├── test_risk_engine.py      # Risk calculation tests
└── test_api_endpoints.py    # FastAPI endpoint tests
```

## Test Coverage

### 1. data_loader.py
- Loading CMA data from CSV/Excel
- Loading correlation matrices
- Loading return series with currency support
- Loading beta matrices and factor covariance
- Fallback behavior when files missing
- Data validation (risk > 0, returns realistic)
- Mock data generators

### 2. optimization_engine.py
- Asset universe selection (core/core_private/unconstrained)
- Constraint building (caps templates, bucket constraints)
- Mean-variance parameter computation
- PSD matrix repair
- QP solver with SLSQP
- Efficient frontier calculation
- Blended benchmark computation
- Portfolio inefficiency detection
- Optimal portfolio selection (max Sharpe, target return/risk)

### 3. risk_engine.py
- VaR/CVaR calculation (historical)
- EWMA covariance with shrinkage
- PCTE (Portfolio Contribution to Tracking Error)
- Full risk decomposition (systematic/specific/active)
- Segment tracking error (Growth/Stability)
- PCTR/MCTR contributions
- LASSO beta estimation
- Factor risk decomposition
- Performance statistics (CAGR, Sharpe, max drawdown)
- Diversification metrics

### 4. main.py (FastAPI endpoints)
- Health and info endpoints
- Risk contribution endpoints
- Tracking error endpoints
- Factor decomposition endpoints
- Diversification endpoints
- Performance statistics endpoints
- Stress scenario testing
- Extended risk endpoints (VaR/CVaR, PCTE, full decomposition)
- Optimization endpoints (frontier, benchmark, inefficiencies)
- File upload endpoints
- Error handling and validation
- CORS configuration

## Running Tests

### Install dependencies
```bash
cd api-service
pip install -r requirements.txt
```

### Run all tests
```bash
pytest -v
```

### Run specific test file
```bash
pytest tests/test_data_loader.py -v
pytest tests/test_optimization_engine.py -v
pytest tests/test_risk_engine.py -v
pytest tests/test_api_endpoints.py -v
```

### Run specific test class
```bash
pytest tests/test_optimization_engine.py::TestEfficientFrontier -v
```

### Run specific test function
```bash
pytest tests/test_risk_engine.py::TestVaRCVaR::test_calculate_var_cvar_basic -v
```

### Run with coverage report
```bash
pytest --cov=. --cov-report=html
```

Then open `htmlcov/index.html` in browser.

### Run with coverage in terminal
```bash
pytest --cov=. --cov-report=term-missing
```

### Run only fast tests (skip slow integration tests)
```bash
pytest -v -m "not slow"
```

## Test Fixtures

Shared fixtures in `conftest.py`:
- `sample_cma_data` - Sample capital market assumptions
- `sample_correlation_matrix` - Valid correlation matrix
- `sample_returns` - Historical return series
- `sample_portfolio_weights` - Portfolio weights
- `sample_benchmark_weights` - Benchmark weights
- `sample_factor_returns` - Factor returns
- `sample_betas` - Security-factor betas
- `sample_factor_cov` - Factor covariance matrix
- `sample_residual_var` - Residual variance
- `temp_data_dir` - Temporary directory for file I/O tests
- `client` - FastAPI test client

## Expected Test Results

### Coverage Targets
- **data_loader.py**: 90%+ coverage
- **optimization_engine.py**: 85%+ coverage
- **risk_engine.py**: 85%+ coverage
- **main.py**: 80%+ coverage (excluding mock data generators)

### Test Count
- **data_loader**: ~30 tests
- **optimization_engine**: ~40 tests
- **risk_engine**: ~45 tests
- **api_endpoints**: ~50 tests
- **Total**: ~165 tests

## Edge Cases Tested

- Empty/missing data files
- Insufficient data for calculations
- Mismatched asset names
- Zero/negative weights
- Single asset portfolios
- Singular/non-PSD covariance matrices
- Missing required columns
- Invalid input types
- API error responses

## Continuous Integration

Add to CI pipeline:
```yaml
- name: Run tests
  run: |
    cd api-service
    pip install -r requirements.txt
    pytest -v --cov=. --cov-report=xml
```

## Debugging Failed Tests

View detailed output:
```bash
pytest -vv --tb=long
```

Drop into debugger on failure:
```bash
pytest --pdb
```

Show print statements:
```bash
pytest -s
```

## Performance

Typical test execution time: ~30-60 seconds for full suite.

For faster iteration during development:
```bash
# Run only changed tests
pytest --lf  # last failed
pytest --ff  # failed first
```
