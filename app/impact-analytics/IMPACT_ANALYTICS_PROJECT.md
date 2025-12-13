# Impact Analytics Project

**Created:** November 25, 2025
**Updated:** December 10, 2025
**App Location:** `/app/impact-analytics/`

**Related Docs:**
- [ADDEPAR_API_REFERENCE.md](./ADDEPAR_API_REFERENCE.md) - Detailed API endpoints and working examples
- [ESG_DATA_PIPELINE_STRATEGY.md](./ESG_DATA_PIPELINE_STRATEGY.md) - Database schema and ETL pipeline design
- [HANDOFF_SUMMARY.md](./HANDOFF_SUMMARY.md) - Quick reference for key findings

---

## Overview

The Impact Analytics module provides ESG (Environmental, Social, Governance) scoring and analysis for AlTi client portfolios. The system integrates two external APIs and generates client-facing reports.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        END-TO-END WORKFLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   ADDEPAR    │───▶│  CLARITY AI  │───▶│   DATABASE   │───▶│  OUTPUT   │ │
│  │   (Source)   │    │  (Scoring)   │    │   (Storage)  │    │  (Report) │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
│                                                                             │
│  Holdings Data       ESG Scores          React App DB       HTML/PDF        │
│  ISINs/CUSIPs        E/S/G 0-100         /data/ folder      Dashboard       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Addepar Integration (Data Source)

### Authentication

| Parameter | Value |
|-----------|-------|
| **Base URL** | `https://tiedemann.addepar.com/api/v1` |
| **Auth Type** | HTTP Basic Auth |
| **Key Format** | `adprk_*` (key) / `adprs_*` (secret) |
| **Firm Header** | `Addepar-Firm: {firm_id}` |
| **Content-Type** | `application/vnd.api+json` |

```typescript
// Example: Addepar API Headers
const headers = {
  'Authorization': `Basic ${btoa(`${ADP_KEY}:${ADP_SECRET}`)}`,
  'Addepar-Firm': ADP_FIRM_ID,
  'Content-Type': 'application/vnd.api+json'
};
```

### Data Hierarchy

Addepar organizes data in a hierarchical ownership model:

```
Level 0: FIRM (All assets under management)
    │
    ├── Level 1: CLIENT RELATIONSHIP (Group)
    │       Examples: "Smith Family Relationship", "Jones Trust & Estate"
    │       Entity Type: GROUP
    │       └── Contains aggregated view of all client entities
    │
    └── Level 2: LEGAL ENTITIES
            │
            ├── PERSON_NODE (Individual clients)
            ├── TRUST (Trust accounts)
            ├── FOUNDATION (Charitable foundations)
            ├── LLC / LP (Business entities)
            │
            └── Level 3: FINANCIAL ACCOUNTS
                    │
                    ├── Brokerage accounts (Pershing, Schwab, etc.)
                    ├── Custody accounts
                    ├── Retirement accounts (IRA, 401k)
                    │
                    └── Level 4: SECURITIES (Positions)
                            ├── STOCK (ISINs)
                            ├── ETF (ISINs)
                            ├── BOND (CUSIPs)
                            ├── MUTUAL_FUND (CUSIPs)
                            └── CASH
```

**Aggregation Rule:** Total at Level 2 = Total at Level 1 = Level 0

### Rate Limits

| Window | Limit |
|--------|-------|
| 15 minutes | 50 requests |
| 24 hours | 1000 requests |
| Max runtime | 60 seconds per request |

### Key Endpoints

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/entities` | GET | List all entities (clients, accounts, securities) | 500/page |
| `/entities/{id}` | GET | Single entity details | - |
| `/groups` | GET | List client relationship groups | 500/page |
| `/groups/{id}/children` | GET | Entities within a group | - |
| `/positions` | GET | All positions (holdings) | 500/page |
| `/securities` | GET | Security master data (ISINs, CUSIPs) | 500/page |
| `/portfolio/views/{id}/results` | GET | **RECOMMENDED** - Run portfolio view | - |
| `/jobs` | POST | Submit async portfolio query | - |
| `/jobs/{id}` | GET | Check job status | - |
| `/jobs/{id}/download` | GET | Download job results | - |
| `/groups/{id}/members` | GET | Get group members (Level 2) | - |

### Portfolio View API (RECOMMENDED)

**Use View ID 322127** ("Addepar - Portfolio Details") for accurate holdings values.

```typescript
// Get holdings with accurate $ values matching Addepar UI
const params = new URLSearchParams({
  portfolio_id: GROUP_ID,
  portfolio_type: 'GROUP',
  output_type: 'JSON',
  start_date: '2025-12-10',
  end_date: '2025-12-10'
});

