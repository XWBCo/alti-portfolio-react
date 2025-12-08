# AlTi Portfolio App Migration - Agent Handoff

## Project Objective

**Goal:** Migrate the AlTi Risk & Portfolio Construction Dashboard from Python Dash to a modern React/Next.js stack for internal server deployment at AlTi Global (wealth management firm).

**Why:** The Dash app served as a prototype. The React migration provides:
- Better performance and user experience
- Modern component architecture
- Easier maintenance and iteration
- Production-ready deployment capabilities

---

## Repository Locations

| Repository | Purpose |
|------------|---------|
| `/Users/xavi_court/claude_code/alti-risk-portfolio-app/` | **Source** - Legacy Dash app (10k+ lines) + Next.js ESG app |
| `/Users/xavi_court/claude_code/alti-portfolio-react/` | **Target** - New React/Next.js migration |

---

## Tech Stacks

### Legacy Dash App
- **Frontend:** Python Dash + Plotly + Dash Bootstrap Components
- **Backend:** Flask + PostgreSQL (server-side sessions)
- **Auth:** Azure AD SAML (configured)
- **Size:** 10,381 lines across 9 Dash modules

### New React App
- **Framework:** Next.js 16 + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **Animation:** Motion (Framer Motion)
- **Backend:** Python FastAPI (port 8001) for heavy compute

---

## Migration Status: ~65-70% Feature Parity

| Tool | Route | Core UI | Full Parity | Notes |
|------|-------|---------|-------------|-------|
| Monte Carlo Simulation | `/monte-carlo` | ✅ | ⚠️ | Missing piecewise/regime UI |
| Portfolio Evaluation | `/portfolio-evaluation` | ✅ | ⚠️ | Simplified constraints |
| Risk Contribution | `/risk-contribution` | ✅ | ❌ | Missing stress scenarios |
| Capital Market Assumptions | `/capital-market-assumptions` | ✅ | ⚠️ | Missing methodology PDF |
| Client Assessment | `/client-assessment` | ✅ | ❌ | Mock data, no Word export |
| Impact Analytics | `/impact-analytics` | ✅ | ⚠️ | PDF reports unclear |
| Investment Research | `/investment-search` | 🗑️ | N/A | **REMOVE** - Legacy to Impact chat |

---

## CRITICAL GAPS (Must Fix Before Production)

### 1. IPS Word Document Export - Client Assessment

**Legacy:** Full 500+ line Word export system
- File: `app_qualtrics/utils/export_word.py`
- Features: IPS template auto-population, cover pages, archetype profiles, portfolio allocations
- Callback: `export_ips_document()` in `qualtrics_main.py`

**React:** Export button shows "Coming Soon" alert only
- File: `app/client-assessment/page.tsx` lines 86-91
- Status: **NOT IMPLEMENTED**

**Fix Required:**
1. Port `export_word.py` to TypeScript or create API route
2. Use `docx` npm package or server-side Python
3. Implement full IPS document generation

---

### 2. Footer CTA Buttons (3 Functional → 0)

**Legacy:** 3 functional action buttons
```
1. "Send Feedback" - Opens feedback modal with form submission
2. "User Guide" - Downloads AlTi_Risk_Dashboard_Documentation.pdf
3. "PPT Use Cases" - Downloads RPC_UseCases.pptx
```
- Implementation: `dashboard.py` lines 826-862 with `dcc.Download` callbacks

**React:** Tech stack badges only (NO functional buttons)
- File: `app/page.tsx` lines 265-278
- Shows: Next.js 16, React 19, TypeScript, Tailwind CSS badges
- Status: **NO USER ENGAGEMENT FEATURES**

**Fix Required:**
1. Copy PDF/PPT files to `/public/downloads/`
2. Add download buttons with proper links
3. Implement feedback modal with form submission

**Source Files to Copy:**
```
alti-risk-portfolio-app/assets/AlTi_Risk_Dashboard_Documentation.pdf
alti-risk-portfolio-app/assets/RPC_UseCases.pptx
```

---

### 3. Components Preview Page Removed

**Legacy:** 400+ line component library demo
- File: `components_preview.py`
- Route: `/components/preview`
- Shows: Color palettes, button states, form controls, data tables

**React:** Page does not exist
- Status: **REMOVED IN MIGRATION**

**Fix Required:**
1. Create `/app/components-preview/page.tsx`
2. Showcase Tailwind components, color system, form controls
3. Useful for developers and design consistency

---

## HIGH PRIORITY GAPS

### 4. Risk Contribution - Stress Scenarios Missing

**Legacy:** 8 pre-configured historical stress scenarios
```python
STRESS_SCENARIOS = {
    "GFC": ("2008-09-01", "2009-03-31"),
    "Q4 2018 Holiday Selloff": ("2018-10-01", "2018-12-31"),
    "COVID Lockdown": ("2020-02-01", "2020-03-31"),
    # ... 5 more scenarios
}
```
- Implementation: `risk.py` lines 115-125

