'use client';

/**
 * React hooks for accessing portfolio data
 */

import { useState, useEffect, useCallback } from 'react';
import type { Portfolio, ReturnSeries, SecurityMetadata, BetaMatrix, CMAData } from '../data-loader';

// Re-export types for convenience
export type { Portfolio, ReturnSeries, SecurityMetadata, BetaMatrix, CMAData };

interface DataSummary {
  portfolioCount: number;
  securityCount: number;
  assetClassCount: number;
  returnPeriods: number;
  betaDates: string[];
  factorCount: number;
}

async function fetchData<T>(type: string, params?: Record<string, string>): Promise<T> {
  const searchParams = new URLSearchParams({ type, ...params });
  const response = await fetch(`/api/data?${searchParams}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch data');
  }
  return response.json();
}

/**
 * Hook to get data summary (counts, available dates, etc.)
 */
export function useDataSummary() {
  const [data, setData] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData<DataSummary>('summary')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

/**
 * Hook to get list of portfolio names
 */
export function usePortfolioNames() {
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData<string[]>('portfolios')
      .then(setNames)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { names, loading, error };
}

/**
 * Hook to get a specific portfolio by name
 */
export function usePortfolio(name: string | null) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      setPortfolio(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchData<Portfolio>('portfolio', { name })
      .then(setPortfolio)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [name]);

  return { portfolio, loading, error };
}

/**
 * Hook to get all portfolios
 */
export function useAllPortfolios() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData<Portfolio[]>('portfolios-all')
      .then(setPortfolios)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { portfolios, loading, error };
}

/**
 * Hook to get return series
 */
export function useReturnSeries(currency: 'USD' | 'EUR' | 'GBP' = 'USD') {
  const [data, setData] = useState<ReturnSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchData<ReturnSeries>('returns', { currency })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [currency]);

  return { data, loading, error };
}

/**
 * Hook to get security metadata
 */
export function useSecurityMetadata() {
  const [metadata, setMetadata] = useState<SecurityMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData<SecurityMetadata[]>('metadata')
      .then(setMetadata)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { metadata, loading, error };
}

/**
 * Hook to get available beta matrix dates
 */
export function useBetaDates() {
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData<string[]>('beta-dates')
      .then(setDates)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { dates, loading, error };
}

/**
 * Hook to get beta matrix for a specific date
 */
export function useBetaMatrix(date?: string) {
  const [data, setData] = useState<BetaMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = date ? { date } : {};
    fetchData<BetaMatrix>('betas', params)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);

  return { data, loading, error };
}

/**
 * Hook to get CMA data
 */
export function useCMAData() {
  const [data, setData] = useState<CMAData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData<CMAData[]>('cma')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

/**
 * Lazy loader - fetch data on demand
 */
export function useDataLoader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async <T>(type: string, params?: Record<string, string>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fetchData<T>(type, params);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { load, loading, error };
}
