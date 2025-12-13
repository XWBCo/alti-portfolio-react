# ESG Data Pipeline Strategy

## Objective
Efficiently retrieve weighted-average ESG scores for all client/relationship portfolios and their level 2 accounts/entities into a queryable database.

---

## Recommended Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Addepar      │────▶│   ETL Pipeline   │────▶│    Database     │
│  (Holdings +    │     │   (Python/Node)  │     │  (PostgreSQL/   │
│   Values)       │     │                  │     │   DuckDB)       │
└─────────────────┘     └────────┬─────────┘     └────────┬────────┘
                                 │                        │
┌─────────────────┐              │                        │
│   Clarity AI    │──────────────┘                        │
│  (ESG Scores)   │                                       ▼
└─────────────────┘                              ┌─────────────────┐
                                                 │   Query API     │
                                                 │  (FastAPI/Next) │
                                                 └─────────────────┘
```

---

## Data Model

### Tables

```sql
-- Relationships (Level 1)
CREATE TABLE relationships (
    id SERIAL PRIMARY KEY,
    addepar_group_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    total_value DECIMAL(18,2),
    weighted_esg_score DECIMAL(5,2),
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Entities (Level 2)
CREATE TABLE entities (
    id SERIAL PRIMARY KEY,
    addepar_entity_id INTEGER UNIQUE NOT NULL,
    relationship_id INTEGER REFERENCES relationships(id),
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50),
    total_value DECIMAL(18,2),
    weighted_esg_score DECIMAL(5,2)
);

-- Holdings (Level 3 - Securities)
CREATE TABLE holdings (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES entities(id),
    security_name VARCHAR(255),
    isin VARCHAR(12),
    cusip VARCHAR(9),
    ticker VARCHAR(20),
    value DECIMAL(18,2),
    weight DECIMAL(8,6),  -- % of entity
    esg_score DECIMAL(5,2),
    last_updated TIMESTAMP DEFAULT NOW()
);

-- ESG Scores lookup table (cached from Clarity AI)
CREATE TABLE esg_scores (
    id SERIAL PRIMARY KEY,
    isin VARCHAR(12),
    cusip VARCHAR(9),
    company_name VARCHAR(255),
    overall_score DECIMAL(5,2),
    environmental_score DECIMAL(5,2),
    social_score DECIMAL(5,2),
    governance_score DECIMAL(5,2),
    carbon_intensity DECIMAL(12,2),
    last_fetched TIMESTAMP DEFAULT NOW(),
    UNIQUE(isin),
    UNIQUE(cusip)
);

-- Indexes for fast lookups
CREATE INDEX idx_holdings_isin ON holdings(isin);
CREATE INDEX idx_holdings_cusip ON holdings(cusip);
CREATE INDEX idx_esg_isin ON esg_scores(isin);
CREATE INDEX idx_esg_cusip ON esg_scores(cusip);
```

---

## ETL Pipeline Strategy

### Phase 1: Extract Holdings from Addepar (Most Efficient Approach)

**Option A: Portfolio View API (RECOMMENDED)**
- Use view ID `322127` ("Addepar - Portfolio Details") for accurate values
- Query each relationship group individually
- Rate limit: 50 req/15min, 1000/24hr

```python
# Pseudo-code for extraction
for relationship in relationships:
    data = addepar.get(f"/portfolio/views/322127/results", params={
        "portfolio_id": relationship.group_id,
        "portfolio_type": "GROUP",
        "output_type": "JSON",
        "start_date": today,
        "end_date": today
    })
    # Parse nested JSON structure for holdings
```

**Option B: Jobs API for Large Batches**
- Submit async jobs for each relationship
- Poll for completion
- Download results
- Better for full firm exports (avoids rate limits)

### Phase 2: Extract ESG Scores from Clarity AI

**Batch by unique identifiers:**
1. Collect all unique ISINs + CUSIPs from holdings
2. Submit to Clarity AI in batches (max ~500 per request)
3. Cache results in `esg_scores` table

```python
# Clarity AI batch request
unique_isins = db.query("SELECT DISTINCT isin FROM holdings WHERE isin IS NOT NULL")
unique_cusips = db.query("SELECT DISTINCT cusip FROM holdings WHERE cusip IS NOT NULL AND isin IS NULL")