const resp = await fetch(
  `${BASE_URL}/portfolio/views/322127/results?${params}`,
  { headers }
);
```

**Key Views Discovered:**
| View ID | Name | Use Case |
|---------|------|----------|
| **322127** | Addepar - Portfolio Details | Accurate $ values (has `hide_previous_holdings: true`) |
| 555529 | ALTI - Impact Report View | ESG/Impact custom attributes |
| 555527 | ALTI - Impact Attributes | Impact data columns |

**Critical Setting:** The view 322127 includes `hide_previous_holdings: true` which filters terminated positions. This is why it returns $92M for Taylor Family vs $101M from raw queries.

**Limitation:** Cannot batch multiple GROUP IDs in one query - must query each relationship individually.

### Jobs API (Async Large Exports)

The `/jobs` endpoint with `PORTFOLIO_QUERY` type is useful for **async large exports**. For real-time queries, use the Portfolio View API above.

```typescript
// Submit a portfolio query job
const jobPayload = {
  data: {
    type: "job",
    attributes: {
      job_type: "PORTFOLIO_QUERY",
      parameters: {
        columns: [
          { key: "node_id" },
          { key: "top_level_owner" },
          { key: "top_level_owner_id" },
          { key: "top_level_legal_entity" },
          { key: "reference_currency" },
          { key: "isin" },
          { key: "value" }  // USD value
        ],
        groupings: [
          { key: "top_level_legal_entity" },
          { key: "security" }
        ],
        filters: [
          // Optional: exclude closed/test accounts
          {
            attribute: "_custom_terminated_status_498688",
            type: "discrete",
            operator: "exclude",
            values: ["Former Client"]
          }
        ],
        portfolio_type: "group",
        portfolio_id: [GROUP_ID],  // Client Relationship ID
        start_date: "2025-12-01",
        end_date: "2025-12-10"
      }
    }
  }
};

const resp = await fetch(`${BASE_URL}/jobs`, {
  method: 'POST',
  headers,
  body: JSON.stringify(jobPayload)
});

const { data: { id: jobId } } = await resp.json();
// Job ID returned, poll /jobs/{id} until completed
// Then GET /jobs/{id}/download for results
```

### Jobs Response Structure

```json
{
  "meta": { "columns": [...] },
  "data": {
    "type": "portfolio_views",
    "attributes": {
      "total": {
        "name": "Total",
        "columns": { "value": 8096796.62 },
        "children": [
          {
            "name": "Burton Trust",
            "columns": { "value": 1.50 },
            "children": [
              {
                "name": "Akre Focus Fund",
                "columns": { "isin": "US7429351254", "value": 0.00 }
              }
            ]
          }
        ]
      }
    }
  }
}
```

### Entity Response Structure

```json
{
  "data": [{
    "id": "12345",
    "type": "entities",
    "attributes": {
      "display_name": "Apple Inc.",
      "model_type": "STOCK",
      "isin": [{"value": "US0378331005", "weight": 1.0}],
      "cusip": [{"value": "037833100", "weight": 1.0}]
    }
  }]
}
```

### Pagination

```typescript
// Addepar uses cursor-based pagination
let allEntities = [];
let nextUrl = `${BASE_URL}/entities?page[size]=500`;

while (nextUrl) {
  const resp = await fetch(nextUrl, { headers });
  const data = await resp.json();
  allEntities.push(...data.data);
  nextUrl = data.links?.next || null;
}
```

---

## Part 2: Clarity AI Integration (ESG Scoring)

### Authentication

| Parameter | Value |
|-----------|-------|
| **Base URL** | `https://api.clarity.ai/clarity/v1` |
| **Auth Endpoint** | `POST /oauth/token` |
| **Token Expiry** | 60 minutes |
| **Auth Body** | `{ "key": "...", "secret": "..." }` |

