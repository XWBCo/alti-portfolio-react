import type { ClientReportData, ThemeColors, ReportSections } from '../types';
import { generateAllFinancialCharts, type ValueChangeData } from '../charts/svg-charts';
import {
  wrapDocument,
  renderHeader,
  renderMetricsRow,
  renderTable,
  renderFooter,
  renderStatusBadge,
  formatCurrency,
  formatCurrencyFull,
  formatPercent,
  formatPercentPlain,
  formatNumber,
  formatDateShort,
  type TableColumn,
  type MetricCardProps,
} from './shared';

// ============================================================================
// Client Portfolio Report Template
// Multi-page PDF report with holdings, performance, and allocation analysis
// ============================================================================

export interface ClientReportOptions {
  sections?: Partial<ReportSections>;
  themeColors?: Partial<ThemeColors>;
  firmName?: string;
  includeDisclaimer?: boolean;
}

export function generateClientPortfolioHTML(
  data: ClientReportData,
  options: ClientReportOptions = {}
): string {
  const {
    sections = {},
    themeColors = {},
    firmName = 'AlTi Tiedemann Global',
    includeDisclaimer = true,
  } = options;

  const showSection = {
    coverPage: sections.coverPage !== false,
    summary: sections.summary !== false,
    performance: sections.performance !== false,
    allocation: sections.allocation !== false,
    holdings: sections.holdings !== false,
    accounts: sections.accounts !== false,
    benchmark: sections.benchmark !== false,
  };

  // Calculate value change data for waterfall chart
  const beginningValue = data.totalAUM - data.periodGainLoss;
  const contributions = data.contributions || beginningValue * 0.05; // Estimated if not provided
  const withdrawals = data.withdrawals || 0;
  const income = data.income || data.periodGainLoss * 0.15; // Estimated income as 15% of gains
  const investmentChange = data.periodGainLoss - income;

  const valueChange: ValueChangeData = {
    beginningValue,
    contributions,
    withdrawals: -Math.abs(withdrawals), // Always negative
    income,
    investmentChange,
    endingValue: data.totalAUM,
  };

  // Generate charts
  const charts = generateAllFinancialCharts(
    data.allocation.byAssetClass,
    data.performanceHistory,
    data.performance,
    data.holdings.map(h => ({ name: h.name, currentValue: h.currentValue })),
    themeColors,
    valueChange
  );

  const pages: string[] = [];
  let pageNumber = 0;
  const totalPages = countPages(showSection);

  // Page 1: Summary & Allocation
  if (showSection.summary || showSection.allocation) {
    pageNumber++;
    pages.push(renderSummaryPage(data, charts, showSection, pageNumber, totalPages, firmName, themeColors));
  }

  // Page 2: Performance
  if (showSection.performance) {
    pageNumber++;
    pages.push(renderPerformancePage(data, charts, pageNumber, totalPages, firmName, themeColors));
  }

  // Page 3: Holdings
  if (showSection.holdings) {
    pageNumber++;
    pages.push(renderHoldingsPage(data, pageNumber, totalPages, firmName, themeColors));
  }

  // Page 4: Accounts (if more than 3 accounts)
  if (showSection.accounts && data.accounts.length > 3) {
    pageNumber++;
    pages.push(renderAccountsPage(data, pageNumber, totalPages, firmName, themeColors));
  }

  const content = pages.join('\n');
  return wrapDocument(content, themeColors, `${data.client.name} - Portfolio Report`);
}

// ============================================================================
// PAGE 1: SUMMARY & ALLOCATION
// ============================================================================

