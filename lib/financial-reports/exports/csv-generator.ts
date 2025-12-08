import type {
  ClientReportData,
  AdvisorReportData,
  FirmReportData,
} from '../types';

// ============================================================================
// CSV Export Generator
// ============================================================================

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // Prevent CSV injection (formula injection) - prefix dangerous chars with single quote
  // Excel/Sheets interpret =, @, +, - at start as formulas
  if (/^[=@+\-\t\r]/.test(str)) {
    str = `'${str}`;
  }

  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes("'")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
}

// ============================================================================
// Client Report CSV Export
// ============================================================================

export interface ClientCSVExport {
  holdings: string;
  accounts: string;
  allocation: string;
  performance: string;
}

export function generateClientReportCSV(data: ClientReportData): ClientCSVExport {
  // Holdings CSV
  const holdingsHeaders = ['Symbol', 'Name', 'Asset Class', 'Sector', 'Quantity', 'Cost Basis', 'Current Price', 'Current Value', 'Weight %', 'Gain/Loss', 'Gain/Loss %'];
  const holdingsRows = data.holdings.map(h => [
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
  const holdings = toCSV(holdingsHeaders, holdingsRows);

  // Accounts CSV
  const accountsHeaders = ['Account Name', 'Type', 'Institution', 'Tax Type', 'Balance'];
  const accountsRows = data.accounts.map(a => [
    a.name,
    a.type,
    a.institution,
    a.taxType,
    a.balance,
  ]);
  const accounts = toCSV(accountsHeaders, accountsRows);

  // Allocation CSV
  const allocationHeaders = ['Asset Class', 'Value', 'Weight %', 'Target Weight %', 'Variance'];
  const allocationRows = data.allocation.byAssetClass.map(a => [
    a.category,
    a.value,
    a.weight,
    a.targetWeight || '',
    a.variance || '',
  ]);
  const allocation = toCSV(allocationHeaders, allocationRows);

  // Performance History CSV
  const performanceHeaders = ['Date', 'Portfolio Value', 'Benchmark Value', 'Net Flows'];
  const performanceRows = data.performanceHistory.map(p => [
    p.date,
    p.portfolioValue,
    p.benchmarkValue || '',
    p.netFlows,
  ]);
  const performance = toCSV(performanceHeaders, performanceRows);

  return { holdings, accounts, allocation, performance };
}

// Combined client CSV (all data in one file with sections)
export function generateClientReportCombinedCSV(data: ClientReportData): string {
  const sections: string[] = [];

  // Header Section
  sections.push('CLIENT PORTFOLIO REPORT');
  sections.push(`Client,${escapeCSV(data.client.name)}`);
  sections.push(`Household,${escapeCSV(data.client.household)}`);
  sections.push(`Advisor,${escapeCSV(data.client.advisor)}`);
  sections.push(`Report Date,${data.reportDate}`);
  sections.push(`Period,${data.periodStart} to ${data.periodEnd}`);
  sections.push(`Total AUM,${data.totalAUM}`);
  sections.push(`Period Return,${data.periodGainLossPercent}%`);
  sections.push('');

  // Holdings Section
  sections.push('HOLDINGS');
  const csvData = generateClientReportCSV(data);
  sections.push(csvData.holdings);
  sections.push('');

  // Accounts Section
  sections.push('ACCOUNTS');
  sections.push(csvData.accounts);
  sections.push('');

  // Allocation Section
  sections.push('ASSET ALLOCATION');
  sections.push(csvData.allocation);
  sections.push('');

  // Performance History Section
  sections.push('PERFORMANCE HISTORY');
  sections.push(csvData.performance);

  return sections.join('\n');
}

// ============================================================================
// Advisor Report CSV Export
// ============================================================================

export function generateAdvisorReportCSV(data: AdvisorReportData): string {
  const sections: string[] = [];

  // Header Section
  sections.push('ADVISOR BOOK REPORT');
  sections.push(`Advisor,${escapeCSV(data.advisorName)}`);
  sections.push(`Team,${escapeCSV(data.team || '')}`);
  sections.push(`Role,${escapeCSV(data.role || '')}`);
  sections.push(`Report Date,${data.reportDate}`);
  sections.push(`Period,${data.periodStart} to ${data.periodEnd}`);
  sections.push(`Total AUM,${data.totalAUM}`);
  sections.push(`Total Clients,${data.totalClients}`);
  sections.push(`Book YTD Return,${data.bookYTDReturn || 0}%`);
  sections.push(`YTD Net Flows,${data.ytdNetFlows || 0}`);
  sections.push('');

  // Clients Section
  sections.push('CLIENT LIST');
  const clientsHeaders = ['Client Name', 'Household', 'AUM', 'YTD Return', 'Status', 'Plan Health', 'Risk Score', 'Last Meeting', 'Next Meeting'];
  const clientsRows = data.clients.map(c => [
    c.clientName,
    c.household,
    c.aum,
    c.ytdReturn,
    c.status,
    c.planHealth || '',
    c.riskScore || '',
    c.lastMeeting || '',
    c.nextMeeting || '',
  ]);
  sections.push(toCSV(clientsHeaders, clientsRows));

  return sections.join('\n');
}

// ============================================================================
// Firm Report CSV Export
// ============================================================================

export function generateFirmReportCSV(data: FirmReportData): string {
  const sections: string[] = [];

  // Header Section
  sections.push('FIRM ANALYTICS REPORT');
  sections.push(`Firm Name,${escapeCSV(data.firmName)}`);
  sections.push(`Report Date,${data.reportDate}`);
  sections.push(`Period,${data.periodStart} to ${data.periodEnd}`);
  sections.push(`Total AUM,${data.totalAUM}`);
  sections.push(`Total Clients,${data.totalClients}`);
  sections.push(`Total Advisors,${data.totalAdvisors}`);
  sections.push(`Firm YTD Return,${data.firmYTDReturn}%`);
  sections.push(`YTD Net Flows,${data.ytdNetFlows}`);
  sections.push('');

  // Advisors Section
  sections.push('ADVISOR RANKINGS');
  const advisorsHeaders = ['Rank', 'Advisor Name', 'Team', 'AUM', 'Clients', 'YTD Performance', 'YTD Net Flows'];
  const advisorsRows = data.aumByAdvisor.map((a, i) => [
    i + 1,
    a.advisorName,
    a.team,
    a.totalAUM,
    a.clientCount,
    a.ytdPerformance || '',
    a.ytdNetFlows || '',
  ]);
  sections.push(toCSV(advisorsHeaders, advisorsRows));
  sections.push('');

  // Segments Section
  if (data.aumBySegment) {
    sections.push('CLIENT SEGMENTS');
    const segmentsHeaders = ['Segment', 'Client Count', 'Total AUM', 'Avg AUM'];
    const segmentsRows = data.aumBySegment.map(s => [
      s.segment,
      s.clientCount,
      s.totalAUM,
      s.avgAUM,
    ]);
    sections.push(toCSV(segmentsHeaders, segmentsRows));
    sections.push('');
  }

  // AUM History Section
  sections.push('AUM HISTORY');
  const historyHeaders = ['Date', 'AUM', 'Net Flows', 'Market Change'];
  const historyRows = data.aumHistory.map(h => [
    h.date,
    h.aum,
    h.netFlows || '',
    h.marketChange || '',
  ]);
  sections.push(toCSV(historyHeaders, historyRows));

  return sections.join('\n');
}