```typescript
// Token Management
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getClarityToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const resp = await fetch(`${CLARITY_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: CLARITY_KEY, secret: CLARITY_SECRET })
  });

  const { token } = await resp.json();
  cachedToken = { token, expiresAt: Date.now() + 60 * 60 * 1000 };
  return token;
}
```

### Async Batch Workflow

**Important:** Portfolio-level endpoints require additional permissions (403 Forbidden with standard keys). Use the Async Securities Batch API instead.

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: Submit Async Job                                           │
│  POST /public/securities/esg-risk/scores-by-id/async                │
│  Body: {                                                            │
│    "securityIds": ["US0378331005", "US5949181045", ...],           │
│    "securityIdsType": "ISIN",  // or "CUSIP"                       │
│    "scoreIds": ["ENVIRONMENTAL", "SOCIAL", "GOVERNANCE"]            │
│  }                                                                  │
│  Returns: { "uuid": "7e0e5a0b-d3ad-4413-b4f7-..." }                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: Poll Status (every 30-60 seconds)                          │
│  GET /public/job/{uuid}/status                                      │
│  Returns: { "statusMessage": "RUNNING" }                            │
│       or: { "statusMessage": "SUCCESS" }                            │
│  Typical processing: ~2 minutes for 500 securities                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: Download Results                                           │
│  GET /public/job/{uuid}/download                                    │
│  Returns: CSV with columns:                                         │
│    ISIN, GOVERNANCE.SCORE, GOVERNANCE.META, GOVERNANCE.RELEVANCE,  │
│    ENVIRONMENTAL.SCORE, ENVIRONMENTAL.META, ENVIRONMENTAL.RELEVANCE,│
│    SOCIAL.SCORE, SOCIAL.META, SOCIAL.RELEVANCE                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Batch Processing Recommendations

| Batch Size | Processing Time | Frequency |
|------------|-----------------|-----------|
| < 500 securities | ~2 minutes | On-demand |
| 500-2000 securities | ~5 minutes | Daily |
| 2000+ securities | ~10 minutes | Weekly |

**Recommendation:** Run full universe refresh weekly; on-demand for individual client analysis.

### Identifier Support & Coverage

**Actual test results from December 2025:**

| Type | Parameter | Submitted | With Scores | Coverage |
|------|-----------|-----------|-------------|----------|
| ISIN | `"securityIdsType": "ISIN"` | 3,619 | 3,378 | **93.3%** |
| CUSIP | `"securityIdsType": "CUSIP"` | 501 | 483 | **96.4%** |

**Best Practice:** Submit ISINs first, then CUSIPs for securities without ISINs.

**Test results saved to:**
- `/tmp/clarity_esg_results.csv` - ISIN batch results
- `/tmp/clarity_cusip_results.csv` - CUSIP batch results

### Coverage Gaps (Not in Clarity Universe)

- Municipal bonds
- Many corporate bonds
- SMAs (no look-through via this API)
- BDCs
- Private equity / hedge funds
- Real estate (direct holdings)

---

## Part 3: Data Storage

### Database Location

```
/alti-portfolio-react/
├── data/
│   ├── clients/                    # Client relationship data
│   │   ├── {client_id}.json        # Per-client holdings + ESG
│   │   └── index.json              # Client list
│   ├── securities/                 # Security master
│   │   └── esg_scores.json         # ISIN → E/S/G scores
│   └── exports/                    # Generated reports
│       └── {date}/
│           ├── {client}_report.html
│           └── {client}_report.pdf
```

### Client Data Schema

```typescript
interface ClientPortfolio {
  clientId: string;
  clientName: string;
  groupId: string;                  // Addepar Group ID
  asOf: string;                     // ISO date
  totalValue: number;               // USD

  holdings: Array<{
    securityId: string;             // ISIN or CUSIP
    securityName: string;
    assetType: 'STOCK' | 'ETF' | 'BOND' | 'FUND' | 'CASH' | 'OTHER';
    value: number;                  // USD
    weight: number;                 // 0-1

    esg?: {
      environmental: { score: number; relevance: number };
      social: { score: number; relevance: number };
      governance: { score: number; relevance: number };
    };
  }>;

