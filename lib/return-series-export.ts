/**
 * Return Series Export Utility
 * Generates CSV files with historical return series data
 */

import { RETURN_SERIES_ASSETS, type ReturnSeriesAsset } from './beta-calculator';

// Extended monthly return series data (24 months)
// In production this would come from API; this is representative sample data
const MONTHLY_RETURNS: Record<ReturnSeriesAsset, number[]> = {
  'Absolute Return HFs': [0.88, -0.40, 0.45, 0.33, 0.21, 0.55, -0.12, 0.38, 0.67, -0.25, 0.42, 0.31, 0.52, -0.18, 0.38, 0.45, 0.28, 0.62, -0.22, 0.48, 0.35, -0.15, 0.55, 0.42],
  'Aggregate - Global': [0.48, 0.18, -0.10, 0.37, -0.22, 0.15, 0.28, -0.35, 0.12, 0.25, -0.18, 0.32, 0.22, -0.28, 0.18, 0.35, -0.15, 0.25, -0.32, 0.15, 0.28, -0.25, 0.22, 0.35],
  'Aggregate - US': [0.66, 0.10, -0.03, 0.57, -0.31, 0.22, 0.35, -0.42, 0.18, 0.33, -0.25, 0.41, 0.28, -0.18, 0.25, 0.48, -0.22, 0.35, -0.38, 0.22, 0.32, -0.28, 0.28, 0.42],
  'Asia Pacific ex Japan': [0.85, -1.36, 1.89, -1.90, 2.15, -0.85, 1.42, -1.65, 2.35, -1.12, 1.78, -0.95, 1.52, -1.85, 2.25, -0.75, 1.95, -1.45, 2.15, -0.95, 1.65, -1.25, 1.88, -0.85],
  'Cash - US': [0.14, 0.15, 0.15, 0.16, 0.16, 0.17, 0.17, 0.18, 0.18, 0.19, 0.19, 0.20, 0.20, 0.21, 0.21, 0.22, 0.22, 0.23, 0.23, 0.24, 0.24, 0.25, 0.25, 0.26],
  'Credit Directional HFs': [0.17, 0.24, 0.62, 0.00, 0.35, 0.48, -0.15, 0.52, 0.28, -0.08, 0.45, 0.22, 0.38, 0.15, 0.55, -0.12, 0.42, 0.28, 0.58, -0.18, 0.35, 0.48, 0.62, 0.25],
  'EM Debt': [-0.81, -1.49, 2.57, -2.32, 1.85, -0.95, 1.42, -1.78, 2.15, -1.25, 1.65, -0.88, 1.35, -1.55, 2.25, -0.75, 1.75, -1.15, 1.95, -0.95, 1.55, -1.35, 1.85, -0.65],
  'EM Equities': [-2.62, -4.54, 3.53, -3.77, 4.25, -2.15, 3.12, -3.45, 4.85, -2.85, 3.75, -2.42, 2.95, -3.25, 4.15, -1.95, 3.55, -2.75, 4.45, -2.35, 3.25, -2.85, 3.95, -2.15],
  'General Commodities': [1.76, -4.25, -2.51, -1.98, 3.25, -2.85, 1.95, -3.15, 2.45, -1.75, 1.85, -2.35, 2.15, -3.45, 1.55, -2.65, 2.85, -1.95, 2.25, -2.75, 1.65, -2.15, 2.55, -1.85],
  'Global ACWI EAFE': [-1.89, -1.57, 2.85, -2.24, 3.15, -1.45, 2.35, -1.95, 3.55, -1.65, 2.78, -1.35, 2.55, -1.75, 3.25, -1.25, 2.95, -1.55, 3.45, -1.45, 2.65, -1.65, 3.15, -1.15],
  'Global Equities ACWI': [0.47, -0.58, 3.07, 0.70, 2.85, -0.35, 2.15, -0.65, 3.25, -0.25, 2.55, 0.15, 2.35, -0.45, 2.95, 0.25, 2.65, -0.15, 3.15, -0.35, 2.45, -0.25, 2.85, 0.35],
  'Gold': [-1.27, -3.53, -2.33, -2.04, 1.85, -2.45, 0.95, -1.85, 2.35, -1.45, 1.25, -0.95, 1.55, -2.15, 0.75, -1.65, 2.05, -1.25, 1.45, -1.75, 0.85, -1.35, 1.95, -0.75],
  'Govt Bonds - Global': [-0.94, -0.12, -0.76, -0.09, 0.35, -0.45, 0.25, -0.55, 0.45, -0.35, 0.15, -0.25, 0.28, -0.38, 0.18, -0.48, 0.38, -0.28, 0.22, -0.42, 0.32, -0.22, 0.25, -0.35],
  'Govt Bonds - US': [0.77, 0.23, -0.47, 0.75, -0.35, 0.55, 0.15, -0.45, 0.65, -0.25, 0.35, 0.45, 0.58, -0.32, 0.48, 0.68, -0.25, 0.42, 0.55, -0.38, 0.52, -0.18, 0.45, 0.55],
  'Growth Directional HFs': [1.87, -0.83, -0.01, 0.58, 1.25, -0.45, 0.85, -0.35, 1.45, -0.15, 0.95, 0.25, 1.15, -0.55, 0.75, 0.45, 1.35, -0.25, 1.05, -0.35, 0.85, 0.15, 1.25, 0.35],
  'High Yield': [0.05, 0.10, 1.68, 0.71, 1.35, -0.25, 0.95, -0.45, 1.55, -0.15, 1.05, 0.35, 0.85, 0.25, 1.45, -0.15, 1.15, -0.35, 1.25, 0.15, 0.95, -0.25, 1.35, 0.45],
  'HY Muni Bond': [1.63, 0.35, 0.36, 0.53, 0.85, -0.15, 0.65, -0.25, 0.95, -0.05, 0.75, 0.25, 0.68, 0.18, 0.88, -0.12, 0.78, -0.22, 0.85, 0.08, 0.72, -0.08, 0.82, 0.28],
  'IG Corp': [0.44, -0.34, 0.74, 0.54, -0.15, 0.45, 0.25, -0.35, 0.55, -0.15, 0.35, 0.45, 0.38, -0.25, 0.48, 0.42, -0.18, 0.52, 0.32, -0.28, 0.42, -0.12, 0.48, 0.38],
  'IG Muni Bond': [1.25, 0.14, 0.15, 0.16, -0.05, 0.25, 0.15, -0.15, 0.35, -0.05, 0.25, 0.15, 0.22, 0.08, 0.28, -0.02, 0.18, 0.12, 0.32, -0.08, 0.22, 0.05, 0.28, 0.18],
  'Illiquid RE': [2.26, 2.61, 0.46, 1.75, 1.85, 0.95, 1.45, 0.65, 1.95, 0.75, 1.55, 0.85, 1.72, 0.88, 1.65, 0.78, 1.88, 0.68, 1.58, 0.92, 1.75, 0.72, 1.68, 0.82],
  'Infrastructure': [4.08, -0.48, 2.34, 0.16, 2.45, -0.85, 1.75, -0.65, 2.85, -0.55, 1.95, 0.25, 2.25, -0.75, 1.55, 0.35, 2.65, -0.45, 1.85, -0.35, 2.35, 0.15, 1.75, 0.45],
  'Japan Equities': [-1.48, -2.30, 1.07, -0.53, 2.15, -1.25, 1.65, -1.05, 2.55, -0.95, 1.85, -0.65, 1.45, -1.35, 2.25, -0.45, 1.95, -1.15, 2.35, -0.85, 1.75, -0.95, 2.15, -0.55],
  'Pan Europe': [-2.65, -1.25, 3.67, -3.11, 3.85, -1.75, 2.95, -2.15, 4.25, -1.55, 3.15, -1.25, 2.75, -1.95, 3.55, -1.15, 3.35, -1.65, 3.85, -1.35, 2.95, -1.45, 3.45, -1.05],
  'PE': [1.68, 0.71, 2.34, 2.13, 2.45, 0.95, 1.85, 0.65, 2.75, 0.55, 2.05, 0.85, 1.95, 0.75, 2.55, 0.45, 2.35, 0.85, 2.15, 0.65, 1.95, 0.78, 2.45, 0.72],
  'Private Debt': [0.34, 0.61, 1.26, 0.93, 1.15, 0.45, 0.85, 0.35, 1.25, 0.25, 0.95, 0.55, 0.78, 0.48, 1.08, 0.38, 1.18, 0.28, 0.88, 0.52, 1.02, 0.42, 0.92, 0.58],
  'REITs - Global': [2.34, 2.39, 0.90, 1.58, 2.85, -0.45, 2.15, -0.95, 3.25, -0.35, 2.45, 0.15, 2.08, 0.32, 2.75, -0.65, 2.55, -0.25, 2.95, -0.55, 2.35, -0.15, 2.65, 0.25],
  'US Equities': [3.06, -0.04, 3.70, 3.19, 2.95, 0.25, 2.35, 0.05, 3.45, 0.15, 2.65, 0.55, 2.85, 0.35, 3.25, 0.45, 2.75, 0.65, 3.15, 0.25, 2.55, 0.45, 2.95, 0.75],
};

// Generate dates for the return series (last 24 months)
function generateDates(numMonths: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    dates.push(d.toISOString().slice(0, 7)); // YYYY-MM format
  }
  return dates;
}

/**
 * Generate CSV content for return series download
 */
export function getReturnSeriesCSV(): string {
  const dates = generateDates(24);

  // Header row
  const headers = ['Date', ...RETURN_SERIES_ASSETS];

  // Data rows
  const rows = dates.map((date, i) => {
    const values = RETURN_SERIES_ASSETS.map(asset => {
      const returns = MONTHLY_RETURNS[asset];
      return returns[i]?.toFixed(4) ?? '0.0000';
    });
    return [date, ...values];
  });

  // Combine into CSV
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

/**
 * Download return series as CSV file
 */
export function downloadReturnSeriesCSV(): void {
  const csvContent = getReturnSeriesCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `return_series_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Get return series data as structured object
 */
export function getReturnSeriesData(): { dates: string[]; assets: ReturnSeriesAsset[]; returns: Record<ReturnSeriesAsset, number[]> } {
  return {
    dates: generateDates(24),
    assets: [...RETURN_SERIES_ASSETS],
    returns: MONTHLY_RETURNS,
  };
}
