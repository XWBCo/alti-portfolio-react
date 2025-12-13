# Risk Contribution ReportBuilder - Data Integration Summary

## Overview
Connected the Risk Contribution ReportBuilder to actual risk analysis data from the FastAPI backend, enabling PowerPoint report generation with real portfolio metrics.

## Implementation Details

### 1. ReportBuilder Component (`/components/risk-contribution/ReportBuilder.tsx`)

#### Enhanced State Management
- Added `generateError` state for error feedback
- Added `generateSuccess` state for success feedback
- Improved user experience with clear status messages

#### Data Validation
```typescript
// Validate data availability before generating report
const hasData = contributions || diversification || performance || stressResults.length > 0;
if (!hasData) {
  throw new Error('No analysis data available. Please run the analysis first.');
}
```

#### Error Handling
- Comprehensive try-catch blocks in `handleGenerate()`
- User-friendly error messages
- Auto-close modal on success after 2 seconds
- Visual feedback with success/error indicators

#### UI Improvements
- Data availability warning banner when no data exists
- Enhanced metrics preview with 6 metrics (was 4)
- Added metric descriptions for clarity
- Better formatting for percentages and decimals
- Disabled state management for buttons during generation

### 2. PowerPoint Generator (`/lib/pptx-generator.ts`)

#### Robust Error Handling
```typescript
// Top-level error handling
try {
  // ... generation logic
  if (slidesAdded === 0) {
    throw new Error('No slides could be generated.');
  }
} catch (error) {
  throw new Error(`Failed to generate PowerPoint: ${error.message}`);
}
```

#### Data Formatting Functions
- `formatPercentage()`: Handles null/undefined/NaN/Infinity
- `formatDecimal()`: Validates numeric values before formatting
- All data transformations include null checks

#### Enhanced Metrics Slide
**Previous:** 4 metrics in 2x2 grid
**Current:** 6 metrics in 3x2 grid

New Metrics:
- Portfolio Volatility (annualized %)
- Diversification Ratio
- Sharpe Ratio
- Max Drawdown (%)
- CAGR (%)
- Weighted Average Correlation

Each metric includes:
- Label
- Value
- Description text

#### Improved Chart Slide
- Filters out NaN/Infinity values
- Shows top 10 risk contributors by PCTR
- Displays values on bars
- Better empty state messaging
- Sorted by risk contribution (descending)

#### Enhanced Stress Table Slide
- Added volatility column
- Better null handling for all fields
- Color-coded returns (red/green)
- Improved column layout
- Clear empty state message

#### Intelligent Summary Slide
Generates contextual insights:

**Volatility Assessment:**
- Low: < 10%
- Moderate: 10-15%
- Elevated: 15-20%
- High: > 20%

**Diversification Assessment:**
- Excellent: ratio ≥ 1.5
- Good: ratio ≥ 1.2
- Moderate: ratio ≥ 1.0
- Limited: ratio < 1.0

**Performance Quality (Sharpe Ratio):**
- Excellent: > 1.5
- Good: > 1.0
- Acceptable: > 0.5
- Poor: ≤ 0.5

**Stress Testing Summary:**
- Identifies worst-case scenario
- Identifies best-case scenario
- Provides percentage returns for context

#### File Naming
- Sanitizes special characters from title and date
- Format: `{Title}_{Date}.pptx`
- Example: `Risk_Contribution_Analysis_December_11_2025.pptx`

### 3. Data Flow

```
User clicks "Run Analysis"
        ↓
Frontend calls /api/risk (Next.js proxy)
        ↓
Proxy forwards to FastAPI service (port 8001)
        ↓
FastAPI returns:
- RiskContributionsResponse (PCTR, MCTR, volatility)
- DiversificationResponse (ratio, correlations)
- PerformanceStats (Sharpe, drawdown, CAGR)
- StressScenarioResult[] (historical scenarios)
        ↓
Data stored in React state
        ↓
User clicks "Export Report"
        ↓
ReportBuilder validates data
        ↓
pptx-generator creates PowerPoint
        ↓
Browser downloads .pptx file
```

### 4. Data Types Connected

#### RiskContributionsResponse
```typescript
{
  pctr: Record<string, number>;           // Percentage Contribution to Risk
  mctr: Record<string, number>;           // Marginal Contribution to Risk
  portfolio_vol: number;                   // Daily volatility
  portfolio_vol_annualized: number;       // Annualized volatility
}
```

