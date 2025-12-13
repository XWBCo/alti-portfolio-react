# Impact Comparison Report - Quick Reference

## API Endpoints

### Generate Impact Comparison Report

**Endpoint:** `POST /impact-analytics/api/reports/generate`

**Query Params:**
```
?type=impact-comparison&format=pdf     # PDF (default)
?type=impact-comparison&format=html    # HTML preview
```

**Request Body:**
```json
{
  "client_name": "Portfolio Comparison Q4 2024",
  "report_date": "2024-12-12",
  "config": {
    "reportYear": 2024,
    "includeCharts": true,
    "includeMetrics": true
  },
  "comparison_data": {
    // Your comparison data here
  }
}
```

**Response:**
- PDF: Binary file with headers
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="impact-comparison-....pdf"`
- HTML: HTML content for preview

### Get Sample Report

**Endpoint:** `GET /impact-analytics/api/reports/generate`

**Query Params:**
```
?type=impact-comparison&format=pdf     # Sample PDF
?type=impact-comparison&format=html    # Sample HTML
```

## TypeScript Usage

```typescript
import type { ImpactComparisonData } from '@/lib/reports';

const data: ImpactComparisonData = {
  client_name: "Portfolio Comparison",
  report_date: new Date().toISOString().split('T')[0],
  config: {
    reportYear: 2024,
    includeCharts: true,
    includeMetrics: true,
  },
  comparison_data: {
    // Your data
  },
};

// Generate PDF
const response = await fetch(
  '/impact-analytics/api/reports/generate?type=impact-comparison',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
);

const blob = await response.blob();
// Download or display PDF
```

## Curl Examples

```bash
# Generate PDF
curl -X POST \
  "http://localhost:3000/impact-analytics/api/reports/generate?type=impact-comparison" \
  -H "Content-Type: application/json" \
  -d '{"client_name":"Test","comparison_data":{}}' \
  --output report.pdf

# Preview HTML
curl -X POST \
  "http://localhost:3000/impact-analytics/api/reports/generate?type=impact-comparison&format=html" \
  -H "Content-Type: application/json" \
  -d '{"client_name":"Test","comparison_data":{}}' \
  > preview.html

# Get sample PDF
curl "http://localhost:3000/impact-analytics/api/reports/generate?type=impact-comparison" \
  --output sample.pdf
```

## Key Files

| File | Purpose |
|------|---------|
| `/app/impact-analytics/api/reports/generate/route.ts` | API route handler |
| `/lib/reports/impact-comparison-template.ts` | Template & PDF generation |
| `/lib/reports/index.ts` | Public exports |
| `/lib/reports/IMPACT_COMPARISON_README.md` | Full documentation |

## Data Structure

```typescript
interface ImpactComparisonData {
  client_name: string;
  report_date?: string;  // ISO date
  config?: {
    reportYear?: number;
    includeCharts?: boolean;
    includeMetrics?: boolean;
  };
  comparison_data?: Record<string, unknown>;
}
```

## Backward Compatibility

ESG reports continue to work without changes:

```bash
# ESG report (no type param)
POST /api/reports/generate
GET /api/reports/generate

# Or explicitly
POST /api/reports/generate?type=esg
GET /api/reports/generate?type=esg
```

## Error Handling

```typescript
try {
  const response = await fetch(...);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details);
  }

  // Success
} catch (error) {
  console.error('Report generation failed:', error);
}
```

## Development Status

- ✅ API routing complete
- ✅ TypeScript types defined
- ✅ Backward compatibility maintained
- ⚠️ Template needs full implementation
- ⚠️ Comparison data structure needs definition
- ⚠️ Charts and visualizations need implementation

## Next: Implement Template

Edit `/lib/reports/impact-comparison-template.ts`:

1. Define `comparison_data` structure in schema
2. Replace placeholder HTML in `generateImpactComparisonHTML()`
3. Add comparison charts (SVG or canvas)
4. Style to match AlTi design system
5. Update `SAMPLE_IMPACT_COMPARISON_DATA` with realistic data
