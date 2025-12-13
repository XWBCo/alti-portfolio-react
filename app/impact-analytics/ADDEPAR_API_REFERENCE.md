# Addepar API Reference

## Base URL
```
https://tiedemann.addepar.com/api/v1
```

## Authentication
Basic Auth with API Key/Secret + Firm ID header:
```python
auth_string = base64.b64encode(f"{API_KEY}:{API_SECRET}".encode()).decode()
headers = {
    "Authorization": f"Basic {auth_string}",
    "Addepar-Firm": FIRM_ID,
    "Content-Type": "application/vnd.api+json"
}
```

## Rate Limits
- 50 requests per 15-minute window
- 1000 requests per 24-hour window
- 60 second max runtime per request

---

## Key Endpoints for ESG Data Pipeline

### 1. Portfolio Views API (Recommended)

**Get list of views:**
```
GET /v1/portfolio/views
```

**Get view configuration:**
```
GET /v1/portfolio/views/:id
```

**Execute view query:**
```
GET /v1/portfolio/views/:id/results
```

**Required Parameters:**
| Parameter | Description | Example |
|-----------|-------------|---------|
| portfolio_id | Group or entity ID | 6035 |
| portfolio_type | ENTITY, GROUP, FIRM, etc. | GROUP |
| output_type | JSON, CSV, TSV, XLSX | JSON |
| start_date | YYYY-MM-DD | 2025-12-10 |
| end_date | YYYY-MM-DD | 2025-12-10 |

**Key Views Discovered:**
| View ID | Name | Use Case |
|---------|------|----------|
| 322127 | Addepar - Portfolio Details | Accurate $ values matching front-end (has `hide_previous_holdings: true`) |
| 555529 | ALTI - Impact Report View | Impact/ESG custom attributes |
| 552318 | AlTi - Impact View | Impact data |
| 555527 | ALTI - Impact Attributes | ESG attribute columns |

**Example - Get accurate holdings values:**
```python
params = {
    "portfolio_id": 6035,  # Group ID (e.g., Taylor Family)
    "portfolio_type": "GROUP",
    "output_type": "JSON",
    "start_date": "2025-12-10",
    "end_date": "2025-12-10"
}
resp = requests.get(f"{BASE_URL}/portfolio/views/322127/results", headers=headers, params=params)
# Returns $92,250,841.54 for Taylor (matches front-end)
```

---

### 2. Portfolio Query API (Direct queries without views)

```
POST /v1/portfolio/query
```

**Payload Structure:**
```json
{
  "data": {
    "type": "portfolio_query",
    "attributes": {
      "columns": [
        {"key": "value"},
        {"key": "isin"},
        {"key": "cusip"}
      ],
      "groupings": [
        {"key": "top_level_owner"},
        {"key": "top_level_legal_entity"},
        {"key": "security"}
      ],
      "filters": [
        {
          "attribute": "holding_status",
          "type": "discrete",
          "operator": "include",
          "values": ["Held"]
        }
      ],
      "portfolio_type": "GROUP",
      "portfolio_id": [6035],
      "start_date": "2025-12-10",
      "end_date": "2025-12-10",
      "hide_previous_holdings": true
    }
  }
}
```

**Key Optional Parameters:**
- `hide_previous_holdings: true` - Exclude terminated holdings (critical for matching front-end values)
- `filters` - Filter by holding_status, asset_class, etc.
- `look_through_composite_securities: true` - See underlying fund holdings

---

### 3. Jobs API (Async for large exports)

```
POST /v1/jobs          # Create job
GET /v1/jobs/:id       # Check status
GET /v1/jobs/:id/download  # Download results
```

**Portfolio Query Job:**
```json
{
  "data": {
    "type": "jobs",
    "attributes": {
      "job_type": "PORTFOLIO_QUERY",
      "parameters": {
        "portfolio_type": "group",
        "portfolio_id": 6035,
        "output_type": "JSON",
        "start_date": "2025-12-10",
        "end_date": "2025-12-10",
        "columns": [
          {"key": "top_level_owner"},
          {"key": "value"},
          {"key": "isin"},
          {"key": "cusip"}
        ],
        "groupings": [
          {"key": "top_level_owner"},
          {"key": "top_level_legal_entity"},
          {"key": "security"}
        ]
      }
    }
  }
}
```

**Job Status Values:**
- `Queued` - Not yet processed
- `In Progress` - Currently running
- `Completed` - Results ready (24hr expiry)
- `Failed` / `Error Cancelled` - Check errors field

---

### 4. Groups API (Get relationship hierarchy)

```
GET /v1/groups                    # List all groups
GET /v1/groups/:id               # Get specific group
GET /v1/groups/:id/children      # Get group members
```

**Hierarchy Sample** (from `/tmp/addepar_hierarchy_sample.json`):
```
Level 1: Relationship (Group)
  └── Level 2: Entities (HOLDING_COMPANY, PERSON_NODE, FUND)
        └── Level 3+: Securities/Holdings
```

---

### 5. Entities API