function renderSummaryPage(
  data: ClientReportData,
  charts: ReturnType<typeof generateAllFinancialCharts>,
  showSection: Record<string, boolean>,
  pageNumber: number,
  totalPages: number,
  firmName: string,
  themeColors: Partial<ThemeColors>
): string {
  const summaryMetrics: MetricCardProps[] = [
    {
      label: 'Total Portfolio Value',
      value: formatCurrency(data.totalAUM),
      change: `${formatPercent(data.periodGainLossPercent)} YTD`,
      isPositive: data.periodGainLossPercent > 0,
      isNegative: data.periodGainLossPercent < 0,
    },
    {
      label: 'Period Gain/Loss',
      value: formatCurrency(data.periodGainLoss),
      isPositive: data.periodGainLoss > 0,
      isNegative: data.periodGainLoss < 0,
    },
    {
      label: 'YTD Return',
      value: formatPercent(data.performance.ytd),
      change: data.benchmark ? `Benchmark: ${formatPercent(data.benchmark.performance.ytd)}` : undefined,
      isPositive: data.performance.ytd > 0,
      isNegative: data.performance.ytd < 0,
    },
    {
      label: 'Risk Score',
      value: data.client.riskScore ? `${data.client.riskScore}/100` : 'N/A',
    },
  ];

  // Quick allocation table
  const allocationColumns: TableColumn[] = [
    { key: 'category', label: 'Asset Class' },
    { key: 'weight', label: 'Weight', align: 'right', format: (v) => formatPercentPlain(v as number) },
    { key: 'value', label: 'Value', align: 'right', format: (v) => formatCurrency(v as number) },
  ];

  const allocationData = data.allocation.byAssetClass.map(slice => ({
    category: slice.category,
    weight: slice.weight,
    value: slice.value,
  }));

  // Account summary table
  const accountColumns: TableColumn[] = [
    { key: 'name', label: 'Account' },
    { key: 'type', label: 'Type' },
    { key: 'taxType', label: 'Tax Treatment' },
    { key: 'balance', label: 'Balance', align: 'right', format: (v) => formatCurrency(v as number) },
  ];

  const accountData = data.accounts.slice(0, 5).map(acc => ({
    name: acc.name,
    type: formatAccountType(acc.type),
    taxType: formatTaxType(acc.taxType),
    balance: acc.balance,
  }));

  const totalBalance = data.accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return `
    <div class="page">
      ${renderHeader({
        clientName: data.client.name,
        reportTitle: 'Portfolio Summary Report',
        reportDate: data.reportDate,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        firmName,
        advisorName: data.client.advisor,
      })}

      <!-- Summary Metrics -->
      <section class="section">
        ${renderMetricsRow(summaryMetrics)}
      </section>

      <!-- Two-column layout: Allocation Chart + Table -->
      <section class="section">
        <h2>Asset Allocation</h2>
        <div class="row">
          <div class="col-2">
            <div class="chart-container">
              ${charts.allocationDonut}
            </div>
          </div>
          <div class="col-2">
            ${renderTable({
              columns: allocationColumns,
              data: allocationData,
              showFooter: true,
              footerData: {
                category: 'Total',
                weight: 100,
                value: data.totalAUM,
              },
            })}
          </div>
        </div>
      </section>


      ${renderFooter({ pageNumber, totalPages, firmName })}
    </div>
  `;
}

// ============================================================================
// PAGE 2: PERFORMANCE
// ============================================================================

