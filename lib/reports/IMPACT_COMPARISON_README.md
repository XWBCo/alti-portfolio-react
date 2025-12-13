# Impact Comparison Report API

## Overview

The report generation API has been extended to support two types of reports:
1. **ESG Impact Report** (original functionality, backward compatible)
2. **Impact Comparison Report** (new functionality)

## API Endpoints

### POST `/api/reports/generate`

Generate a report as PDF or HTML preview.

**Query Parameters:**
- `type` (optional): Report type
  - `esg` (default) - Standard ESG impact report
  - `impact-comparison` - Impact comparison report
- `format` (optional): Output format
  - `pdf` (default) - PDF file
  - `html` - HTML preview

**Request Body:**

For ESG reports, use the standard `ReportData` structure (see existing documentation).

For impact comparison reports:
```typescript
{
  client_name: string;
  report_date?: string;  // ISO date string, defaults to today
  config?: {
    reportYear?: number;
    includeCharts?: boolean;
    includeMetrics?: boolean;
  };
  comparison_data?: Record<string, unknown>;  // Custom comparison data
}
```

**Examples:**

```bash
# Generate ESG report (backward compatible)
curl -X POST "http://localhost:3000/impact-analytics/api/reports/generate" \
  -H "Content-Type: application/json" \
  -d '{ "client_name": "Test", "metrics": {...}, "benchmark": {...} }'

# Generate ESG report as HTML preview
curl -X POST "http://localhost:3000/impact-analytics/api/reports/generate?format=html" \
  -H "Content-Type: application/json" \
  -d '{ "client_name": "Test", "metrics": {...}, "benchmark": {...} }'

# Generate impact comparison report
curl -X POST "http://localhost:3000/impact-analytics/api/reports/generate?type=impact-comparison" \
  -H "Content-Type: application/json" \
  -d '{ "client_name": "Test Comparison", "comparison_data": {} }'

# Generate impact comparison HTML preview
curl -X POST "http://localhost:3000/impact-analytics/api/reports/generate?type=impact-comparison&format=html" \
  -H "Content-Type: application/json" \
  -d '{ "client_name": "Test Comparison", "comparison_data": {} }'
```

### GET `/api/reports/generate`

Generate a sample report for testing.

**Query Parameters:**
- `type` (optional): Report type
  - `esg` (default) - Standard ESG impact report
  - `impact-comparison` - Impact comparison report
- `format` (optional): Output format
  - `pdf` (default) - PDF file
  - `html` - HTML preview

**Examples:**

```bash
# Get sample ESG report
curl "http://localhost:3000/impact-analytics/api/reports/generate"

# Get sample ESG report as HTML
curl "http://localhost:3000/impact-analytics/api/reports/generate?format=html"

# Get sample impact comparison report
curl "http://localhost:3000/impact-analytics/api/reports/generate?type=impact-comparison"

# Get sample impact comparison HTML
curl "http://localhost:3000/impact-analytics/api/reports/generate?type=impact-comparison&format=html"
```

## Response Headers

All successful PDF responses include:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="..."`
- `X-Generated-At: <ISO timestamp>`
- `X-Page-Count: <number>`

All successful HTML responses include:
- `Content-Type: text/html; charset=utf-8`

## Error Responses

**400 Bad Request** - Invalid data structure
```json
{
  "error": "Invalid report data",
  "details": "Validation error details"
}
```

**500 Internal Server Error** - Report generation failed
```json
{
  "error": "Failed to generate report",
  "details": "Error details"
}
```

## Implementation Files

### Updated Files

1. **`/app/impact-analytics/api/reports/generate/route.ts`**
   - Added `type` query parameter support
   - Routes to appropriate report generator based on type
   - Maintains backward compatibility (defaults to ESG report)

2. **`/lib/reports/index.ts`**
   - Exports new impact comparison functions and types
   - Re-exports from `impact-comparison-template.ts`

### New Files

3. **`/lib/reports/impact-comparison-template.ts`**
   - Contains impact comparison report template
   - Defines `ImpactComparisonData` and `ImpactComparisonConfig` types
   - Implements `generateImpactComparisonHTML()` function
   - Implements `generateImpactComparisonPDF()` function
   - Implements `validateImpactComparisonData()` function
   - Contains `SAMPLE_IMPACT_COMPARISON_DATA` for testing

## Backward Compatibility

All existing ESG report functionality remains unchanged:

- Default behavior (no `type` parameter) generates ESG reports
- Existing API calls continue to work without modifications
- All ESG report types and schemas are unchanged

## TODO: Template Implementation

The impact comparison template (`impact-comparison-template.ts`) currently contains a placeholder implementation.

To complete the implementation:

1. **Define Comparison Data Structure**
   - Update `ImpactComparisonDataSchema` with specific comparison fields
   - Add schemas for scenarios, time periods, portfolios, etc.

2. **Implement Template**
   - Replace placeholder HTML in `generateImpactComparisonHTML()`
   - Add comparison visualizations (charts, tables, metrics)
   - Implement styling to match AlTi design standards

3. **Add Chart Generation**
   - Create comparison-specific SVG charts
   - Implement comparison metrics calculations
   - Add data transformation logic

4. **Update Sample Data**
   - Create realistic sample comparison data
   - Add multiple scenarios/time periods for testing

## Testing

A test script is available: `test-impact-comparison-api.sh`

```bash
# Start the development server
npm run dev

# In another terminal, run the test script
./test-impact-comparison-api.sh
```

## Integration Example

```typescript
// Frontend usage example
async function generateImpactComparisonReport(data: ImpactComparisonData) {
  const response = await fetch(
    '/impact-analytics/api/reports/generate?type=impact-comparison&format=pdf',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details);
  }

  // Download PDF
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `impact-comparison-${data.client_name}.pdf`;
  a.click();
}
```

## Architecture Notes

The impact comparison report follows the same architectural pattern as the ESG report:

1. **Data Validation** - Zod schemas validate input data
2. **Template Generation** - HTML template with embedded data
3. **PDF Conversion** - Playwright converts HTML to PDF
4. **Browser Management** - Singleton browser instance for performance

This ensures consistency across all report types and maintains the same performance characteristics.
