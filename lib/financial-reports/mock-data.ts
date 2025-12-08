import type {
  Holding,
  Account,
  PerformancePoint,
  PerformanceMetrics,
  AllocationSlice,
  AssetAllocation,
  ClientInfo,
  ClientReportData,
  ClientSummary,
  AdvisorReportData,
  AdvisorSummary,
  FirmReportData,
  AUMHistoryPoint,
  ClientSegment,
  Benchmark,
  AssetClass,
  Geography,
  Sector,
} from './types';
import { ASSET_CLASS_COLORS, GEOGRAPHY_COLORS } from './types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function randomFromArray<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// ============================================================================
// MOCK HOLDINGS DATA
// ============================================================================

const MOCK_EQUITIES: Array<{ symbol: string; name: string; sector: Sector }> = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'communication-services' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'consumer-discretionary' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'technology' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'communication-services' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', sector: 'financials' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'financials' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'healthcare' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'financials' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'healthcare' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'consumer-staples' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'energy' },
  { symbol: 'HD', name: 'Home Depot Inc.', sector: 'consumer-discretionary' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'energy' },
];

const MOCK_FIXED_INCOME: Array<{ symbol: string; name: string }> = [
  { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF' },
  { symbol: 'BND', name: 'Vanguard Total Bond Market ETF' },
  { symbol: 'LQD', name: 'iShares iBoxx $ Investment Grade Corp Bond ETF' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF' },
  { symbol: 'MUB', name: 'iShares National Muni Bond ETF' },
];

const MOCK_ALTERNATIVES: Array<{ symbol: string; name: string }> = [
  { symbol: 'GLD', name: 'SPDR Gold Shares' },
  { symbol: 'VNQ', name: 'Vanguard Real Estate ETF' },
  { symbol: 'BITO', name: 'ProShares Bitcoin Strategy ETF' },
  { symbol: 'DBC', name: 'Invesco DB Commodity Index Tracking Fund' },
];

function generateHoldings(count: number, totalValue: number): Holding[] {
  const holdings: Holding[] = [];
  let remainingValue = totalValue;
  let remainingWeight = 100;

  // Allocate roughly 60% equity, 30% fixed income, 10% alternatives
  const equityCount = Math.floor(count * 0.6);
  const fixedIncomeCount = Math.floor(count * 0.3);
  const altCount = count - equityCount - fixedIncomeCount;

  // Generate equities
  const usedEquities = new Set<string>();
  for (let i = 0; i < equityCount && i < MOCK_EQUITIES.length; i++) {
    let equity = randomFromArray(MOCK_EQUITIES);
    while (usedEquities.has(equity.symbol)) {
      equity = randomFromArray(MOCK_EQUITIES);
    }
    usedEquities.add(equity.symbol);

    const weight = i === equityCount - 1
      ? remainingWeight * 0.6
      : randomBetween(2, Math.min(15, remainingWeight * 0.6 / (equityCount - i)));
    const value = (weight / 100) * totalValue;
    const costBasis = value * randomBetween(0.7, 1.1);
    const quantity = Math.floor(value / randomBetween(50, 500));
    const currentPrice = value / quantity;

    holdings.push({
      id: generateId(),
      symbol: equity.symbol,
      name: equity.name,
      assetClass: 'equity',
      sector: equity.sector,
      geography: 'us',
      quantity,
      costBasis,
      currentPrice,
      currentValue: value,
      weight,
      gainLoss: value - costBasis,
      gainLossPercent: ((value - costBasis) / costBasis) * 100,
      dividendYield: randomBetween(0.5, 3.5),
      peRatio: randomBetween(15, 35),
    });
    remainingWeight -= weight;
    remainingValue -= value;
  }

  // Generate fixed income
  for (let i = 0; i < fixedIncomeCount && i < MOCK_FIXED_INCOME.length; i++) {
    const bond = MOCK_FIXED_INCOME[i];
    const weight = i === fixedIncomeCount - 1
      ? remainingWeight * 0.75
      : randomBetween(3, Math.min(12, remainingWeight * 0.75 / (fixedIncomeCount - i)));
    const value = (weight / 100) * totalValue;
    const costBasis = value * randomBetween(0.95, 1.02);
    const quantity = Math.floor(value / randomBetween(80, 120));
    const currentPrice = value / quantity;

    holdings.push({
      id: generateId(),
      symbol: bond.symbol,
      name: bond.name,
      assetClass: 'fixed-income',
      geography: 'us',
      quantity,
      costBasis,
      currentPrice,
      currentValue: value,
      weight,
      gainLoss: value - costBasis,
      gainLossPercent: ((value - costBasis) / costBasis) * 100,
      dividendYield: randomBetween(3, 5),
    });
    remainingWeight -= weight;
    remainingValue -= value;
  }

  // Generate alternatives
  for (let i = 0; i < altCount && i < MOCK_ALTERNATIVES.length; i++) {
    const alt = MOCK_ALTERNATIVES[i];
    const weight = remainingWeight / (altCount - i);
    const value = (weight / 100) * totalValue;
    const costBasis = value * randomBetween(0.8, 1.2);
    const quantity = Math.floor(value / randomBetween(100, 200));
    const currentPrice = value / quantity;

    holdings.push({
      id: generateId(),
      symbol: alt.symbol,
      name: alt.name,
      assetClass: 'alternatives',
      geography: 'global',
      quantity,
      costBasis,
      currentPrice,
      currentValue: value,
      weight,
      gainLoss: value - costBasis,
      gainLossPercent: ((value - costBasis) / costBasis) * 100,
    });
    remainingWeight -= weight;
  }

  return holdings.sort((a, b) => b.weight - a.weight);
}

// ============================================================================
// MOCK ACCOUNTS DATA
// ============================================================================

const INSTITUTIONS = ['Fidelity', 'Schwab', 'Vanguard', 'Goldman Sachs', 'Morgan Stanley', 'JPMorgan'];

function generateAccounts(clientId: string, totalValue: number): Account[] {
  const accounts: Account[] = [];

  // Brokerage (40% of total)
  const brokerageValue = totalValue * 0.4;
  accounts.push({
    id: `${clientId}-brokerage`,
    name: 'Joint Brokerage',
    type: 'brokerage',
    institution: randomFromArray(INSTITUTIONS),
    taxType: 'taxable',
    balance: brokerageValue,
  });

  // 401k (25% of total)
  const k401Value = totalValue * 0.25;
  accounts.push({
    id: `${clientId}-401k`,
    name: '401(k) Plan',
    type: '401k',
    institution: randomFromArray(INSTITUTIONS),
    taxType: 'tax-deferred',
    balance: k401Value,
  });

  // IRA (15% of total)
  const iraValue = totalValue * 0.15;
  accounts.push({
    id: `${clientId}-ira`,
    name: 'Traditional IRA',
    type: 'ira',
    institution: randomFromArray(INSTITUTIONS),
    taxType: 'tax-deferred',
    balance: iraValue,
  });

  // Roth IRA (10% of total)
  const rothValue = totalValue * 0.1;
  accounts.push({
    id: `${clientId}-roth`,
    name: 'Roth IRA',
    type: 'roth-ira',
    institution: randomFromArray(INSTITUTIONS),
    taxType: 'tax-free',
    balance: rothValue,
  });

  // Trust (10% of total)
  const trustValue = totalValue * 0.1;
  accounts.push({
    id: `${clientId}-trust`,
    name: 'Family Trust',
    type: 'trust',
    institution: randomFromArray(INSTITUTIONS),
    taxType: 'taxable',
    balance: trustValue,
  });

  return accounts;
}

// ============================================================================
// MOCK PERFORMANCE DATA
// ============================================================================

function generatePerformanceHistory(
  months: number,
  startValue: number,
  annualReturn: number
): PerformancePoint[] {
  const points: PerformancePoint[] = [];
  const monthlyReturn = annualReturn / 12 / 100;
  const volatility = 0.02; // 2% monthly volatility

  let portfolioValue = startValue * (1 - monthlyReturn * months);
  let benchmarkValue = portfolioValue * 0.98;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  for (let i = 0; i <= months; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);

    // Add some randomness
    const portfolioChange = monthlyReturn + randomBetween(-volatility, volatility);
    const benchmarkChange = monthlyReturn * 0.9 + randomBetween(-volatility, volatility);

    portfolioValue *= (1 + portfolioChange);
    benchmarkValue *= (1 + benchmarkChange);

    const netFlows = i % 3 === 0 ? randomBetween(5000, 25000) : 0;
    portfolioValue += netFlows;

    points.push({
      date: formatDate(date),
      portfolioValue: Math.round(portfolioValue),
      benchmarkValue: Math.round(benchmarkValue),
      netFlows,
    });
  }

  return points;
}

function generatePerformanceMetrics(ytdReturn: number): PerformanceMetrics {
  return {
    periodReturn: ytdReturn,
    periodReturnDollars: 0, // Calculated from AUM
    mtd: randomBetween(-2, 3),
    qtd: randomBetween(-3, 6),
    ytd: ytdReturn,
    oneYear: ytdReturn + randomBetween(-5, 5),
    threeYear: randomBetween(6, 12),
    fiveYear: randomBetween(7, 11),
    tenYear: randomBetween(8, 10),
    sinceInception: randomBetween(7, 12),
    inceptionDate: '2018-01-15',
    volatility: randomBetween(10, 18),
    sharpeRatio: randomBetween(0.8, 1.5),
    maxDrawdown: randomBetween(-15, -8),
    beta: randomBetween(0.85, 1.15),
    alpha: randomBetween(-1, 3),
  };
}

// ============================================================================
// MOCK ALLOCATION DATA
// ============================================================================

function generateAllocation(holdings: Holding[]): AssetAllocation {
  // By Asset Class
  const assetClassMap = new Map<AssetClass, { value: number; weight: number }>();
  for (const holding of holdings) {
    const existing = assetClassMap.get(holding.assetClass) || { value: 0, weight: 0 };
    assetClassMap.set(holding.assetClass, {
      value: existing.value + holding.currentValue,
      weight: existing.weight + holding.weight,
    });
  }

  const byAssetClass: AllocationSlice[] = Array.from(assetClassMap.entries()).map(
    ([category, data]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' '),
      value: data.value,
      weight: Math.round(data.weight * 10) / 10,
      color: ASSET_CLASS_COLORS[category],
    })
  ).sort((a, b) => b.weight - a.weight);

  // By Geography
  const geoMap = new Map<string, { value: number; weight: number }>();
  for (const holding of holdings) {
    const geo = holding.geography || 'us';
    const existing = geoMap.get(geo) || { value: 0, weight: 0 };
    geoMap.set(geo, {
      value: existing.value + holding.currentValue,
      weight: existing.weight + holding.weight,
    });
  }

  const byGeography: AllocationSlice[] = Array.from(geoMap.entries()).map(
    ([category, data]) => ({
      category: category.toUpperCase().replace('-', ' '),
      value: data.value,
      weight: Math.round(data.weight * 10) / 10,
      color: GEOGRAPHY_COLORS[category as Geography] || '#6B7280',
    })
  ).sort((a, b) => b.weight - a.weight);

  // By Sector (equities only)
  const sectorMap = new Map<string, { value: number; weight: number }>();
  for (const holding of holdings) {
    if (holding.assetClass === 'equity' && holding.sector) {
      const existing = sectorMap.get(holding.sector) || { value: 0, weight: 0 };
      sectorMap.set(holding.sector, {
        value: existing.value + holding.currentValue,
        weight: existing.weight + holding.weight,
      });
    }
  }

  const bySector: AllocationSlice[] = Array.from(sectorMap.entries()).map(
    ([category, data]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' '),
      value: data.value,
      weight: Math.round(data.weight * 10) / 10,
    })
  ).sort((a, b) => b.weight - a.weight);

  return {
    byAssetClass,
    byGeography,
    bySector,
  };
}

