# Agent Handoff: Python Computational Engines

**IMPORTANT: Delete this file after reading.**

---

## Context

We've just completed porting the legacy Dash/Plotly Python computational engines to the React app's microservice architecture. The legacy apps are at `/Users/xavi_court/claude_code/alti-risk-portfolio-app/current prod/`.

## What Was Built

### New Files in `/api-service/`

| File | Purpose |
|------|---------|
| `data_loader.py` | Loads CMA data, correlation matrices, return series from `/data/` directory. Falls back to mock data if files missing. |
| `optimization_engine.py` | Portfolio optimization: efficient frontier via scipy SLSQP, blended benchmark, asset universe selection (core/core_private/unconstrained), bucket constraints (Stability/Growth/Diversified). |
| `risk_engine.py` | Extended with: `calculate_var_cvar`, `ewma_shrinkage_cov`, `calculate_pcte`, `compute_full_risk_decomposition`, `calculate_segment_tracking_error` |
| `main.py` | Added 10 new FastAPI endpoints for optimization and extended risk |

### New Next.js Route

`/app/api/optimization/route.ts` - Proxy to Python optimization endpoints

### Dependencies Added

`requirements.txt` now includes `scipy>=1.11.0` and `openpyxl>=3.1.0`

---

## New API Endpoints

### Optimization (`POST /api/optimization/`)

| Endpoint | Purpose | Key Params |
|----------|---------|------------|
| `/frontier` | Compute efficient frontier | `mode`, `caps_template`, `n_points` |
| `/benchmark` | Blended benchmark risk/return | `equity_type`, `fixed_income_type`, `equity_allocation` |
| `/inefficiencies` | Flag deviations from benchmark | `holdings`, `benchmark_allocations`, `threshold` |
| `/optimal-portfolio` | Find optimal from frontier | `target_return`, `target_risk`, `risk_free_rate` |
| `/assets` (GET) | List available assets | - |

### Extended Risk (`POST /api/risk/`)

| Endpoint | Purpose |
|----------|---------|
| `/var-cvar` | Value at Risk / Conditional VaR |
| `/pcte` | Portfolio Contribution to Tracking Error |
| `/full-decomposition` | Systematic/specific/active risk breakdown |
| `/segment-tracking-error` | Growth vs Stability TE decomposition |

---

## How to Test

```bash
# Start Python service
cd /Users/xavi_court/claude_code/alti-portfolio-react/api-service
pip install -r requirements.txt
python main.py  # Runs on port 8001

# Test efficient frontier
curl -X POST http://localhost:8001/api/optimization/frontier \
  -H "Content-Type: application/json" \
  -d '{"mode": "core", "n_points": 10}'

# Test VaR
curl -X POST http://localhost:8001/api/risk/var-cvar \
  -H "Content-Type: application/json" \
  -d '{"portfolio": {"Asset_1": 0.5, "Asset_2": 0.5}, "confidence_level": 0.95}'
```

---

## What's NOT Done (Future Work)

1. **React UI integration** - The `/portfolio-evaluation` page doesn't yet call the new optimization endpoints
2. **Real data loading** - Currently uses mock data; need to wire up actual CMA files from `/data/`
3. **Tests** - No pytest unit tests written yet
4. **Stress scenarios** - Basic implementation exists but could use the full legacy scenario definitions

---

## Key Source Files for Reference

| Legacy File | What to Reference |
|-------------|-------------------|
| `app_eval.py:40-177` | Optimizer helpers, frontier logic |
| `app_eval.py:237-251` | Blended benchmark calculation |
| `risk_functions.py:24-27` | VaR/CVaR |
| `risk_functions2.py:1436-1454` | EWMA shrinkage |
| `risk_functions2.py:1480-1639` | Full risk decomposition |

---

## Architecture

```
React (Next.js)
    │
    ├── /app/api/risk/route.ts ──────────┐
    │                                     │
    ├── /app/api/optimization/route.ts ──┼──► Python FastAPI (port 8001)
    │                                     │      ├── main.py (endpoints)
    │                                     │      ├── risk_engine.py
    │                                     │      ├── optimization_engine.py
    │                                     │      └── data_loader.py
    │
    └── /app/risk-contribution/page.tsx
        (calls /api/risk endpoints)
```

---

## Remember

**DELETE THIS FILE AFTER READING** - It's a temporary handoff document.

The implementation plan is preserved at: `/Users/xavi_court/.claude/plans/imperative-popping-island.md`
