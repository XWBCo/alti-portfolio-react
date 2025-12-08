import type { ThemeColors, ReportConfig } from '../types';
import { ALTI_BRAND, ALTI_LOGO_BASE64, ALTI_LOGO_WIDTH, ALTI_LOGO_HEIGHT } from '../branding';

// ============================================================================
// Shared Template Components for Financial Reports
// ============================================================================

// HTML escape utility to prevent XSS attacks
export function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DEFAULT_THEME: ThemeColors = {
  primary: ALTI_BRAND.colors.primary,
  secondary: ALTI_BRAND.colors.secondary,
  accent: ALTI_BRAND.colors.accent,
  positive: ALTI_BRAND.colors.positive,
  negative: ALTI_BRAND.colors.negative,
  neutral: ALTI_BRAND.colors.neutral,
  background: ALTI_BRAND.colors.background,
  text: ALTI_BRAND.colors.text,
};

// ============================================================================
// CSS STYLES
// ============================================================================

export function getBaseStyles(theme: Partial<ThemeColors> = {}): string {
  const colors = { ...DEFAULT_THEME, ...theme };

  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      @page {
        size: 11in 8.5in;
        margin: 0;
      }

      body {
        font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        font-size: 10px;
        line-height: 1.4;
        color: ${colors.text};
        background: ${colors.background};
      }

      .page {
        width: 11in;
        height: 8.5in;
        padding: 0.4in 0.5in 0.9in 0.5in; /* Extra bottom padding for footer */
        page-break-after: always;
        page-break-inside: avoid;
        break-after: page;
        break-inside: avoid;
        position: relative;
        background: ${colors.background};
        overflow: hidden;
        box-sizing: border-box;
      }

      .page-content {
        height: 100%;
        overflow: hidden;
      }

      .page:last-child {
        page-break-after: avoid;
        break-after: auto;
      }

      @media print {
        .page {
          page-break-after: always;
          page-break-inside: avoid;
        }
        .page:last-child {
          page-break-after: avoid;
        }
      }

      /* Typography */
      h1 {
        font-size: 24px;
        font-weight: 700;
        color: ${colors.text};
        margin-bottom: 8px;
      }

      h2 {
        font-size: 16px;
        font-weight: 600;
        color: ${colors.text};
        margin-bottom: 12px;
        padding-bottom: 6px;
        border-bottom: 2px solid ${colors.primary};
      }

      h3 {
        font-size: 13px;
        font-weight: 600;
        color: ${colors.text};
        margin-bottom: 8px;
      }

      .subtitle {
        font-size: 13px;
        color: ${colors.neutral};
        margin-bottom: 4px;
      }

      /* Layout */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #E5E7EB;
      }

      .header-left {
        flex: 1;
      }

      .header-right {
        text-align: right;
      }

      .firm-logo {
        font-size: 18px;
        font-weight: 700;
        color: ${colors.accent};
        letter-spacing: -0.5px;
      }

      .firm-logo-img {
        width: 180px;
        height: 41px;
        object-fit: contain;
        object-position: right;
        margin-bottom: 4px;
      }

      .report-date {
        font-size: 11px;
        color: ${colors.neutral};
        margin-top: 4px;
      }

      .section {
        margin-bottom: 16px;
      }

      .row {
        display: flex;
        gap: 20px;
        margin-bottom: 12px;
      }

      .col-2 {
        flex: 1;
      }

      .col-3 {
        flex: 1;
      }

      /* Metric Cards */
      .metrics-row {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
      }

      .metric-card {
        flex: 1;
        background: #F9FAFB;
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #E5E7EB;
      }

      .metric-label {
        font-size: 10px;
        font-weight: 500;
        color: ${colors.neutral};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .metric-value {
        font-size: 20px;
        font-weight: 700;
        color: ${colors.text};
      }

      .metric-value.positive {
        color: ${colors.positive};
      }

      .metric-value.negative {
        color: ${colors.negative};
      }

      .metric-change {
        font-size: 11px;
        margin-top: 4px;
      }

      .metric-change.positive {
        color: ${colors.positive};
      }

      .metric-change.negative {
        color: ${colors.negative};
      }

      /* Tables */
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
      }

      th {
        text-align: left;
        padding: 8px 12px;
        background: #F3F4F6;
        font-weight: 600;
        color: ${colors.text};
        border-bottom: 1px solid #E5E7EB;
      }

      th.right {
        text-align: right;
      }

      td {
        padding: 8px 12px;
        border-bottom: 1px solid #F3F4F6;
        vertical-align: middle;
      }

      td.right {
        text-align: right;
      }

      td.positive {
        color: ${colors.positive};
      }

      td.negative {
        color: ${colors.negative};
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover {
        background: #F9FAFB;
      }

      .table-footer {
        background: #F3F4F6;
        font-weight: 600;
      }

      .table-footer td {
        border-top: 2px solid #E5E7EB;
        border-bottom: none;
      }

      /* Charts */
      .chart-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px;
      }

      .chart-title {
        font-size: 12px;
        font-weight: 600;
        color: ${colors.text};
        margin-bottom: 12px;
      }

      /* Status badges */
      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 500;
      }

      .badge-success {
        background: #D1FAE5;
        color: #065F46;
      }

      .badge-warning {
        background: #FEF3C7;
        color: #92400E;
      }

      .badge-danger {
        background: #FEE2E2;
        color: #991B1B;
      }

      /* Footer */
      .page-footer {
        position: absolute;
        bottom: 0.5in;
        left: 0.5in;
        right: 0.5in;
        padding-top: 12px;
        border-top: 1px solid #E5E7EB;
        font-size: 9px;
        color: ${colors.neutral};
        display: flex;
        justify-content: space-between;
      }

      .disclaimer {
        font-size: 8px;
        color: ${colors.neutral};
        line-height: 1.4;
        max-width: 80%;
      }

      .page-number {
        font-weight: 500;
      }

      /* Print optimizations */
      @media print {
        .page {
          margin: 0;
          padding: 0.5in;
        }

        .no-print {
          display: none;
        }
      }
    </style>
  `;
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

export interface HeaderProps {
  clientName: string;
  reportTitle: string;
  reportDate: string;
  periodStart: string;
  periodEnd: string;
  firmName?: string;
  advisorName?: string;
}

export function renderHeader(props: HeaderProps): string {
  const {
    clientName,
    reportTitle,
    reportDate,
    periodStart,
    periodEnd,
    advisorName,
  } = props;

  return `
    <div class="header">
      <div class="header-left">
        <h1>${escapeHtml(clientName)}</h1>
        <div class="subtitle">${escapeHtml(reportTitle)}</div>
        <div class="subtitle">Period: ${formatDateDisplay(periodStart)} - ${formatDateDisplay(periodEnd)}</div>
        ${advisorName ? `<div class="subtitle">Advisor: ${escapeHtml(advisorName)}</div>` : ''}
      </div>
      <div class="header-right">
        <img src="${ALTI_LOGO_BASE64}" alt="${escapeHtml(ALTI_BRAND.firmName)}" class="firm-logo-img" width="${ALTI_LOGO_WIDTH}" height="${ALTI_LOGO_HEIGHT}" />
        <div class="report-date">Generated: ${formatDateDisplay(reportDate)}</div>
      </div>
    </div>
  `;
}

// ============================================================================
// METRIC CARDS
// ============================================================================

export interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  isNegative?: boolean;
}

export function renderMetricCard(props: MetricCardProps): string {
  const { label, value, change, isPositive, isNegative } = props;
  const valueClass = isPositive ? 'positive' : isNegative ? 'negative' : '';
  const changeClass = change?.startsWith('+') ? 'positive' : change?.startsWith('-') ? 'negative' : '';

  return `
    <div class="metric-card">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value ${valueClass}">${escapeHtml(value)}</div>
      ${change ? `<div class="metric-change ${changeClass}">${escapeHtml(change)}</div>` : ''}
    </div>
  `;
}

export function renderMetricsRow(metrics: MetricCardProps[]): string {
  return `
    <div class="metrics-row">
      ${metrics.map(renderMetricCard).join('')}
    </div>
  `;
}

// ============================================================================
// TABLES
// ============================================================================

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
  format?: (value: unknown) => string;
}

export interface TableProps {
  columns: TableColumn[];
  data: Record<string, unknown>[];
  showFooter?: boolean;
  footerData?: Record<string, unknown>;
}

export function renderTable(props: TableProps): string {
  const { columns, data, showFooter, footerData } = props;

  return `
    <table>
      <thead>
        <tr>
          ${columns.map(col => `
            <th class="${col.align === 'right' ? 'right' : ''}">${escapeHtml(col.label)}</th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${columns.map(col => {
              const value = row[col.key];
              const formatted = col.format ? col.format(value) : String(value);
              const isPositive = typeof value === 'number' && value > 0 && col.key.includes('gain');
              const isNegative = typeof value === 'number' && value < 0;
              const cellClass = `${col.align === 'right' ? 'right' : ''} ${isPositive ? 'positive' : ''} ${isNegative ? 'negative' : ''}`;
              return `<td class="${cellClass}">${escapeHtml(formatted)}</td>`;
            }).join('')}
          </tr>
        `).join('')}
        ${showFooter && footerData ? `
          <tr class="table-footer">
            ${columns.map(col => {
              const value = footerData[col.key];
              const formatted = col.format ? col.format(value) : String(value || '');
              return `<td class="${col.align === 'right' ? 'right' : ''}">${escapeHtml(formatted)}</td>`;
            }).join('')}
          </tr>
        ` : ''}
      </tbody>
    </table>
  `;
}

// ============================================================================
// FOOTER COMPONENT
// ============================================================================

export interface FooterProps {
  pageNumber: number;
  totalPages: number;
  disclaimer?: string;
  firmName?: string;
}

export function renderFooter(props: FooterProps): string {
  const {
    pageNumber,
    totalPages,
    disclaimer = 'This report is provided for informational purposes only and does not constitute investment advice. Past performance is not indicative of future results. Please consult your advisor for personalized recommendations.',
  } = props;

  return `
    <div class="page-footer">
      <div class="disclaimer">${disclaimer}</div>
      <div class="page-number">${ALTI_BRAND.firmName} | Page ${pageNumber} of ${totalPages}</div>
    </div>
  `;
}

// ============================================================================
// STATUS BADGE
// ============================================================================

export function renderStatusBadge(status: 'on-track' | 'needs-attention' | 'at-risk'): string {
  const config = {
    'on-track': { class: 'badge-success', label: 'On Track' },
    'needs-attention': { class: 'badge-warning', label: 'Needs Attention' },
    'at-risk': { class: 'badge-danger', label: 'At Risk' },
  };

  const { class: badgeClass, label } = config[status];
  return `<span class="badge ${badgeClass}">${label}</span>`;
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals: number = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatPercentPlain(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// HTML DOCUMENT WRAPPER
// ============================================================================

export function wrapDocument(
  content: string,
  theme?: Partial<ThemeColors>,
  title: string = 'Financial Report'
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${getBaseStyles(theme)}
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}