  aggregateScores: {
    environmental: number;          // Weighted average
    social: number;
    governance: number;
    coverage: number;               // % of AUM with ESG scores
  };
}
```

---

## Part 4: Frontend Sub-Apps

### Directory Structure

```
/app/impact-analytics/
├── page.tsx                        # Landing page (hub)
├── layout.tsx                      # Shared layout
├── IMPACT_ANALYTICS_PROJECT.md     # This file
│
├── analyze/                        # Single portfolio analysis
│   ├── page.tsx                    # Client selection UI
│   ├── loading/page.tsx            # Progress indicator
│   └── results/page.tsx            # Analysis results
│
├── compare/                        # Portfolio comparison
│   ├── page.tsx                    # Multi-select UI
│   ├── loading/page.tsx            # Progress indicator
│   └── results/page.tsx            # Comparison view
│
├── reports/                        # Report generation
│   └── preview/page.tsx            # HTML preview before export
│
├── research/                       # Research tools
│   └── page.tsx                    # Security lookup, universe search
│
└── api/                            # API routes
    ├── scores/route.ts             # Clarity AI proxy
    ├── reports/route.ts            # Report generation
    └── research/route.ts           # Research endpoints
```

### Analyze Portfolio Workflow

```
User selects client → Fetch holdings from DB → Display ESG breakdown
                                                      │
                                                      ▼
                                              Generate Report
                                                      │
                                              ┌───────┴───────┐
                                              ▼               ▼
                                          HTML View       PDF Export
```

### Compare Portfolios Workflow

```
User selects 2+ clients → Fetch all holdings → Side-by-side analysis
                                                      │
                                                      ▼
                                              Delta calculations
                                              (E/S/G differences)
                                                      │
                                                      ▼
                                              Generate comparison
                                              report (HTML/PDF)
```

---

## Part 5: Output Generation

### HTML Dashboard Format

Self-contained HTML file with embedded CSS and data. Reference: `/Users/xavi_court/Downloads/alti-impact-dashboard.html`

**Key Specifications:**
- Page dimensions: 1000px × 700px (optimized for PDF export)
- Brand colors: `--alti-teal: #10B981`
- ESG colors: E=#10B981 (green), S=#3B82F6 (blue), G=#8B5CF6 (purple)
- Font: Inter (system fallback: Helvetica Neue, Arial)
- Multi-page layout with consistent headers/footers

**Page Structure:**
1. Cover page (client name, date, summary scores)
2. E/S/G breakdown page (detailed pillar scores)
3. Holdings analysis page (top positions by impact)
4. Comparison page (if applicable)

### PDF Export

HTML is converted to PDF using browser print or a PDF library:

```typescript
// Example: Puppeteer PDF generation
const pdf = await page.pdf({
  width: '1000px',
  height: '700px',
  printBackground: true,
  margin: { top: 0, bottom: 0, left: 0, right: 0 }
});
```

---

## Part 6: Aggregation Strategy

### Recommended Approach

**Primary Level:** Client Relationship (Level 1)
- Advisors think in terms of client relationships
- Matches Addepar's Group structure
- Appropriate for quarterly reviews

**Optional Drill-Down:** Legal Entity (Level 2)
- For clients who want per-entity analysis
- Useful for trust vs. personal account comparisons

### Weighted Average Calculation

```typescript
function calculateWeightedESG(holdings: Holding[]): AggregateScores {
  let envSum = 0, socSum = 0, govSum = 0;
  let coveredValue = 0;

  for (const h of holdings) {
    if (h.esg) {
      envSum += h.value * h.esg.environmental.score;
      socSum += h.value * h.esg.social.score;
      govSum += h.value * h.esg.governance.score;
      coveredValue += h.value;
    }
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  return {
    environmental: coveredValue > 0 ? envSum / coveredValue : null,
    social: coveredValue > 0 ? socSum / coveredValue : null,
    governance: coveredValue > 0 ? govSum / coveredValue : null,
    coverage: totalValue > 0 ? coveredValue / totalValue : 0
  };
}
```

---

## Part 7: Environment Variables

```env
# .env.local (not committed)

# Addepar
ADP_TA_ID=182
ADP_TA_KEY=adprk_...
ADP_TA_SECRET=adprs_...
ADP_TA_URL=https://tiedemann.addepar.com

# Clarity AI
CLARITY_API_KEY=...
CLARITY_API_SECRET=...
CLARITY_API_BASE_URL=https://api.clarity.ai/clarity/v1
```

---

## Part 8: Error Handling

