# Report Generation API Updates - Summary

## Changes Overview

Extended the report generation API to support multiple report types while maintaining backward compatibility.

## Modified Files

### 1. `/app/impact-analytics/api/reports/generate/route.ts`

**Changes:**
- Added `type` query parameter (`esg` | `impact-comparison`)
- Added `format` query parameter handling for both report types
- Implemented routing logic for different report types
- Updated both POST and GET handlers
- Maintained backward compatibility (defaults to ESG report)

**New Imports:**
```typescript
import {
  generateImpactComparisonPDF,
  generateImpactComparisonPreview,
  validateImpactComparisonData,
} from '@/lib/reports';
```

### 2. `/lib/reports/index.ts`

**Changes:**
- Added exports for impact comparison types and functions
- Re-exports from `impact-comparison-template.ts`

**New Exports:**
```typescript
// Types
export type {
  ImpactComparisonData,
  ImpactComparisonConfig,
} from './impact-comparison-template';

// Schemas and sample data
export {
  ImpactComparisonDataSchema,
  SAMPLE_IMPACT_COMPARISON_DATA,
} from './impact-comparison-template';

// Functions
export {
  generateImpactComparisonHTML,
  generateImpactComparisonPDF,
  generateImpactComparisonPreview,
  validateImpactComparisonData,
} from './impact-comparison-template';
```

## New Files

### 3. `/lib/reports/impact-comparison-template.ts`

**Purpose:** Template and logic for impact comparison reports

**Exports:**
- Types: `ImpactComparisonData`, `ImpactComparisonConfig`
- Schemas: `ImpactComparisonDataSchema`, `ImpactComparisonConfigSchema`
- Functions: `generateImpactComparisonHTML()`, `generateImpactComparisonPDF()`, `generateImpactComparisonPreview()`, `validateImpactComparisonData()`
- Sample data: `SAMPLE_IMPACT_COMPARISON_DATA`

**Status:** Placeholder implementation - needs full template development

### 4. `/lib/reports/IMPACT_COMPARISON_README.md`

Complete API documentation for the impact comparison feature.

### 5. `/test-impact-comparison-api.sh`

Test script to verify both ESG and impact comparison endpoints.

## API Usage

### ESG Report (Backward Compatible)

```bash
# POST - Generate ESG report
POST /api/reports/generate?format=pdf
Content-Type: application/json
{ "client_name": "...", "metrics": {...}, "benchmark": {...} }

# GET - Sample ESG report
GET /api/reports/generate?format=pdf
```

### Impact Comparison Report (New)

```bash
# POST - Generate impact comparison report
POST /api/reports/generate?type=impact-comparison&format=pdf
Content-Type: application/json
{ "client_name": "...", "comparison_data": {...} }

# GET - Sample impact comparison report
GET /api/reports/generate?type=impact-comparison&format=pdf
```

## Backward Compatibility

✅ All existing ESG report functionality works unchanged
✅ Default behavior (no `type` parameter) generates ESG reports
✅ No breaking changes to existing API contracts
✅ All ESG types and schemas remain the same

## Next Steps

To complete the impact comparison feature:

1. **Define Data Structure**
   - Specify comparison_data schema
   - Add scenario, time period, portfolio structures

2. **Implement Template**
   - Replace placeholder HTML in `generateImpactComparisonHTML()`
   - Add comparison-specific visualizations
   - Match AlTi design standards

3. **Add Charts**
   - Create comparison-specific SVG charts
   - Implement metric calculations
   - Add data transformations

4. **Testing**
   - Create comprehensive test data
   - Test PDF generation
   - Verify HTML preview

## Testing

```bash
# Build to verify TypeScript compilation
npm run build

# Start dev server
npm run dev

# Run test script (in another terminal)
./test-impact-comparison-api.sh
```

## Files Summary

| File | Type | Status |
|------|------|--------|
| `/app/impact-analytics/api/reports/generate/route.ts` | Modified | ✅ Complete |
| `/lib/reports/index.ts` | Modified | ✅ Complete |
| `/lib/reports/impact-comparison-template.ts` | New | ⚠️ Placeholder |
| `/lib/reports/IMPACT_COMPARISON_README.md` | New | ✅ Complete |
| `/test-impact-comparison-api.sh` | New | ✅ Complete |
| `/CHANGES_SUMMARY.md` | New | ✅ Complete |

## Build Status

✅ TypeScript compilation successful
✅ No breaking changes introduced
✅ All existing functionality preserved