// ============================================================================
// SAMPLE CLIENT DATA
// ============================================================================

const SAMPLE_CLIENTS: Array<{
  name: string;
  household: string;
  aum: number;
  advisor: string;
  status: 'on-track' | 'needs-attention' | 'at-risk';
}> = [
  { name: 'Lauren, Ralph Relationship', household: 'Lauren Family', aum: 10038099615, advisor: 'Kimberly Evans', status: 'on-track' },
  { name: 'Tuftin, Leslie and Dean Relationship', household: 'Tuftin Family', aum: 1800000000, advisor: 'Craig Smith', status: 'on-track' },
  { name: 'Waibel, Julie and Brad Relationship', household: 'Waibel Family', aum: 1300000000, advisor: 'Jennifer Walsh', status: 'needs-attention' },
  { name: 'Effron, Blair and Cheryl Relationship', household: 'Effron Family', aum: 1200000000, advisor: 'Michael Chen', status: 'on-track' },
  { name: 'Chantecaille Relationship', household: 'Chantecaille Family', aum: 980000000, advisor: 'Sarah Johnson', status: 'on-track' },
  { name: 'Morrison, David and Linda', household: 'Morrison Family', aum: 45000000, advisor: 'Craig Smith', status: 'on-track' },
  { name: 'Chen, Michael and Sarah', household: 'Chen Family', aum: 18500000, advisor: 'Jennifer Walsh', status: 'on-track' },
  { name: 'Martinez, Roberto and Elena', household: 'Martinez Family', aum: 42000000, advisor: 'Kimberly Evans', status: 'needs-attention' },
  { name: 'Thompson, Eleanor', household: 'Thompson Family', aum: 68000000, advisor: 'Michael Chen', status: 'on-track' },
  { name: 'Williams, James and Patricia', household: 'Williams Family', aum: 125000000, advisor: 'Sarah Johnson', status: 'at-risk' },
];

