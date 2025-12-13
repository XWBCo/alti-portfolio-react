# AlTi Portfolio React

Modern React/Next.js rewrite of the AlTi Risk & Portfolio Construction platform for institutional wealth management.

## Overview

This application provides 7 integrated quantitative finance tools for portfolio analysis:

| Tool | Route | Status | Description |
|------|-------|--------|-------------|
| **Monte Carlo** | `/monte-carlo` | ✅ Complete | Stochastic projection (client-side, 10K sims in ~100ms) |
| **Portfolio Evaluation** | `/portfolio-evaluation` | ✅ Complete | Efficient frontier optimizer (quadprog) |
| **Risk Contribution** | `/risk-contribution` | ✅ Complete | Factor risk decomposition (Python FastAPI) |
| **Capital Market Assumptions** | `/capital-market-assumptions` | ✅ Complete | Forward-looking return projections |
| **Client Assessment** | `/client-assessment` | ✅ Complete | Qualtrics survey analysis |
| **Impact Analytics** | `/impact-analytics` | ✅ Complete | ESG scoring via Clarity AI |
| **Analytics Dashboard** | `/analytics` | ✅ Complete | Internal usage metrics |

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16.0.5 |
| **UI** | React 19.2.0 |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS 4 |
| **Charts** | Recharts 3.5.0 |
| **Animation** | Motion (Framer Motion) |
| **Math** | quadprog (optimization), client-side Monte Carlo |
| **Backend** | FastAPI (Python) for risk calculations |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Start Python backend (port 8001) - required for risk calculations
cd api-service && python3 main.py
```

Access at: **http://localhost:3000**

## Project Structure

```
alti-portfolio-react/
├── app/                          # Next.js app router
│   ├── page.tsx                  # Homepage with tool cards
│   ├── layout.tsx                # Root layout
│   ├── monte-carlo/              # Monte Carlo simulation
│   ├── portfolio-evaluation/     # Efficient frontier
│   ├── risk-contribution/        # Factor risk analysis
│   ├── capital-market-assumptions/
│   ├── client-assessment/        # Survey analysis
│   ├── impact-analytics/         # ESG platform (hub + sub-routes)
│   │   ├── analyze/              # Single portfolio ESG
│   │   ├── compare/              # Multi-portfolio comparison
│   │   ├── research/             # RAG-powered chat
│   │   └── reports/              # PDF generation
│   ├── analytics/                # Dev metrics dashboard
│   └── api/                      # API routes
│
├── components/                   # React components by feature
│   ├── monte-carlo/
│   ├── portfolio-evaluation/
│   ├── risk-contribution/
│   ├── capital-market-assumptions/
│   ├── client-assessment/
│   ├── impact-analytics/
│   └── icons/                    # Custom SVG icons
│
├── lib/                          # Core business logic (~3,500 lines)
│   ├── simulation.ts             # Monte Carlo engine
│   ├── optimization.ts           # Efficient frontier solver
│   ├── theme.ts                  # Design tokens
│   ├── clarity-api/              # Clarity AI integration
│   └── reports/                  # PDF generation
│
├── api-service/                  # Python FastAPI backend
│   ├── main.py                   # FastAPI app (port 8001)
│   ├── risk_engine.py            # LASSO regression, EWMA, risk decomposition
│   └── requirements.txt
│
└── data/                         # CSV data files
    ├── Returns/                  # Factor/security returns
    ├── Covariance_Matrix/        # Factor loadings/covariances
    ├── Portfolios/               # Client portfolios
    └── CMA/                      # Capital market assumptions
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Browser (Next.js Client)                                │
│                                                          │
│  React Components → TypeScript Libraries                │
│  (ParameterPanel)    (simulation.ts, optimization.ts)   │
│                                                          │
│  Client-side: Monte Carlo, Portfolio Optimization       │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP (heavy computations only)
        ┌────────v────────────────────────────────────────┐
        │ Next.js API Routes → External Services          │
        │                                                  │
        │ FastAPI (8001)    Clarity AI    CSV Data        │
        │ - Risk analysis   - ESG scores  - Returns       │
        │ - LASSO/EWMA      - Impact      - Covariance    │
        └─────────────────────────────────────────────────┘
```

## Environment Variables

```bash
# Clarity AI Integration (ESG)
CLARITY_API_KEY=<api-key>
CLARITY_API_URL=<endpoint>

# Python Backend
NEXT_PUBLIC_API_BASE=http://localhost:8001
```

## Development

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint check
npm run typecheck    # TypeScript check (if configured)
```

## Migration from Dash

This is a complete rewrite of the Python Dash application at:
```
/Users/xavi_court/claude_code/alti-risk-portfolio-app/
```

| Aspect | Original (Dash) | This App (React) |
|--------|-----------------|------------------|
| **Lines** | 10,381 Python | 7,000 TypeScript |
| **Rendering** | Server-side | Client-side + API |
| **Performance** | Network latency per interaction | Instant client-side |
| **Visualization** | Plotly | Recharts |
| **Target** | Internal server | Azure Container Apps |

## Migration Guide

See **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** for:
- Feature-by-feature mapping from legacy Dash to React
- Windows setup instructions for new developers
- API integration details
- Outstanding gaps and React-only enhancements

## License

Proprietary - AlTi Global Investment Group
