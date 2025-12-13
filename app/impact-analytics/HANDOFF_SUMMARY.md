# Impact Analytics - Handoff Summary
*December 10, 2025*

## What Was Accomplished

### 1. Addepar API Discovery
- Found **Portfolio View API** - the correct way to get accurate holdings data
- **View ID 322127** ("Addepar - Portfolio Details") returns values matching front-end
- Taylor Family: $92,250,841 (matches UI) vs $101M from raw query
- Key setting: `hide_previous_holdings: true` filters terminated positions

### 2. Key Views Identified
| View ID | Name | Purpose |
|---------|------|---------|
| **322127** | Addepar - Portfolio Details | Accurate $ values |
| 555529 | ALTI - Impact Report View | ESG/Impact attributes |
| 555527 | ALTI - Impact Attributes | Impact data columns |

### 3. Data Structure Confirmed
```
Relationship (GROUP) → Entity (Account/Trust) → Security (ISIN/CUSIP + Value)
```

### 4. Rate Limits
- Addepar: 50 req/15min, 1000/24hr
- Must query each relationship individually (no batching GROUPs)

---

## Files Created

1. **ADDEPAR_API_REFERENCE.md** - Full API documentation with working examples
2. **ESG_DATA_PIPELINE_STRATEGY.md** - Database schema + ETL pipeline design

---

## Recommended Next Steps

### Immediate (MVP)
1. Create database with schema from strategy doc
2. Build extractor using View 322127 for all ~400 relationships
3. Collect unique ISINs/CUSIPs → send to Clarity AI
4. Calculate value-weighted ESG scores

### API Calls Needed for Full Export
```python
# For each relationship group_id:
GET /portfolio/views/322127/results?portfolio_id={group_id}&portfolio_type=GROUP&output_type=JSON&start_date=2025-12-10&end_date=2025-12-10
```

---

## Quick Reference

**Addepar Auth:**
```python
headers = {
    "Authorization": f"Basic {base64(KEY:SECRET)}",
    "Addepar-Firm": "182",
    "Content-Type": "application/vnd.api+json"
}
```

**Clarity AI:** Accepts ISIN or CUSIP batches, returns ESG scores (async job model)

---

## Outstanding Questions
- Need full list of active relationship group IDs (from hierarchy file or Groups API)
- Clarity AI coverage rate for your securities (~60-80% typical)