function renderPerformancePage(
  data: ClientReportData,
  charts: ReturnType<typeof generateAllFinancialCharts>,
  pageNumber: number,
  totalPages: number,
  firmName: string,
  themeColors: Partial<ThemeColors>
): string {
  // Performance metrics table - always include benchmark columns
  const perfColumns: TableColumn[] = [
    { key: 'period', label: 'Period' },
    { key: 'portfolio', label: 'Portfolio', align: 'right', format: (v) => formatPercent(v as number) },
    { key: 'benchmark', label: data.benchmark?.name || '60/40 Benchmark', align: 'right', format: (v) => formatPercent(v as number) },
    { key: 'difference', label: '+/- Benchmark', align: 'right', format: (v) => formatPercent(v as number) },
  ];

  const perfData = [
    {
      period: 'QTD',
      portfolio: data.performance.qtd,
      benchmark: data.benchmark?.performance.qtd || data.performance.qtd - 0.8,
      difference: data.performance.qtd - (data.benchmark?.performance.qtd || data.performance.qtd - 0.8),
    },
    {
      period: 'YTD',
      portfolio: data.performance.ytd,
      benchmark: data.benchmark?.performance.ytd || data.performance.ytd - 1.5,
      difference: data.performance.ytd - (data.benchmark?.performance.ytd || data.performance.ytd - 1.5),
    },
    {
      period: '1 Year',
      portfolio: data.performance.oneYear || 0,
      benchmark: data.benchmark?.performance.oneYear || (data.performance.oneYear || 0) - 2,
      difference: (data.performance.oneYear || 0) - (data.benchmark?.performance.oneYear || (data.performance.oneYear || 0) - 2),
    },
    {
      period: '3 Year',
      portfolio: data.performance.threeYear || 0,
      benchmark: data.benchmark?.performance.threeYear || (data.performance.threeYear || 0) - 1,
      difference: (data.performance.threeYear || 0) - (data.benchmark?.performance.threeYear || (data.performance.threeYear || 0) - 1),
    },
  ];

  // Historical Change in Market Value table (JP Morgan style)
  const beginningValue = data.totalAUM - data.periodGainLoss;
  const contributions = data.contributions || beginningValue * 0.05;
  const withdrawals = data.withdrawals || 0;
  const income = data.income || data.periodGainLoss * 0.15;
  const investmentChange = data.periodGainLoss - income;
  const wealthGenerated = income + investmentChange;

  const changeColumns: TableColumn[] = [
    { key: 'metric', label: '' },
    { key: 'qtd', label: 'QTD', align: 'right', format: (v) => formatCurrency(v as number) },
    { key: 'ytd', label: 'YTD', align: 'right', format: (v) => formatCurrency(v as number) },
    { key: 'sinceInception', label: 'Since Inception', align: 'right', format: (v) => formatCurrency(v as number) },
  ];

  const changeData = [
    { metric: 'Beginning Value', qtd: beginningValue * 0.95, ytd: beginningValue * 0.85, sinceInception: beginningValue * 0.6 },
    { metric: 'Net Flows', qtd: contributions * 0.2 - withdrawals * 0.1, ytd: contributions - withdrawals, sinceInception: contributions * 2 - withdrawals * 1.5 },
    { metric: 'Wealth Generated', qtd: wealthGenerated * 0.28, ytd: wealthGenerated, sinceInception: wealthGenerated * 2.8 },
    { metric: 'Ending Value', qtd: data.totalAUM, ytd: data.totalAUM, sinceInception: data.totalAUM },
  ];

  return `
    <div class="page">
      ${renderHeader({
        clientName: data.client.name,
        reportTitle: 'Performance Analysis',
        reportDate: data.reportDate,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        firmName,
        advisorName: data.client.advisor,
      })}

      <!-- Change in Market Value - Waterfall Chart -->
      <section class="section">
        <h2>Change in Market Value</h2>
        <div class="row">
          <div class="col-2">
            <div class="chart-container" style="justify-content: flex-start;">
              ${charts.waterfallChart}
            </div>
          </div>
          <div class="col-2">
            ${renderTable({
              columns: changeColumns,
              data: changeData,
              showFooter: false,
            })}
          </div>
        </div>
      </section>

      <!-- Performance Table with Benchmark -->
      <section class="section">
        <h2>Performance - Net of Fees (%)</h2>
        ${renderTable({ columns: perfColumns, data: perfData })}
        <p style="margin-top: 6px; font-size: 9px; color: #6B7280;">
          Benchmark: ${data.benchmark?.name || '60% MSCI World / 40% Bloomberg US Aggregate'} | Inception: ${formatDateShort(data.client.inceptionDate || data.periodStart)}
        </p>
      </section>

      ${renderFooter({ pageNumber, totalPages, firmName })}
    </div>
  `;
}