const SAMPLE_ADVISORS = [
  { id: 'adv-001', name: 'Kimberly Evans', team: 'Private Wealth', role: 'Senior Advisor' },
  { id: 'adv-002', name: 'Craig Smith', team: 'Family Office', role: 'Managing Director' },
  { id: 'adv-003', name: 'Jennifer Walsh', team: 'Private Wealth', role: 'Partner' },
  { id: 'adv-004', name: 'Michael Chen', team: 'Private Wealth', role: 'Senior Advisor' },
  { id: 'adv-005', name: 'Sarah Johnson', team: 'Family Office', role: 'Partner' },
];

// ============================================================================
// PUBLIC API: GENERATE CLIENT REPORT DATA
// ============================================================================

export function generateClientReportData(
  clientIndex: number = 0,
  options: { holdingsCount?: number; months?: number } = {}
): ClientReportData {
  const { holdingsCount = 25, months = 12 } = options;
  const clientData = SAMPLE_CLIENTS[clientIndex % SAMPLE_CLIENTS.length];
  const clientId = generateId();

  const holdings = generateHoldings(holdingsCount, clientData.aum);
  const accounts = generateAccounts(clientId, clientData.aum);
  const ytdReturn = randomBetween(5, 15);
  const performanceHistory = generatePerformanceHistory(months, clientData.aum, ytdReturn);
  const performance = generatePerformanceMetrics(ytdReturn);
  performance.periodReturnDollars = clientData.aum * (ytdReturn / 100);

  const today = new Date();
  const periodStart = new Date(today.getFullYear(), 0, 1);

  const benchmark: Benchmark = {
    name: '60/40 Balanced',
    ticker: 'VBINX',
    performance: {
      ...generatePerformanceMetrics(ytdReturn - 2),
      periodReturn: ytdReturn - 2,
    },
  };

  return {
    reportDate: formatDate(today),
    periodStart: formatDate(periodStart),
    periodEnd: formatDate(today),
    generatedAt: new Date().toISOString(),

    client: {
      id: clientId,
      name: clientData.name,
      household: clientData.household,
      entityId: `${21000000 + clientIndex}`,
      advisor: clientData.advisor,
      advisorTeam: {
        investmentOfficer: clientData.advisor,
        seniorAdvisor: SAMPLE_ADVISORS[1].name,
        trustOfficer: 'David Park',
        clientServicesRep: 'Jenny Mitchell',
      },
      status: clientData.status,
      riskScore: randomInt(55, 85),
      lastMeeting: formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)),
      nextMeeting: formatDate(new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)),
    },

    totalAUM: clientData.aum,
    netWorth: clientData.aum * 1.2,
    periodGainLoss: performance.periodReturnDollars,
    periodGainLossPercent: ytdReturn,

    accounts,
    holdings,
    allocation: generateAllocation(holdings),
    performance,
    performanceHistory,
    benchmark,
  };
}

