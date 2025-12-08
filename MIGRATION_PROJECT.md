# AlTi Risk & Portfolio App Migration Project

## Project Overview

**Objective:** Migrate the AlTi Risk & Portfolio Construction Dashboard from Python Dash to a modern React/Next.js stack to improve performance, developer experience, and user interface quality.

**Source Application:** `/Users/xavi_court/claude_code/alti-risk-portfolio-app/`
- Original stack: Python Dash + Plotly + Flask + PostgreSQL
- 7 integrated analytics tools for wealth management

**Target Application:** `/Users/xavi_court/claude_code/alti-portfolio-react/`
- New stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Recharts

---

## Current Status: ~65-70% FEATURE PARITY

All 7 core tool UIs have been migrated. Several advanced features and exports are missing.

### Migration Summary

| Tool | Route | Core UI | Full Parity | Gap |
|------|-------|---------|-------------|-----|
| **Monte Carlo Simulation** | `/monte-carlo` | ✅ | ⚠️ | Piecewise/regime UI not exposed |
| **Portfolio Evaluation** | `/portfolio-evaluation` | ✅ | ⚠️ | Simplified constraint templates |
| **Risk Contribution** | `/risk-contribution` | ✅ | ❌ | 8 stress scenarios missing |
| **Capital Market Assumptions** | `/capital-market-assumptions` | ✅ | ⚠️ | Methodology PDF download missing |
| **Client Assessment** | `/client-assessment` | ✅ | ❌ | Word export + Qualtrics integration missing |
| **Impact Analytics** | `/impact-analytics` | ✅ | ⚠️ | PDF reports unclear |
| **Investment Research** | `/investment-search` | 🗑️ | N/A | To be removed from homepage |

### Critical Missing Features

| Feature | Legacy | React | Priority |
|---------|--------|-------|----------|
| IPS Word Export | 500+ line implementation | Placeholder only | CRITICAL |
| Footer CTA Buttons | 3 (Feedback, Guide, PPT) | 0 functional | CRITICAL |
| Components Preview | 400+ line demo page | Removed | CRITICAL |
| Stress Scenarios | 8 historical periods | Missing | HIGH |
| Qualtrics Integration | Real API data | Mock data only | HIGH |

**See [AGENT_HANDOFF.md](./AGENT_HANDOFF.md) for complete gap analysis.**

### Infrastructure Complete

| Component | Status | Notes |
|-----------|--------|-------|
| **Project Scaffolding** | ✅ Complete | Next.js 16, TypeScript strict mode, Tailwind CSS 4 |
| **Design System** | ✅ Complete | AlTi brand colors, typography, spacing tokens |
| **Homepage Dashboard** | ✅ Complete | 7 tool cards in grid layout |
| **Header Component** | ✅ Complete | Logo, navigation, user greeting |
| **Authentication** | ✅ Complete | Email/password + Azure AD SAML support |
| **API Routes** | ✅ Complete | 8 endpoints for data, auth, risk, RAG |
| **Python Backend** | ✅ Complete | FastAPI on port 8001 for heavy compute |

---

## Project Structure

```
alti-portfolio-react/
├── app/                              # 30 page files (Next.js App Router)
│   ├── page.tsx                      # Homepage with 7 tool cards
│   ├── layout.tsx                    # Root layout + Header
│   ├── globals.css                   # Tailwind + theme variables
│   ├── api/                          # 8 API routes
│   │   ├── auth/                     # Authentication endpoints
│   │   ├── data/                     # Data fetching
│   │   ├── risk/                     # Risk calculations proxy
│   │   └── rag/                      # RAG search endpoints
│   ├── monte-carlo/                  # Monte Carlo simulation
│   ├── portfolio-evaluation/         # Efficient frontier optimizer
│   ├── risk-contribution/            # Factor risk decomposition
│   ├── capital-market-assumptions/   # Scenario projections
│   ├── client-assessment/            # Survey analysis
│   ├── impact-analytics/             # ESG platform hub
│   │   ├── analyze/                  # Single portfolio ESG
│   │   ├── compare/                  # Multi-portfolio comparison
│   │   ├── research/                 # RAG-powered chat
│   │   └── reports/                  # PDF generation
│   ├── investment-search/            # Legacy RAG tool
│   ├── analytics/                    # Developer metrics
│   └── login/                        # Authentication page
│
├── components/                       # 36 component files
│   ├── Header.tsx                    # Main navigation
│   ├── ToolCard.tsx                  # Homepage card component
│   ├── AuthWrapper.tsx               # Auth context provider
│   ├── monte-carlo/                  # 3 components
│   ├── portfolio-evaluation/         # 4 components
│   ├── risk-contribution/            # 3 components
│   ├── capital-market-assumptions/   # 3 components
│   ├── client-assessment/            # 4 components
│   ├── impact-analytics/             # 7 components + chat/
│   ├── icons/                        # AltiIcons.tsx (custom SVGs)
│   └── rag/                          # 3 components
│
├── lib/                              # 31 core library files
│   ├── simulation.ts                 # Monte Carlo engine (~450 lines)
│   ├── optimization.ts               # Efficient frontier solver (~300 lines)
│   ├── theme.ts                      # Design tokens
│   ├── types.ts                      # Global TypeScript interfaces
│   ├── auth/                         # 5 auth files
│   ├── clarity-api/                  # 5 ESG integration files
│   ├── reports/                      # 5 PDF generation files
│   └── hooks/                        # Custom React hooks
│
├── api-service/                      # Python FastAPI backend
│   ├── main.py                       # FastAPI app (port 8001)
│   ├── risk_engine.py                # LASSO, EWMA calculations
│   └── requirements.txt
│
├── data/                             # CSV data files
│   ├── Returns/
│   ├── Covariance_Matrix/
│   ├── Portfolios/
│   └── CMA/
│
├── public/                           # Static assets
├── types/                            # Additional type definitions
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
└── next.config.ts                    # Next.js config
```