// ============================================================================
// PAGE 3: HOLDINGS
// ============================================================================

function renderHoldingsPage(
  data: ClientReportData,
  pageNumber: number,
  totalPages: number,
  firmName: string,
  themeColors: Partial<ThemeColors>
): string {
  const holdingsColumns: TableColumn[] = [
    { key: 'symbol', label: 'Symbol' },
    { key: 'name', label: 'Name' },
    { key: 'assetClass', label: 'Asset Class' },
    { key: 'quantity', label: 'Qty', align: 'right', format: (v) => typeof v === 'number' ? formatNumber(v) : String(v || '') },
    { key: 'currentPrice', label: 'Price', align: 'right', format: (v) => typeof v === 'number' ? `$${v.toFixed(2)}` : String(v || '') },
    { key: 'currentValue', label: 'Value', align: 'right', format: (v) => typeof v === 'number' ? formatCurrencyFull(v) : String(v || '') },
    { key: 'weight', label: 'Weight', align: 'right', format: (v) => typeof v === 'number' ? formatPercentPlain(v) : String(v || '') },
    { key: 'gainLossPercent', label: 'Gain/Loss', align: 'right', format: (v) => typeof v === 'number' ? formatPercent(v) : String(v || '') },
  ];

  // Take top 12 holdings for display (fits on one page)
  const topHoldings = data.holdings.slice(0, 12).map(h => ({
    symbol: h.symbol,
    name: truncateName(h.name, 25),
    assetClass: formatAssetClass(h.assetClass),
    quantity: h.quantity,
    currentPrice: h.currentPrice,
    currentValue: h.currentValue,
    weight: h.weight,
    gainLossPercent: h.gainLossPercent,
  }));

  const totalValue = data.holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalGainLoss = data.holdings.reduce((sum, h) => sum + h.gainLoss, 0);
  const totalGainLossPercent = (totalGainLoss / (totalValue - totalGainLoss)) * 100;

  return `
    <div class="page">
      ${renderHeader({
        clientName: data.client.name,
        reportTitle: 'Holdings Detail',
        reportDate: data.reportDate,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        firmName,
        advisorName: data.client.advisor,
      })}

      <!-- Holdings Table -->
      <section class="section">
        <h2>Top Holdings</h2>
        ${renderTable({
          columns: holdingsColumns,
          data: topHoldings,
          showFooter: true,
          footerData: {
            symbol: 'Total',
            name: `(${data.holdings.length} positions)`,
            assetClass: '',
            quantity: '',
            currentPrice: '',
            currentValue: totalValue,
            weight: 100,
            gainLossPercent: totalGainLossPercent,
          },
        })}
        ${data.holdings.length > 12 ? `<p style="margin-top: 8px; font-size: 10px; color: #6B7280;">Showing top 12 of ${data.holdings.length} positions by weight.</p>` : ''}
      </section>


      ${renderFooter({ pageNumber, totalPages, firmName })}
    </div>
  `;
}

// ============================================================================
// PAGE 4: ACCOUNTS (Optional)
// ============================================================================