# Submit job
job = clarity.submit_job({
    "identifierType": "ISIN",  # or "CUSIP"
    "identifiers": unique_isins,
    "outputType": "ESG_SCORES"
})
```

### Phase 3: Calculate Weighted Averages

```sql
-- Update entity weighted scores
UPDATE entities e
SET weighted_esg_score = (
    SELECT SUM(h.value * COALESCE(es.overall_score, 0)) / NULLIF(SUM(h.value), 0)
    FROM holdings h
    LEFT JOIN esg_scores es ON h.isin = es.isin OR h.cusip = es.cusip
    WHERE h.entity_id = e.id
);

-- Update relationship weighted scores
UPDATE relationships r
SET weighted_esg_score = (
    SELECT SUM(e.total_value * COALESCE(e.weighted_esg_score, 0)) / NULLIF(SUM(e.total_value), 0)
    FROM entities e
    WHERE e.relationship_id = r.id
);
```

---

## Optimal Refresh Strategy

### Daily Incremental
```
6:00 AM - Refresh holdings data from Addepar (all relationships)
6:30 AM - Check for new securities without ESG scores
6:45 AM - Fetch missing ESG scores from Clarity AI
7:00 AM - Recalculate weighted averages
```

### Weekly Full Refresh
- Full re-fetch of all ESG scores (scores can change)
- Validate data integrity
- Archive historical snapshots

---

## API Rate Limit Management

### Addepar
| Limit | Value |
|-------|-------|
| 15-minute window | 50 requests |
| 24-hour window | 1000 requests |
| Max runtime | 60 seconds |

**Strategy for ~400 relationships:**
- Use Jobs API (async) for bulk exports
- Batch 40 jobs at a time, wait for completion
- Total time: ~30-60 minutes for full refresh

### Clarity AI
| Limit | Value |
|-------|-------|
| Batch size | ~500 identifiers |
| Job timeout | Varies |

**Strategy:**
- Cache ESG scores (they don't change daily)
- Only fetch scores for new securities
- Full refresh weekly

---

## Implementation Priority

### MVP (Week 1)
1. Create database schema
2. Build Addepar extractor using View API
3. Store holdings with ISIN/CUSIP
4. Manual Clarity AI lookup for ESG scores
5. Calculate weighted averages

### Phase 2 (Week 2-3)
1. Automate Clarity AI integration
2. Build refresh scheduler
3. Add historical tracking
4. Create REST API for queries

### Phase 3 (Week 4+)
1. Real-time dashboard
2. Drill-down capabilities
3. Export functionality
4. Benchmark comparisons

---

## Key Discoveries from Testing

1. **Addepar View 322127** returns accurate values matching front-end ($92M for Taylor vs $101M from raw query)

2. **Critical setting**: `hide_previous_holdings: true` filters out terminated positions

3. **Jobs API limitation**: Cannot batch multiple GROUP IDs - must query each relationship individually

4. **Hierarchy structure**:
   - Level 1: Relationship (GROUP)
   - Level 2: Entities (accounts, trusts, etc.)
   - Level 3: Securities (with ISIN/CUSIP)

5. **Estimated data volume**:
   - ~400 active relationships
   - ~$20-25B total AUM
   - ~3,000-5,000 unique securities

---

## Sample Queries

### Get relationship ESG summary
```sql
SELECT
    r.name as relationship,
    r.total_value,
    r.weighted_esg_score,
    COUNT(DISTINCT e.id) as entity_count,
    COUNT(DISTINCT h.id) as holding_count
FROM relationships r
JOIN entities e ON e.relationship_id = r.id
JOIN holdings h ON h.entity_id = e.id
GROUP BY r.id
ORDER BY r.total_value DESC;
```

### Get holdings missing ESG scores
```sql
SELECT h.security_name, h.isin, h.cusip, SUM(h.value) as total_value
FROM holdings h
LEFT JOIN esg_scores es ON h.isin = es.isin OR h.cusip = es.cusip
WHERE es.id IS NULL
GROUP BY h.security_name, h.isin, h.cusip
ORDER BY total_value DESC;
```

### Get weighted ESG by asset class
```sql
SELECT
    h.asset_class,
    SUM(h.value) as total_value,
    SUM(h.value * es.overall_score) / SUM(h.value) as weighted_esg
FROM holdings h
JOIN esg_scores es ON h.isin = es.isin OR h.cusip = es.cusip
GROUP BY h.asset_class
ORDER BY weighted_esg DESC;
```