// ============================================================================
// PUBLIC API: GENERATE ADVISOR REPORT DATA
// ============================================================================

export function generateAdvisorReportData(advisorIndex: number = 0): AdvisorReportData {
  const advisor = SAMPLE_ADVISORS[advisorIndex % SAMPLE_ADVISORS.length];
  const advisorClients = SAMPLE_CLIENTS.filter((c) => c.advisor === advisor.name);

  const today = new Date();
  const periodStart = new Date(today.getFullYear(), 0, 1);

  const clients: ClientSummary[] = advisorClients.map((c, i) => ({
    clientId: generateId(),
    clientName: c.name,
    household: c.household,
    entityId: `${21000000 + i}`,
    aum: c.aum,
    lastMeeting: formatDate(new Date(today.getTime() - randomInt(7, 90) * 24 * 60 * 60 * 1000)),
    nextMeeting: formatDate(new Date(today.getTime() + randomInt(14, 120) * 24 * 60 * 60 * 1000)),
    status: c.status,
    ytdReturn: randomBetween(5, 15),
    mtdReturn: randomBetween(-2, 4),
    planHealth: randomInt(70, 95),
    riskScore: randomInt(50, 85),
  }));

  const totalAUM = clients.reduce((sum, c) => sum + c.aum, 0);

  return {
    reportDate: formatDate(today),
    periodStart: formatDate(periodStart),
    periodEnd: formatDate(today),

    advisorId: advisor.id,
    advisorName: advisor.name,
    team: advisor.team,
    role: advisor.role,

    totalAUM,
    totalClients: clients.length,
    avgClientAUM: totalAUM / clients.length,
    medianClientAUM: clients.sort((a, b) => a.aum - b.aum)[Math.floor(clients.length / 2)]?.aum || 0,
    clientsByStatus: {
      onTrack: clients.filter((c) => c.status === 'on-track').length,
      needsAttention: clients.filter((c) => c.status === 'needs-attention').length,
      atRisk: clients.filter((c) => c.status === 'at-risk').length,
    },

    bookYTDReturn: randomBetween(7, 12),
    bookMTDReturn: randomBetween(-1, 3),
    ytdNetFlows: randomBetween(-50000000, 100000000),
    mtdNetFlows: randomBetween(-5000000, 20000000),

    clients,
    annualRevenue: totalAUM * 0.0075,
    avgFeeRate: 75,
  };
}

