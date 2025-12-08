/**
 * Data Loader Utilities
 * Loads production CSV data for portfolio analytics
 */

import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface PortfolioHolding {
  security: string;      // Tier4 name
  weight: number;
  portfolioName: string;
}

export interface Portfolio {
  name: string;
  holdings: { security: string; weight: number }[];
  totalWeight: number;
}

export interface SecurityMetadata {
  security: string;
  currency: string;
  tier1: string;
  tier2: string;
  tier3: string;
  tier4: string;
  pccBuildingBlocks: string;
  proxy: string;
  index: string;
}

export interface ReturnSeries {
  assetClasses: string[];
  returns: number[][];  // rows = periods, cols = asset classes
}

export interface BetaMatrix {
  securities: string[];
  factors: string[];
  betas: number[][];  // rows = securities, cols = factors
}

export interface CMAData {
  assetClass: string;
  expectedReturn: number;
  volatility: number;
  tier1: string;
  currency: string;
}

// ============================================================================
// FILE PATHS
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'data');

export const DATA_PATHS = {
  portfolioUniverse: path.join(DATA_DIR, 'Portfolios', 'Portfolio Universe.csv'),
  benchmarkUniverse: path.join(DATA_DIR, 'Portfolios', 'Benchmark Universe.csv'),
  returnSeries: path.join(DATA_DIR, 'return_series.csv'),
  returnSeriesEur: path.join(DATA_DIR, 'return_series_eur.csv'),
  returnSeriesGbp: path.join(DATA_DIR, 'return_series_gbp.csv'),
  metadata: path.join(DATA_DIR, 'Returns', 'metadata.csv'),
  instrumentReturns: path.join(DATA_DIR, 'Returns', 'instruments_returns.csv'),
  factorReturns: path.join(DATA_DIR, 'Returns', 'factor_returns.csv'),
  cmaData: path.join(DATA_DIR, 'cma_data.csv'),
  covarianceDir: path.join(DATA_DIR, 'Covariance_Matrix'),
};

// ============================================================================
// CSV PARSING UTILITIES
// ============================================================================

function parseCSV<T>(filePath: string): T[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse<T>(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return result.data;
}

function parseCSVNoHeader(filePath: string): string[][] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse<string[]>(fileContent, {
    header: false,
    skipEmptyLines: true,
  });
  return result.data;
}

// ============================================================================
// PORTFOLIO LOADERS
// ============================================================================

/**
 * Load all portfolios from Portfolio Universe.csv
 * Returns a map of portfolio name -> holdings
 */
export function loadPortfolioUniverse(): Map<string, Portfolio> {
  const raw = parseCSV<{ Tier4: string; Weight: number; 'Portfolio Name': string }>(
    DATA_PATHS.portfolioUniverse
  );

  const portfolioMap = new Map<string, Portfolio>();

  for (const row of raw) {
    const name = row['Portfolio Name'];
    const holding = {
      security: row.Tier4,
      weight: typeof row.Weight === 'number' ? row.Weight : parseFloat(String(row.Weight)) || 0,
    };

    if (!portfolioMap.has(name)) {
      portfolioMap.set(name, {
        name,
        holdings: [],
        totalWeight: 0,
      });
    }

    const portfolio = portfolioMap.get(name)!;
    portfolio.holdings.push(holding);
    portfolio.totalWeight += holding.weight;
  }

  return portfolioMap;
}

/**
 * Get list of all portfolio names
 */
export function getPortfolioNames(): string[] {
  const portfolios = loadPortfolioUniverse();
  return Array.from(portfolios.keys()).sort();
}

/**
 * Get a specific portfolio by name
 */
export function getPortfolio(name: string): Portfolio | undefined {
  const portfolios = loadPortfolioUniverse();
  return portfolios.get(name);
}

// ============================================================================
// RETURN SERIES LOADERS
// ============================================================================

/**
 * Load return series for a specific currency
 */
export function loadReturnSeries(currency: 'USD' | 'EUR' | 'GBP' = 'USD'): ReturnSeries {
  const filePath = currency === 'EUR'
    ? DATA_PATHS.returnSeriesEur
    : currency === 'GBP'
      ? DATA_PATHS.returnSeriesGbp
      : DATA_PATHS.returnSeries;

  const rows = parseCSVNoHeader(filePath);

  if (rows.length === 0) {
    return { assetClasses: [], returns: [] };
  }

  const assetClasses = rows[0];
  const returns: number[][] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].map(val => {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    });
    returns.push(row);
  }

  return { assetClasses, returns };
}

/**
 * Get historical returns for specific asset classes
 */
export function getAssetClassReturns(
  assetClasses: string[],
  currency: 'USD' | 'EUR' | 'GBP' = 'USD'
): Map<string, number[]> {
  const series = loadReturnSeries(currency);
  const result = new Map<string, number[]>();

  for (const assetClass of assetClasses) {
    const idx = series.assetClasses.indexOf(assetClass);
    if (idx !== -1) {
      result.set(assetClass, series.returns.map(row => row[idx]));
    }
  }

  return result;
}

// ============================================================================
// METADATA LOADERS
// ============================================================================