**React:** No stress scenario selector in UI
- File: `app/risk-contribution/page.tsx`
- Status: **NOT VISIBLE**

---

### 5. Risk Contribution - Benchmark Tracking Error

**Legacy:** Full benchmark comparison (800+ lines in `risk.py`)
- Tracking error decomposition
- Portfolio vs benchmark factor risk breakdown
- Detailed comparison tables

**React:** Has `benchmark` state but limited UI exposure
- Status: **PARTIAL IMPLEMENTATION**

---

### 6. Monte Carlo - Piecewise/Regime Change Parameters

**Legacy:** Full multi-period simulation with regime changes
```python
# Parameters for changing market assumptions over time
annual_return_initial, annual_return_u1, annual_return_u2
update1_year, update2_year  # Years when assumptions change
```
- Implementation: `monte_carlo.py` lines 109-160

**React:** TypeScript types exist but UI doesn't expose all controls
- File: `lib/types.ts` has `PiecewiseParams`
- File: `components/monte-carlo/ParameterPanel.tsx`
- Status: **CODE EXISTS, UI INCOMPLETE**

---

### 7. Portfolio Evaluation - Advanced Optimizer Controls

**Legacy:** 12+ constraint parameters
```python
# Asset class-specific caps (Tight/Standard/Loose templates)
# Bucket constraints (Stability/Diversified/Growth)
# Special asset caps (Venture, CLO, Development, Special Situations)
```
- Implementation: `evaluation.py` lines 44-92

**React:** Basic mode selector and simple caps dropdown
- Status: **SIMPLIFIED**

---

### 8. Capital Market Assumptions - Methodology PDF Download

**Legacy:** Download button for "AlTi CMA Update 2025.pdf"
- Implementation: `cma_v2.py` lines 37-41 `download_methodology()`

**React:** Can download CMA data and CSV, but NO methodology PDF
- Status: **MISSING DOWNLOAD**

---

### 9. Client Assessment - Qualtrics Integration

**Legacy:** Real Qualtrics API integration
- Email-based filtering: `filter_responses_by_email()`
- Survey submission date tracking
- Live data from Qualtrics surveys

**React:** Hardcoded mock data
- File: `lib/client-assessment-mock-data.ts`
- `MOCK_CLIENTS` array instead of API calls
- Status: **MOCK DATA ONLY**

---

### 10. Impact Analytics - PDF Report Generation

**Legacy:** Full PDF generation for ESG reports
- Multiple templates, customization options
- Playwright-based rendering

**React:** Partial implementation
- Has `/impact-analytics/reports/preview` page
- File: `lib/reports/pdf-generator.ts`
- Status: **UNCLEAR - NEEDS VERIFICATION**

---

## MEDIUM PRIORITY

### 11. Fix AlTi Logo (15 min)

**Problem:** Header shows placeholder "AlTi" text box instead of real logo.

**Real Logo Location:**
```
/Users/xavi_court/claude_code/alti-risk-portfolio-app/assets/alti_logo.jpg  (184 KB - MAIN)
```

**Fix:**
1. Copy `alti_logo.jpg` to `/public/alti-logo.jpg`
2. Update `components/Header.tsx` to use `<Image src="/alti-logo.jpg" />`

---

### 12. Fix Impact Analytics Double Header (30 min)

**Problem:** `/impact-analytics` shows BOTH main app Header AND ESG's internal header.

**Files to fix:**
- `app/impact-analytics/page.tsx`
- `app/impact-analytics/analyze/page.tsx`
- `app/impact-analytics/compare/page.tsx`
- `app/impact-analytics/research/page.tsx`
- `app/impact-analytics/reports/preview/page.tsx`

---

### 13. Remove Investment Research from Homepage (15 min)

**Why:** The `/investment-search` RAG tool is legacy. Functionality moved to Impact Analytics research chat.

**Fix:** Edit `app/page.tsx` - remove from TOOLS array (id: 'investment-search')

---

### 14. Replace Card Icons with Real SVGs (2-3 hours)

**Source:** `/alti-risk-portfolio-app/dashboard/dashboard_config/icons.py`

Contains Python functions generating SVG strings for each tool. Convert to React components.

---

### 15. CSV Encoding Handling

**Legacy:** Smart encoding fallback (latin-1, utf-8, cp1252)
- Implementation: `risk.py` lines 129-141

**React:** Standard browser File API
- Status: May have encoding issues with special characters

---

## LOW PRIORITY (Polish)

### 16. Analytics Dashboard Enhancement

**Legacy:** 400+ lines of detailed metrics
**React:** Page exists with mock data at `/analytics`
- UI is complete but using mock data

---

### 17. SAML Authentication

**Legacy:** Full Azure AD SAML setup
**React:** Simple email/password only
- Adequate for prototype, enhance for production

---

## Code Metrics Comparison