#### DiversificationResponse
```typescript
{
  diversification_ratio: number;
  diversification_benefit_pct: number;
  weighted_avg_correlation: number;
  portfolio_vol_annualized: number;
  weighted_avg_vol_annualized: number;
}
```

#### PerformanceStats
```typescript
{
  cagr: number;                           // Compound annual growth rate
  volatility: number;
  sharpe: number;                         // Risk-adjusted returns
  max_drawdown: number;                   // Peak-to-trough decline
  total_return: number;
}
```

#### StressScenarioResult
```typescript
{
  scenario: string;                       // e.g., "GFC (June 2008–Feb 2009)"
  portfolio_return: number;
  benchmark_return?: number;
  max_drawdown: number;
  volatility: number;
  start_date: string;
  end_date: string;
}
```

### 5. Error Handling Strategy

**Client-Side Validation:**
- Check for empty data before generation
- Validate slide selection (at least one)
- Display warnings for missing data

**Generation-Level:**
- Try-catch per slide (continues on individual failures)
- Overall try-catch for catastrophic failures
- Detailed error messages to user

**Data-Level:**
- NaN/Infinity checks in all formatters
- Null/undefined guards
- Fallback to "N/A" for missing values

### 6. User Experience Enhancements

**Before Generation:**
- Yellow warning banner if no data available
- Disabled export button if no slides selected
- Preview shows actual data or placeholder messages

**During Generation:**
- Loading spinner in button
- Disabled cancel button
- "Generating..." status text

**After Success:**
- Green success message with checkmark
- Auto-close after 2 seconds
- Button changes to "Close"

**On Error:**
- Red error message with details
- User can retry or cancel
- Error persists until next attempt

### 7. Key Features

✅ **Data Connectivity:**
- Full integration with FastAPI risk service
- All API response types mapped and formatted
- Real-time data in previews

✅ **Report Quality:**
- Professional PowerPoint with AlTi branding
- Contextual insights based on data thresholds
- Color-coded metrics (red for negative, green for positive)
- Comprehensive metrics coverage

✅ **Reliability:**
- Graceful degradation with missing data
- Robust error handling at multiple levels
- Data validation before processing

✅ **User Experience:**
- Clear feedback at every step
- Preview before generation
- Customizable report configuration
- Fast generation with async processing

## Testing Checklist

- [ ] Generate report with full data (all analysis run)
- [ ] Generate report with partial data (some metrics missing)
- [ ] Generate report with no data (should show validation error)
- [ ] Test with different portfolios (varying asset counts)
- [ ] Test with stress scenarios enabled/disabled
- [ ] Verify all slides render correctly in PowerPoint
- [ ] Check PCTR chart with 10+ assets
- [ ] Check stress table with 8+ scenarios
- [ ] Verify file download works
- [ ] Test error recovery (close/reopen modal)

## Files Modified

1. `/components/risk-contribution/ReportBuilder.tsx`
   - Enhanced error handling
   - Improved UI feedback
   - Better data validation
   - Updated preview components

2. `/lib/pptx-generator.ts`
   - Comprehensive error handling
   - Enhanced data formatting
   - Improved slide content
   - Better null safety

## API Integration Points

- **Full Analysis:** `/api/risk` → `POST {endpoint: 'full-analysis'}`
- **Tracking Error:** `/api/risk` → `POST {endpoint: 'tracking-error'}`
- **Stress Scenarios:** `/api/risk` → `POST {endpoint: 'stress-scenarios'}`

Backend service: FastAPI on `http://localhost:8001`

## Dependencies

- `pptxgenjs` - PowerPoint generation library
- `motion/react` - Animation library for UI
- `lucide-react` - Icon library

## Future Enhancements

1. **PDF Export Option**
   - Alternative format for reports
   - Better for email distribution

2. **Customizable Slides**
   - Allow users to reorder slides
   - Add custom text slides
   - Include custom charts

3. **Templates**
   - Save report configurations
   - Quick templates (executive, detailed, etc.)

4. **Batch Export**
   - Generate reports for multiple portfolios
   - Compare portfolios side-by-side

5. **Email Integration**
   - Send reports directly from app
   - Schedule automated reports

## Notes

- All data formatting includes NaN/Infinity checks
- PowerPoint uses AlTi brand colors consistently
- File naming is sanitized to prevent filesystem issues
- Slide generation continues even if individual slides fail
- Preview accurately reflects generated PowerPoint content