// ============================================================================
// PUBLIC API: GENERATE FIRM REPORT DATA
// ============================================================================

export function generateFirmReportData(): FirmReportData {
  const today = new Date();
  const periodStart = new Date(today.getFullYear(), 0, 1);

  const advisors: AdvisorSummary[] = SAMPLE_ADVISORS.map((a) => {
    const advisorClients = SAMPLE_CLIENTS.filter((c) => c.advisor === a.name);
    const totalAUM = advisorClients.reduce((sum, c) => sum + c.aum, 0);
    return {
      advisorId: a.id,
      advisorName: a.name,
      team: a.team,
      role: a.role,
      totalAUM,
      clientCount: advisorClients.length,
      avgClientAUM: advisorClients.length > 0 ? totalAUM / advisorClients.length : 0,
      ytdPerformance: randomBetween(6, 14),
      ytdNetFlows: randomBetween(-20000000, 80000000),
      newClientsYTD: randomInt(0, 5),
    };
  }).sort((a, b) => b.totalAUM - a.totalAUM);

  const totalAUM = advisors.reduce((sum, a) => sum + a.totalAUM, 0);
  const totalClients = advisors.reduce((sum, a) => sum + a.clientCount, 0);

  // Generate AUM history (12 months)
  const aumHistory: AUMHistoryPoint[] = [];
  let currentAUM = totalAUM * 0.9;
  for (let i = 12; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    const netFlows = randomBetween(-50000000, 150000000);
    const marketChange = currentAUM * randomBetween(-0.02, 0.04);
    currentAUM += netFlows + marketChange;
    aumHistory.push({
      date: formatDate(date),
      aum: Math.round(currentAUM),
      netFlows: Math.round(netFlows),
      marketChange: Math.round(marketChange),
    });
  }

  // Client segments
  const segments: ClientSegment[] = [
    { segment: 'Ultra High Net Worth', minAUM: 100000000, clientCount: 8, totalAUM: totalAUM * 0.85, avgAUM: totalAUM * 0.85 / 8 },
    { segment: 'High Net Worth', minAUM: 25000000, maxAUM: 100000000, clientCount: 15, totalAUM: totalAUM * 0.12, avgAUM: totalAUM * 0.12 / 15 },
    { segment: 'Affluent', minAUM: 5000000, maxAUM: 25000000, clientCount: 25, totalAUM: totalAUM * 0.03, avgAUM: totalAUM * 0.03 / 25 },
  ];

  return {
    firmName: 'AlTi Tiedemann Global',
    reportDate: formatDate(today),
    periodStart: formatDate(periodStart),
    periodEnd: formatDate(today),

    totalAUM,
    totalClients,
    totalAdvisors: advisors.length,
    totalHouseholds: Math.ceil(totalClients * 0.7),
    avgClientAUM: totalAUM / totalClients,
    medianClientAUM: 50000000,

    ytdNetFlows: advisors.reduce((sum, a) => sum + (a.ytdNetFlows || 0), 0),
    mtdNetFlows: randomBetween(-10000000, 50000000),
    ytdNewClients: advisors.reduce((sum, a) => sum + (a.newClientsYTD || 0), 0),
    ytdClosedClients: randomInt(1, 5),

    firmYTDReturn: randomBetween(8, 12),
    firmMTDReturn: randomBetween(-1, 3),
    firmQTDReturn: randomBetween(2, 6),

    aumByAdvisor: advisors,
    aumBySegment: segments,
    aumHistory,
  };
}

// ============================================================================
// SAMPLE DATA EXPORTS (for testing)
// ============================================================================

export const SAMPLE_CLIENT_REPORT = generateClientReportData(0, { holdingsCount: 25 });
export const SAMPLE_ADVISOR_REPORT = generateAdvisorReportData(0);
export const SAMPLE_FIRM_REPORT = generateFirmReportData();
