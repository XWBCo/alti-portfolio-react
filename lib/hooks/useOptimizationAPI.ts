/**
 * Optimization API Integration Hooks
 * React hooks for calling Python optimization service via Next.js API proxy
 */

import { useState, useCallback } from 'react';
import type {
  FrontierRequest,
  FrontierResponse,
  BenchmarkRequest,
  BenchmarkResponse,
  PortfolioInefficienciesRequest,
  PortfolioInefficienciesResponse,
  OptimalPortfolioRequest,
  OptimalPortfolioResponse,
  AssetsResponse,
} from '@/lib/optimization-api-types';

interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic hook for optimization API calls
 */
function useOptimizationEndpoint<TRequest, TResponse>(endpoint: string) {
  const [state, setState] = useState<APIState<TResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (requestData: TRequest): Promise<TResponse | null> => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await fetch('/api/optimization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint, ...requestData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API request failed');
        }

        const result = await response.json();
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState({ data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    [endpoint]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

/**
 * Hook for generating efficient frontier
 */
export function useEfficientFrontier() {
  return useOptimizationEndpoint<FrontierRequest, FrontierResponse>('frontier');
}

/**
 * Hook for calculating blended benchmark
 */
export function useBenchmark() {
  return useOptimizationEndpoint<BenchmarkRequest, BenchmarkResponse>('benchmark');
}

/**
 * Hook for analyzing portfolio inefficiencies
 */
export function usePortfolioInefficiencies() {
  return useOptimizationEndpoint<
    PortfolioInefficienciesRequest,
    PortfolioInefficienciesResponse
  >('inefficiencies');
}

/**
 * Hook for finding optimal portfolio
 */
export function useOptimalPortfolio() {
  return useOptimizationEndpoint<
    OptimalPortfolioRequest,
    OptimalPortfolioResponse
  >('optimal-portfolio');
}

/**
 * Hook for getting available assets
 */
export function useOptimizationAssets() {
  const [state, setState] = useState<APIState<AssetsResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (): Promise<AssetsResponse | null> => {
    setState({ data: null, loading: true, error: null });

    try {
      const response = await fetch('/api/optimization', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assets');
      }

      const result = await response.json();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, loading: false, error: errorMessage });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