| Source | Code | Meaning | Action |
|--------|------|---------|--------|
| Addepar | 401 | Invalid credentials | Check API key/secret |
| Addepar | 403 | No firm access | Verify Addepar-Firm header |
| Addepar | 404 | Entity not found | Check entity ID |
| Clarity | 401 | Expired token | Refresh OAuth token |
| Clarity | 403 | No permission | Contact Clarity for access |
| Clarity | 202 | Job still processing | Continue polling |
| Clarity | 422 | Job failed | Retry submission |

---

## Part 9: Batch Refresh Schedule

| Task | Frequency | Trigger |
|------|-----------|---------|
| Full client hierarchy | Weekly (Sunday) | Cron job |
| Security ESG scores | Weekly (Monday) | After hierarchy refresh |
| On-demand client analysis | Real-time | User request |
| Report generation | Real-time | User request |

---

## Part 10: Key Discoveries (December 2025)

### Addepar Value Discrepancy - SOLVED

**Problem:** Raw portfolio queries returned $101M for Taylor Family, but Addepar UI showed $92M.

**Solution:** Use Portfolio View API with **View ID 322127** ("Addepar - Portfolio Details"). This view has `hide_previous_holdings: true` which filters terminated positions.

### Clarity AI Coverage - CONFIRMED

From batch testing of AlTi's security universe:
- **ISINs:** 93.3% coverage (3,378 of 3,619 with scores)
- **CUSIPs:** 96.4% coverage (483 of 501 with scores)

### Recommended Data Pipeline

```
1. Get relationship GROUP IDs from hierarchy
2. For each GROUP: POST /portfolio/query with ISIN/CUSIP columns
   (View 322127 does NOT include ISINs - only tickers)
3. Extract ISIN/CUSIP + value per security
4. Batch lookup ESG scores via Clarity AI async API
5. Calculate value-weighted averages
```

### Pipeline Test Results (December 2025)

**Taylor Family (GROUP 6035):**
- Portfolio Value: $105.2M
- ESG Coverage: **67.9%** ($71.4M matched)
- Environmental: 65.7 / 100
- Social: 57.5 / 100
- Governance: 78.5 / 100
- **Overall ESG: 67.2 / 100**

**Match Strategy (ISIN + CUSIP fallback):**
- Matched by ISIN: 1,066 holdings
- Matched by CUSIP: 226 holdings (fallback when ISIN fails)
- Unmatched: 200 holdings (~32% - mostly muni bonds)

**Coverage gaps:**
- Municipal bonds (not in Clarity AI universe)
- Some ETFs (e.g., Akre Focus ETF, iShares Gold Trust)
- ~32% of AUM in non-ESG-scorable assets

### Known Limitations

| Issue | Workaround |
|-------|------------|
| Cannot batch GROUP IDs | Query each relationship individually |
| Addepar rate limit (50/15min) | Use Jobs API for bulk, View API for real-time |
| ~7% ISINs without ESG | Report as "uncovered" in weighted avg |

---

## Appendix: Quick Reference

### Addepar API Call (Portfolio View - RECOMMENDED)

```bash
# Get accurate holdings for a relationship
curl -X GET "https://tiedemann.addepar.com/api/v1/portfolio/views/322127/results?\
portfolio_id=6035&portfolio_type=GROUP&output_type=JSON&start_date=2025-12-10&end_date=2025-12-10" \
  -H "Authorization: Basic $(echo -n 'KEY:SECRET' | base64)" \
  -H "Addepar-Firm: 182" \
  -H "Content-Type: application/vnd.api+json"
```

### Addepar API Call (Entities)

```bash
curl -X GET "https://tiedemann.addepar.com/api/v1/entities?page[size]=10" \
  -H "Authorization: Basic $(echo -n 'KEY:SECRET' | base64)" \
  -H "Addepar-Firm: 182" \
  -H "Content-Type: application/vnd.api+json"
```

### Clarity AI API Call

```bash
# Get token
TOKEN=$(curl -s -X POST "https://api.clarity.ai/clarity/v1/oauth/token" \
  -H "Content-Type: application/json" \
  -d '{"key":"...","secret":"..."}' | jq -r '.token')

# Submit batch job
curl -X POST "https://api.clarity.ai/clarity/v1/public/securities/esg-risk/scores-by-id/async" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"securityIds":["US0378331005"],"securityIdsType":"ISIN","scoreIds":["ENVIRONMENTAL","SOCIAL","GOVERNANCE"]}'
```

---

**Last Updated:** December 10, 2025
