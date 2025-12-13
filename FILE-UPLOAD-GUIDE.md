# Portfolio File Upload Guide

## Overview

The Portfolio Evaluation page supports uploading custom portfolios via CSV or Excel files. The FileUpload component provides drag-and-drop functionality, comprehensive validation, and clear error messages.

## Supported File Formats

- **CSV** (.csv)
- **Excel** (.xlsx, .xls)

## File Format Requirements

### Column Structure

The file must have:
1. **ASSET CLASS column** (first column) - contains asset class names
2. **Portfolio columns** - one or more columns with numeric allocation values

### Example Format

```csv
ASSET CLASS,Conservative,Moderate,Aggressive
US EQUITY,20,40,60
US BONDS,60,40,20
INTERNATIONAL EQUITY,10,15,15
CASH,10,5,5
```

### Value Format

Allocation values can be specified as:
- **Percentages** (0-100): e.g., 20, 40, 60
- **Decimals** (0-1): e.g., 0.20, 0.40, 0.60

The component automatically detects and normalizes the format.

## Validation Rules

1. **Required Columns**: Must have ASSET CLASS column
2. **Numeric Data**: Portfolio columns must contain numeric values
3. **Allocation Sum**: Portfolio allocations must sum to ~100% (90-110% tolerance)
4. **Non-Empty**: Must have at least one data row
5. **Valid Assets**: Asset class names will be uppercased and trimmed

## Features

### Drag and Drop
- Drag CSV or Excel files directly onto the upload area
- Visual feedback during drag operations

### Error Handling
- Clear error messages for common issues:
  - Missing ASSET CLASS column
  - No numeric portfolio columns found
  - Invalid allocation sums
  - Unsupported file types
  - Empty portfolios

### Multiple Portfolios
- Upload files with multiple portfolio columns
- Each column becomes a separate portfolio
- Portfolios are added to the analysis cumulatively

### Metadata Column Filtering
The component automatically ignores non-portfolio columns like:
- RISK
- ALLOCATION
- TIER
- CLASS
- CATEGORY

## Usage

1. **Click to Upload**: Click the upload area to select a file
2. **Drag and Drop**: Drag a file onto the upload area
3. **Review**: Uploaded portfolios appear in the list below
4. **Analyze**: Run optimization to see portfolios on the efficient frontier

## Error Examples

### Missing ASSET Column
```
Error: Missing required column
Details: Could not find ASSET or ASSET CLASS column
```

### Invalid Allocation Sum
```
Error: Invalid allocation sum
Details: Portfolio "Conservative" allocations sum to 85.0% (expected 100%)
```

### No Portfolio Data
```
Error: No portfolio data found
Details: Could not find any numeric portfolio allocation columns
```

## Integration

### Component Location
- **Component**: `/components/portfolio-evaluation/FileUpload.tsx`
- **Used In**: `/components/portfolio-evaluation/ParameterPanel.tsx`
- **Page**: `/app/portfolio-evaluation/page.tsx`

### Props Interface
```typescript
interface FileUploadProps {
  onPortfoliosLoaded: (portfolios: PortfolioHoldings[]) => void;
  existingPortfolios: PortfolioHoldings[];
}
```

### Data Flow
1. File selected/dropped
2. Parse CSV/Excel file
3. Validate data structure
4. Normalize allocations (% to decimal if needed)
5. Call `onPortfoliosLoaded` with parsed portfolios
6. Portfolios displayed in PortfolioTable
7. Metrics calculated and shown on efficient frontier chart

## Dependencies

- **papaparse**: CSV parsing
- **xlsx**: Excel file parsing
- **lucide-react**: Icons

## Testing

Use the provided test file:
```
/Users/xavi_court/claude_code/alti-portfolio-react/test-portfolios.csv
```

This file contains three sample portfolios (Conservative, Moderate, Aggressive) with proper formatting.

## Best Practices

1. **Clean Data**: Ensure asset class names match CMA data
2. **Consistent Format**: Use either percentages OR decimals consistently
3. **Complete Allocations**: Ensure each portfolio sums to 100%
4. **Meaningful Names**: Use descriptive portfolio column names
5. **Test First**: Upload test file before client data

## Advanced Features

### Asset Class Mapping
- Asset class names are uppercased and trimmed
- Matches against CMA data asset classes
- Unknown assets are still included but may not have risk/return data

### Multiple File Uploads
- Files are added cumulatively
- Upload multiple files to combine different portfolios
- Duplicate prevention at portfolio universe level (not file upload)

### Format Help
The component displays expected format inline for user reference.
