import * as XLSX from 'xlsx';
import type {
  ClientReportData,
  AdvisorReportData,
  FirmReportData,
  Holding,
  Account,
} from '../types';

// ============================================================================
// Excel Export Generator
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US');
}

// ============================================================================
// Client Report Excel Export
// ============================================================================

export function generateClientReportExcel(data: ClientReportData): Uint8Array {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Client Portfolio Report'],
    [''],
    ['Client Information'],
    ['Name', data.client.name],
    ['Household', data.client.household],
    ['Advisor', data.client.advisor],
    ['Status', data.client.status],
    [''],
    ['Report Period'],
    ['Start Date', formatDate(data.periodStart)],
    ['End Date', formatDate(data.periodEnd)],
    ['Generated', formatDate(data.reportDate)],
    [''],
    ['Portfolio Summary'],
    ['Total AUM', formatCurrency(data.totalAUM)],
    ['Period Gain/Loss', formatCurrency(data.periodGainLoss)],
    ['Period Return', formatPercent(data.periodGainLossPercent)],
    [''],
    ['Performance Metrics'],
    ['MTD Return', formatPercent(data.performance.mtd)],
    ['QTD Return', formatPercent(data.performance.qtd)],
    ['YTD Return', formatPercent(data.performance.ytd)],
    ['1-Year Return', data.performance.oneYear != null ? formatPercent(data.performance.oneYear) : 'N/A'],
    ['3-Year Return', data.performance.threeYear != null ? formatPercent(data.performance.threeYear) : 'N/A'],
    ['Volatility', data.performance.volatility != null ? formatPercent(data.performance.volatility) : 'N/A'],
    ['Sharpe Ratio', data.performance.sharpeRatio?.toFixed(2) || 'N/A'],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Holdings Sheet
  const holdingsHeader = ['Symbol', 'Name', 'Asset Class', 'Sector', 'Quantity', 'Cost Basis', 'Current Price', 'Current Value', 'Weight %', 'Gain/Loss', 'Gain/Loss %'];
  const holdingsData = data.holdings.map((h: Holding) => [
    h.symbol,
    h.name,
    h.assetClass,
    h.sector || '',
    h.quantity,
    h.costBasis,
    h.currentPrice,
    h.currentValue,
    h.weight,
    h.gainLoss,
    h.gainLossPercent,
  ]);
  const holdingsSheet = XLSX.utils.aoa_to_sheet([holdingsHeader, ...holdingsData]);
  holdingsSheet['!cols'] = [
    { wch: 10 }, { wch: 35 }, { wch: 15 }, { wch: 20 },
    { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 10 }, { wch: 15 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, holdingsSheet, 'Holdings');

  // Accounts Sheet
  const accountsHeader = ['Account Name', 'Type', 'Institution', 'Tax Type', 'Balance'];
  const accountsData = data.accounts.map((a: Account) => [
    a.name,
    a.type,
    a.institution,
    a.taxType,
    a.balance,
  ]);
  const accountsSheet = XLSX.utils.aoa_to_sheet([accountsHeader, ...accountsData]);
  accountsSheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, accountsSheet, 'Accounts');

  // Allocation Sheet
  const allocationHeader = ['Asset Class', 'Value', 'Weight %', 'Target Weight %', 'Variance'];
  const allocationData = data.allocation.byAssetClass.map((a) => [
    a.category,
    a.value,
    a.weight,
    a.targetWeight || '',
    a.variance || '',
  ]);
  const allocationSheet = XLSX.utils.aoa_to_sheet([allocationHeader, ...allocationData]);
  allocationSheet['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, allocationSheet, 'Allocation');

  // Performance History Sheet
  const historyHeader = ['Date', 'Portfolio Value', 'Benchmark Value', 'Net Flows'];
  const historyData = data.performanceHistory.map((p) => [
    formatDate(p.date),
    p.portfolioValue,
    p.benchmarkValue || '',
    p.netFlows,
  ]);
  const historySheet = XLSX.utils.aoa_to_sheet([historyHeader, ...historyData]);
  historySheet['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, historySheet, 'Performance History');

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buffer);
}

// ============================================================================
// Advisor Report Excel Export
// ============================================================================

export function generateAdvisorReportExcel(data: AdvisorReportData): Uint8Array {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Advisor Book Report'],
    [''],
    ['Advisor Information'],
    ['Name', data.advisorName],
    ['Team', data.team || ''],
    ['Role', data.role || ''],
    [''],
    ['Report Period'],
    ['Start Date', formatDate(data.periodStart)],
    ['End Date', formatDate(data.periodEnd)],
    ['Generated', formatDate(data.reportDate)],
    [''],
    ['Book Summary'],
    ['Total AUM', formatCurrency(data.totalAUM)],
    ['Total Clients', data.totalClients],
    ['Average Client AUM', formatCurrency(data.avgClientAUM)],
    ['Median Client AUM', formatCurrency(data.medianClientAUM || data.avgClientAUM)],
    [''],
    ['Performance'],
    ['Book YTD Return', formatPercent(data.bookYTDReturn || 0)],
    ['Book MTD Return', formatPercent(data.bookMTDReturn || 0)],
    ['YTD Net Flows', formatCurrency(data.ytdNetFlows || 0)],
    ['MTD Net Flows', formatCurrency(data.mtdNetFlows || 0)],
    [''],
    ['Client Status'],
    ['On Track', data.clientsByStatus.onTrack],
    ['Needs Attention', data.clientsByStatus.needsAttention],
    ['At Risk', data.clientsByStatus.atRisk],
    [''],
    ['Revenue'],
    ['Est. Annual Revenue', formatCurrency(data.annualRevenue || 0)],
    ['Avg Fee Rate (bps)', data.avgFeeRate || 0],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 22 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Clients Sheet
  const clientsHeader = ['Client Name', 'Household', 'AUM', 'YTD Return', 'MTD Return', 'Status', 'Plan Health', 'Risk Score', 'Last Meeting', 'Next Meeting'];
  const clientsData = data.clients.map((c) => [
    c.clientName,
    c.household,
    c.aum,
    c.ytdReturn,
    c.mtdReturn || '',
    c.status,
    c.planHealth || '',
    c.riskScore || '',
    c.lastMeeting ? formatDate(c.lastMeeting) : '',
    c.nextMeeting ? formatDate(c.nextMeeting) : '',
  ]);
  const clientsSheet = XLSX.utils.aoa_to_sheet([clientsHeader, ...clientsData]);
  clientsSheet['!cols'] = [
    { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Clients');

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buffer);
}

// ============================================================================
// Firm Report Excel Export
// ============================================================================

export function generateFirmReportExcel(data: FirmReportData): Uint8Array {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Firm Analytics Report'],
    [''],
    ['Firm Information'],
    ['Firm Name', data.firmName],
    [''],
    ['Report Period'],
    ['Start Date', formatDate(data.periodStart)],
    ['End Date', formatDate(data.periodEnd)],
    ['Generated', formatDate(data.reportDate)],
    [''],
    ['Firm Summary'],
    ['Total AUM', formatCurrency(data.totalAUM)],
    ['Total Clients', data.totalClients],
    ['Total Advisors', data.totalAdvisors],
    ['Total Households', data.totalHouseholds || ''],
    ['Average Client AUM', formatCurrency(data.avgClientAUM)],
    ['Median Client AUM', formatCurrency(data.medianClientAUM || 0)],
    [''],
    ['Performance'],
    ['Firm YTD Return', formatPercent(data.firmYTDReturn)],
    ['Firm MTD Return', formatPercent(data.firmMTDReturn)],
    ['Firm QTD Return', formatPercent(data.firmQTDReturn || 0)],
    [''],
    ['Flows'],
    ['YTD Net Flows', formatCurrency(data.ytdNetFlows)],
    ['MTD Net Flows', formatCurrency(data.mtdNetFlows)],
    ['YTD New Clients', data.ytdNewClients || 0],
    ['YTD Closed Clients', data.ytdClosedClients || 0],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 22 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Advisors Sheet
  const advisorsHeader = ['Rank', 'Advisor Name', 'Team', 'Role', 'AUM', 'Clients', 'Avg Client AUM', 'YTD Performance', 'YTD Net Flows', 'New Clients YTD'];
  const advisorsData = data.aumByAdvisor.map((a, i) => [
    i + 1,
    a.advisorName,
    a.team,
    a.role || '',
    a.totalAUM,
    a.clientCount,
    a.avgClientAUM,
    a.ytdPerformance || '',
    a.ytdNetFlows || '',
    a.newClientsYTD || '',
  ]);
  const advisorsSheet = XLSX.utils.aoa_to_sheet([advisorsHeader, ...advisorsData]);
  advisorsSheet['!cols'] = [
    { wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
    { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(workbook, advisorsSheet, 'Advisors');

  // Segments Sheet
  if (data.aumBySegment) {
    const segmentsHeader = ['Segment', 'Min AUM', 'Max AUM', 'Client Count', 'Total AUM', 'Avg AUM'];
    const segmentsData = data.aumBySegment.map((s) => [
      s.segment,
      s.minAUM,
      s.maxAUM || '',
      s.clientCount,
      s.totalAUM,
      s.avgAUM,
    ]);
    const segmentsSheet = XLSX.utils.aoa_to_sheet([segmentsHeader, ...segmentsData]);
    segmentsSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, segmentsSheet, 'Segments');
  }

  // AUM History Sheet
  const historyHeader = ['Date', 'AUM', 'Net Flows', 'Market Change'];
  const historyData = data.aumHistory.map((h) => [
    formatDate(h.date),
    h.aum,
    h.netFlows || '',
    h.marketChange || '',
  ]);
  const historySheet = XLSX.utils.aoa_to_sheet([historyHeader, ...historyData]);
  historySheet['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, historySheet, 'AUM History');

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buffer);
}