```
GET /v1/entities                 # List all entities
GET /v1/entities/:id            # Get specific entity
```

**Filter Parameters:**
- `filter[model_types]=TRUST,FINANCIAL_ACCOUNT`
- `filter[created_after]=2023-01-01`
- `fields[entities]=model_type,original_name` (limit returned fields)

---

### 6. Attributes API

```
GET /v1/attributes               # List all attributes
GET /v1/attributes/:id          # Get attribute details
POST /v1/attributes/query       # Query multiple attributes
```

**Key Custom Attributes Found:**
| API Field Name | Display Name | Use |
|----------------|--------------|-----|
| `_custom_terminated_status_498688` | Terminated Status | Filter terminated accounts |
| `_custom_bi_open_status_1524720` | BI Open Status | Open/closed filter |
| `_custom_managednonmanaged_825072` | Managed/Non-Managed | Filter managed accounts |
| `_custom_bi_billable_status_1459460` | BI Billable Status | Billable accounts |
| `_custom_impact_approach_411304` | Impact Approach | ESG/Impact classification |
| `_custom_theme_411305` | Theme | Impact theme |
| `_custom_carbon_intensity_number_output_395709` | Carbon Intensity | ESG metric |
| `_custom_sustainable_development_goals_462597` | SDGs | UN SDG alignment |

---

## Working Code Examples

### Get Holdings with Accurate Values (Using View 322127)
```python
import requests
import base64

BASE_URL = "https://tiedemann.addepar.com/api/v1"
auth = base64.b64encode(f"{KEY}:{SECRET}".encode()).decode()
headers = {
    "Authorization": f"Basic {auth}",
    "Addepar-Firm": "182",
    "Content-Type": "application/vnd.api+json"
}

# Query Taylor Family using Portfolio Details view
params = {
    "portfolio_id": 6035,
    "portfolio_type": "GROUP",
    "output_type": "JSON",
    "start_date": "2025-12-10",
    "end_date": "2025-12-10"
}

resp = requests.get(f"{BASE_URL}/portfolio/views/322127/results",
                    headers=headers, params=params)
data = resp.json()

# Total value in data['data']['attributes']['total']['columns']['value_2']
```

### Batch Export Multiple Relationships via Jobs API
```python
def create_job(group_id):
    payload = {
        "data": {
            "type": "jobs",
            "attributes": {
                "job_type": "PORTFOLIO_QUERY",
                "parameters": {
                    "portfolio_type": "group",
                    "portfolio_id": group_id,
                    "output_type": "JSON",
                    "start_date": "2025-12-10",
                    "end_date": "2025-12-10",
                    "columns": [
                        {"key": "top_level_owner"},
                        {"key": "top_level_legal_entity"},
                        {"key": "value"},
                        {"key": "isin"},
                        {"key": "cusip"}
                    ],
                    "groupings": [
                        {"key": "top_level_owner"},
                        {"key": "top_level_legal_entity"},
                        {"key": "security"}
                    ]
                }
            }
        }
    }
    resp = requests.post(f"{BASE_URL}/jobs", headers=headers, json=payload)
    return resp.json()['data']['id']

def check_job(job_id):
    resp = requests.get(f"{BASE_URL}/jobs/{job_id}", headers=headers)
    return resp.json()['data']['attributes']['status']

def download_job(job_id):
    resp = requests.get(f"{BASE_URL}/jobs/{job_id}/download", headers=headers)
    return resp.json()
```

---

## Key Findings

1. **Value Discrepancy Solved**: Use view ID `322127` (Addepar - Portfolio Details) to get values matching the front-end. It has `hide_previous_holdings: true`.

2. **IMPORTANT: View 322127 does NOT include ISINs** - only ticker symbols. For ESG pipeline, use **Portfolio Query API** with explicit ISIN/CUSIP columns.

3. **Jobs API Limitation**: Cannot batch multiple GROUP IDs in one query - must query each relationship individually.

4. **Portfolio Types**:
   - `GROUP` - Family relationships (recommended)
   - `ENTITY` - Individual accounts
   - `FIRM` - Firm-wide (requires portfolio_id=1)

5. **Output for ESG Pipeline**: Need ISIN/CUSIP + value at security level to:
   - Send identifiers to Clarity AI for ESG scores
   - Calculate value-weighted ESG scores per portfolio

### API Selection Guide

| Use Case | API | Notes |
|----------|-----|-------|
| Accurate $ values | View 322127 | Matches UI, but no ISINs |
| ESG Pipeline (ISINs needed) | Portfolio Query API | Include `isin`, `cusip` columns |
| Large batch exports | Jobs API | Async processing |

### Pipeline Test Results (Taylor Family)

```
ESG Coverage: 67.9% ($71.4M of $105.2M)
Environmental: 65.7 | Social: 57.5 | Governance: 78.5
Overall ESG: 67.2 / 100

Match breakdown:
  - By ISIN: 1,066 holdings
  - By CUSIP (fallback): 226 holdings
  - Unmatched: 200 (mostly muni bonds)
```