---

## Outstanding Tasks

**See [AGENT_HANDOFF.md](./AGENT_HANDOFF.md) for detailed task prioritization.**

Summary of remaining polish work:

| Priority | Task | Estimate |
|----------|------|----------|
| 🔴 Critical | Fix AlTi logo in Header | 15 min |
| 🔴 High | Remove duplicate header from Impact Analytics | 30 min |
| 🟡 Medium | Remove Investment Research from homepage | 15 min |
| 🟡 Medium | Replace generic icons with custom SVGs | 2-3 hours |
| 🟢 Low | Add /analytics developer page content | 1-2 hours |
| 🟢 Low | General design polish | Ongoing |

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Charts** | Recharts over Plotly React | Simpler API, better React integration |
| **Simulation** | Client-side TypeScript | Eliminates server round-trips (~100ms) |
| **State** | React hooks only | Sufficient for current scope |
| **Animation** | Motion over Framer Motion | Lighter bundle, same API |
| **Styling** | Tailwind CSS 4 | Fast development, consistent theming |
| **Heavy Compute** | Python FastAPI backend | Reuses existing LASSO/EWMA code |
| **Auth** | iron-session | Secure cookie-based sessions |

---

## Reference: Original Dash Files

| Dash File | React Equivalent | Status |
|-----------|------------------|--------|
| `dashboard/apps/monte_carlo.py` | `lib/simulation.ts` | ✅ Ported |
| `dashboard/apps/evaluation.py` | `lib/optimization.ts` | ✅ Ported |
| `dashboard/apps/risk.py` | `api-service/risk_engine.py` | ✅ Ported |
| `dashboard/apps/cma_v2.py` | `lib/cma-data.ts` | ✅ Ported |
| `dashboard/apps/qualtrics_main.py` | `lib/client-assessment-*.ts` | ✅ Ported |
| `dashboard/engine/efficient_frontier.py` | `lib/optimization.ts` | ✅ Ported |
| `dashboard/engine/risk_functions.py` | `api-service/risk_engine.py` | ✅ Ported |

---

## Running the Application

```bash
# Start Next.js frontend (port 3000)
cd /Users/xavi_court/claude_code/alti-portfolio-react
npm run dev

# Start Python backend (port 8001) - required for Risk Contribution
cd api-service
pip install -r requirements.txt
python main.py
```

---

## Project Timeline

- **November 2024:** Migration initiated
- **December 2024:** All 7 tools migrated, MVP complete
- **Next:** Polish tasks per AGENT_HANDOFF.md

---

## Code Metrics Comparison

| Metric | Legacy Dash | React | Notes |
|--------|-------------|-------|-------|
| App page files | 9 modules | 30 pages | More granular routing |
| Component files | Inline | 36 files | Better separation |
| Lines of code | 10,381 | ~4,600 | 55% smaller (missing features) |
| Export features | Word, PDF, CSV, PPT | CSV only | Missing 3 export types |
| Real integrations | Qualtrics, SAML, Clarity AI | Clarity AI partial | Missing 2 |
| Stress scenarios | 8 historical | 0 | Not implemented |
| Functional downloads | 3 buttons | 0 | Footer CTAs missing |