| Metric | Legacy Dash | React | Gap |
|--------|-------------|-------|-----|
| Total app code (main files) | 10,381 lines | 4,606 lines | 55% smaller |
| Export features | Word, PDF, CSV, PPT | CSV only | Missing 3 |
| Real integrations | Qualtrics, SAML, Clarity AI | Clarity AI (partial) | Missing 2 |
| Mock data usage | Minimal | Heavy | Needs real data |
| Stress scenarios | 8 historical | 0 | Missing all |
| Functional downloads | 3 (PDF, PPT, Feedback) | 0 | Missing all |

---

## Priority Fix Order

| # | Task | Estimate | Impact |
|---|------|----------|--------|
| 1 | IPS Word Export | 4-6 hours | Client deliverable |
| 2 | Footer CTA Buttons | 1 hour | User engagement |
| 3 | Stress Scenarios | 2-3 hours | Risk analysis feature |
| 4 | Qualtrics Integration | 3-4 hours | Real client data |
| 5 | Fix Logo | 15 min | Branding |
| 6 | Fix Double Header | 30 min | Visual bug |
| 7 | Remove Investment Search | 15 min | Cleanup |
| 8 | Piecewise MC Params | 1-2 hours | Advanced simulation |
| 9 | CMA Methodology PDF | 30 min | Documentation |
| 10 | Components Preview | 2-3 hours | Developer tool |
| 11 | Advanced Optimizer | 2-3 hours | Power users |
| 12 | Custom SVG Icons | 2-3 hours | Design polish |

---

## Key Files Reference

### Legacy App - Important Files
```
alti-risk-portfolio-app/
├── assets/
│   ├── alti_logo.jpg                        # MAIN LOGO (184 KB)
│   ├── AlTi_Risk_Dashboard_Documentation.pdf # User guide
│   └── RPC_UseCases.pptx                    # Use cases PPT
│
├── app_qualtrics/utils/
│   └── export_word.py                       # IPS Word export (500+ lines)
│
├── dashboard/
│   ├── dashboard_config/
│   │   ├── colors.py                        # Brand colors
│   │   ├── icons.py                         # SVG icon generators
│   │   └── design_tokens.py                 # Typography, spacing
│   │
│   ├── apps/
│   │   ├── analytics.py                     # Usage analytics (1,200 lines)
│   │   ├── components_preview.py            # Component demo (400+ lines)
│   │   ├── evaluation.py                    # Portfolio eval (constraints)
│   │   ├── monte_carlo.py                   # MC with piecewise
│   │   ├── risk.py                          # Risk + stress scenarios
│   │   ├── cma_v2.py                        # CMA + methodology DL
│   │   └── qualtrics_main.py                # Real Qualtrics integration
│   │
│   └── dashboard.py                         # Footer CTAs (lines 826-862)
```

### React App - Current Structure
```
alti-portfolio-react/
├── app/
│   ├── page.tsx                # Homepage (footer needs CTAs)
│   ├── client-assessment/
│   │   └── page.tsx            # Export button = placeholder
│   ├── risk-contribution/
│   │   └── page.tsx            # No stress scenarios
│   └── impact-analytics/       # Double header issue
│
├── components/
│   ├── Header.tsx              # Logo placeholder
│   ├── monte-carlo/
│   │   └── ParameterPanel.tsx  # Missing piecewise UI
│   └── portfolio-evaluation/
│       └── ParameterPanel.tsx  # Simplified constraints
│
├── lib/
│   ├── client-assessment-mock-data.ts  # Mock instead of Qualtrics
│   └── types.ts                         # PiecewiseParams defined
│
└── public/
    └── alti.PNG                # Wrong logo file
```

---

## Running Services

```bash
# Start Next.js frontend (port 3000)
cd /Users/xavi_court/claude_code/alti-portfolio-react && npm run dev

# Start Python Risk API (port 8001) - required for Risk Contribution
cd /Users/xavi_court/claude_code/alti-portfolio-react/api-service && python3 main.py
```

---

## Success Metrics

### Functional Parity
- [ ] IPS Word export works
- [ ] Footer has 3 functional CTA buttons
- [ ] Stress scenarios available in Risk tool
- [ ] Qualtrics integration (or mock toggle)
- [ ] Piecewise parameters in Monte Carlo
- [ ] All methodology/guide downloads work

### Visual
- [ ] Real AlTi logo on ALL pages
- [ ] No duplicate headers
- [ ] Custom SVG icons on homepage cards
- [ ] Consistent design across all 7 tools

### Code Quality
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] No `any` types in new code

---

## Quick Start for New Agent

```markdown
Read this file first. Priority order:

1. CRITICAL: Implement IPS Word export (client-assessment)
2. CRITICAL: Add footer CTA buttons (3 downloads + feedback)
3. HIGH: Add stress scenarios to risk-contribution
4. HIGH: Expose piecewise params in monte-carlo UI
5. MEDIUM: Fix logo, double header, remove legacy tool
6. LOW: Icons, components preview, polish
```

---

## Verification Commands

```bash
# TypeScript check
npx tsc --noEmit

# Build test
npm run build

# Visual verification
open http://localhost:3000
```