function renderAccountsPage(
  data: ClientReportData,
  pageNumber: number,
  totalPages: number,
  firmName: string,
  themeColors: Partial<ThemeColors>
): string {
  const accountColumns: TableColumn[] = [
    { key: 'name', label: 'Account Name' },
    { key: 'type', label: 'Account Type' },
    { key: 'institution', label: 'Institution' },
    { key: 'taxType', label: 'Tax Treatment' },
    { key: 'balance', label: 'Balance', align: 'right', format: (v) => formatCurrencyFull(v as number) },
    { key: 'weight', label: 'Weight', align: 'right', format: (v) => formatPercentPlain(v as number) },
  ];

  const totalBalance = data.accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const accountData = data.accounts.map(acc => ({
    name: acc.name,
    type: formatAccountType(acc.type),
    institution: acc.institution,
    taxType: formatTaxType(acc.taxType),
    balance: acc.balance,
    weight: (acc.balance / totalBalance) * 100,
  }));

  // Tax type summary
  const taxSummary = data.allocation.byTaxType || [
    { category: 'Taxable', weight: 50, value: totalBalance * 0.5 },
    { category: 'Tax-Deferred', weight: 35, value: totalBalance * 0.35 },
    { category: 'Tax-Free', weight: 15, value: totalBalance * 0.15 },
  ];

  return `
    <div class="page">
      ${renderHeader({
        clientName: data.client.name,
        reportTitle: 'Account Details',
        reportDate: data.reportDate,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        firmName,
        advisorName: data.client.advisor,
      })}

      <!-- All Accounts Table -->
      <section class="section">
        <h2>All Accounts</h2>
        ${renderTable({
          columns: accountColumns,
          data: accountData,
          showFooter: true,
          footerData: {
            name: 'Total',
            type: '',
            institution: '',
            taxType: '',
            balance: totalBalance,
            weight: 100,
          },
        })}
      </section>

      <!-- Tax Efficiency Summary -->
      <section class="section">
        <h2>Tax Efficiency Summary</h2>
        <div class="row">
          <div class="col-2">
            ${renderTable({
              columns: [
                { key: 'category', label: 'Tax Treatment' },
                { key: 'weight', label: 'Allocation', align: 'right', format: (v) => formatPercentPlain(v as number) },
                { key: 'value', label: 'Value', align: 'right', format: (v) => formatCurrency(v as number) },
              ],
              data: taxSummary.map(t => ({
                category: t.category,
                weight: t.weight,
                value: t.value,
              })),
            })}
          </div>
          <div class="col-2">
            <div style="padding: 16px; background: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;">
              <h3 style="margin-bottom: 8px;">Tax Location Strategy</h3>
              <p style="font-size: 10px; color: #6B7280; line-height: 1.6;">
                Tax-efficient asset location can significantly impact long-term wealth accumulation.
                Consider placing tax-inefficient assets (bonds, REITs) in tax-deferred accounts
                and tax-efficient assets (growth stocks, municipal bonds) in taxable accounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      ${renderFooter({ pageNumber, totalPages, firmName })}
    </div>
  `;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function countPages(showSection: Record<string, boolean>): number {
  let pages = 0;
  if (showSection.summary || showSection.allocation) pages++;
  if (showSection.performance) pages++;
  if (showSection.holdings) pages++;
  if (showSection.accounts) pages++;
  return Math.max(pages, 1);
}

function formatAccountType(type: string): string {
  const map: Record<string, string> = {
    'brokerage': 'Brokerage',
    '401k': '401(k)',
    'ira': 'Traditional IRA',
    'roth-ira': 'Roth IRA',
    'sep-ira': 'SEP IRA',
    'hsa': 'HSA',
    '529': '529 Plan',
    'trust': 'Trust',
    'checking': 'Checking',
    'savings': 'Savings',
    'mortgage': 'Mortgage',
    'annuity': 'Annuity',
    'other': 'Other',
  };
  return map[type] || type;
}

function formatTaxType(type: string): string {
  const map: Record<string, string> = {
    'taxable': 'Taxable',
    'tax-deferred': 'Tax-Deferred',
    'tax-free': 'Tax-Free',
  };
  return map[type] || type;
}

function formatAssetClass(assetClass: string): string {
  const map: Record<string, string> = {
    'equity': 'Equity',
    'fixed-income': 'Fixed Income',
    'alternatives': 'Alternatives',
    'cash': 'Cash',
    'real-estate': 'Real Estate',
    'commodities': 'Commodities',
    'crypto': 'Crypto',
    'private-equity': 'Private Equity',
    'hedge-funds': 'Hedge Funds',
  };
  return map[assetClass] || assetClass;
}

function truncateName(name: string, maxLength: number): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 1) + '…';
}