/**
 * Load security metadata
 */
export function loadSecurityMetadata(): SecurityMetadata[] {
  const raw = parseCSV<Record<string, string>>(DATA_PATHS.metadata);

  return raw.map(row => ({
    security: row.Security || '',
    currency: row.Currency || '',
    tier1: row.Tier1 || '',
    tier2: row.Tier2 || '',
    tier3: row.Tier3 || '',
    tier4: row.Tier4 || '',
    pccBuildingBlocks: row['PCC Building Blocks '] || '',
    proxy: row.Proxy || '',
    index: row.Index || '',
  }));
}

/**
 * Get metadata for a specific security
 */
export function getSecurityMetadata(securityName: string): SecurityMetadata | undefined {
  const metadata = loadSecurityMetadata();
  return metadata.find(m => m.security === securityName || m.tier4 === securityName);
}

// ============================================================================
// BETA / COVARIANCE LOADERS
// ============================================================================

/**
 * Get available beta matrix dates
 */
export function getAvailableBetaDates(): string[] {
  const files = fs.readdirSync(DATA_PATHS.covarianceDir);
  const dates = files
    .filter(f => f.startsWith('betas_') && f.endsWith('.csv') && !f.includes('_p'))
    .map(f => f.replace('betas_', '').replace('.csv', ''))
    .sort()
    .reverse();
  return dates;
}

/**
 * Load beta matrix for a specific date
 */
export function loadBetaMatrix(date?: string): BetaMatrix {
  const dates = getAvailableBetaDates();
  const targetDate = date || dates[0]; // Use latest if not specified

  const filePath = path.join(DATA_PATHS.covarianceDir, `betas_${targetDate}.csv`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Beta matrix not found for date: ${targetDate}`);
  }

  const rows = parseCSVNoHeader(filePath);

  if (rows.length < 2) {
    return { securities: [], factors: [], betas: [] };
  }

  const factors = rows[0].slice(1); // First row is headers, skip first column
  const securities: string[] = [];
  const betas: number[][] = [];

  for (let i = 1; i < rows.length; i++) {
    securities.push(rows[i][0]);
    const betaRow = rows[i].slice(1).map(val => {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    });
    betas.push(betaRow);
  }

  return { securities, factors, betas };
}

/**
 * Get factor covariance matrix for a specific date
 */
export function loadFactorCovariance(date?: string): { factors: string[]; covariance: number[][] } {
  const dates = getAvailableBetaDates();
  const targetDate = date || dates[0];

  const filePath = path.join(DATA_PATHS.covarianceDir, `factor_cov_${targetDate}.csv`);

  if (!fs.existsSync(filePath)) {
    // Try without date suffix
    const files = fs.readdirSync(DATA_PATHS.covarianceDir);
    const covFile = files.find(f => f.startsWith('factor_cov_'));
    if (!covFile) {
      throw new Error('Factor covariance matrix not found');
    }
    return loadFactorCovariance(covFile.replace('factor_cov_', '').replace('.csv', ''));
  }

  const rows = parseCSVNoHeader(filePath);

  if (rows.length < 2) {
    return { factors: [], covariance: [] };
  }

  const factors = rows[0].slice(1);
  const covariance: number[][] = [];

  for (let i = 1; i < rows.length; i++) {
    const covRow = rows[i].slice(1).map(val => {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    });
    covariance.push(covRow);
  }

  return { factors, covariance };
}

// ============================================================================
// CMA DATA LOADER
// ============================================================================

/**
 * Load CMA (Capital Market Assumptions) data
 */
export function loadCMAData(): CMAData[] {
  if (!fs.existsSync(DATA_PATHS.cmaData)) {
    return [];
  }

  const raw = parseCSV<Record<string, string | number>>(DATA_PATHS.cmaData);

  return raw.map(row => ({
    assetClass: String(row['Asset Class'] || row.assetClass || ''),
    expectedReturn: parseFloat(String(row['Expected Return'] || row.expectedReturn || 0)),
    volatility: parseFloat(String(row['Volatility'] || row.volatility || 0)),
    tier1: String(row['Tier1'] || row.tier1 || ''),
    currency: String(row['Currency'] || row.currency || 'USD'),
  }));
}

// ============================================================================
// SUMMARY / STATS
// ============================================================================

/**
 * Get data summary for diagnostics
 */
export function getDataSummary(): {
  portfolioCount: number;
  securityCount: number;
  assetClassCount: number;
  returnPeriods: number;
  betaDates: string[];
  factorCount: number;
} {
  const portfolios = loadPortfolioUniverse();
  const metadata = loadSecurityMetadata();
  const returnSeries = loadReturnSeries();
  const betaDates = getAvailableBetaDates();
  const betaMatrix = betaDates.length > 0 ? loadBetaMatrix(betaDates[0]) : { factors: [] };

  return {
    portfolioCount: portfolios.size,
    securityCount: metadata.length,
    assetClassCount: returnSeries.assetClasses.length,
    returnPeriods: returnSeries.returns.length,
    betaDates,
    factorCount: betaMatrix.factors.length,
  };
}
