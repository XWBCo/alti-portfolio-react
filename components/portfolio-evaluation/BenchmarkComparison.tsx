'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useBenchmark } from '@/lib/hooks/useOptimizationAPI';
import { formatPercent } from '@/lib/optimization';

// Fixed Income Benchmark Options (matching legacy app_eval.py)
const FIXED_INCOME_OPTIONS = [
  { id: 'global_agg', name: 'Global Aggregate', return: 0.040, risk: 0.055 },
  { id: 'us_agg', name: 'US Aggregate', return: 0.038, risk: 0.050 },
  { id: 'us_muni', name: 'US Municipal', return: 0.032, risk: 0.045 },
  { id: 'high_yield', name: 'High Yield', return: 0.055, risk: 0.085 },
] as const;

// Equity benchmark defaults
const EQUITY_BENCHMARK = { return: 0.065, risk: 0.150 };

interface BenchmarkComparisonProps {
  portfolioRisk?: number;
  portfolioReturn?: number;
}

export default function BenchmarkComparison({
  portfolioRisk,
  portfolioReturn,
}: BenchmarkComparisonProps) {
  const [equityPct, setEquityPct] = useState(0.6);
  const [fixedIncomeType, setFixedIncomeType] = useState<string>('global_agg');
  const benchmark = useBenchmark();

  const fixedIncomePct = 1 - equityPct;

  // Get selected FI benchmark data
  const selectedFI = useMemo(() => {
    return FIXED_INCOME_OPTIONS.find(fi => fi.id === fixedIncomeType) || FIXED_INCOME_OPTIONS[0];
  }, [fixedIncomeType]);

  // Calculate blended benchmark locally (fallback if API unavailable)
  const localBenchmark = useMemo(() => {
    const correlation = 0.15; // Typical equity/FI correlation
    const blendedReturn = equityPct * EQUITY_BENCHMARK.return + fixedIncomePct * selectedFI.return;
    const blendedVariance =
      Math.pow(equityPct * EQUITY_BENCHMARK.risk, 2) +
      Math.pow(fixedIncomePct * selectedFI.risk, 2) +
      2 * equityPct * fixedIncomePct * EQUITY_BENCHMARK.risk * selectedFI.risk * correlation;
    const blendedRisk = Math.sqrt(blendedVariance);

    return {
      blended_return: blendedReturn,
      blended_risk: blendedRisk,
      equity_return: EQUITY_BENCHMARK.return,
      equity_risk: EQUITY_BENCHMARK.risk,
      fixed_income_return: selectedFI.return,
      fixed_income_risk: selectedFI.risk,
    };
  }, [equityPct, fixedIncomePct, selectedFI]);

  useEffect(() => {
    benchmark.execute({
      equity_pct: equityPct,
      fixed_income_pct: fixedIncomePct,
    });
  }, [equityPct]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setEquityPct(value);
  };

  // Use API data if available, otherwise use local calculation
  const benchmarkData = benchmark.data || localBenchmark;
  const hasPortfolio = portfolioRisk !== undefined && portfolioReturn !== undefined;

  const returnDeviation = hasPortfolio && benchmarkData
    ? portfolioReturn - benchmarkData.blended_return
    : null;

  const riskDeviation = hasPortfolio && benchmarkData
    ? portfolioRisk - benchmarkData.blended_risk
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Income Type Selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Fixed Income Benchmark
        </label>
        <select
          value={fixedIncomeType}
          onChange={(e) => setFixedIncomeType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#00f0db] focus:border-transparent"
        >
          {FIXED_INCOME_OPTIONS.map((fi) => (
            <option key={fi.id} value={fi.id}>
              {fi.name} ({(fi.return * 100).toFixed(1)}% / {(fi.risk * 100).toFixed(1)}%)
            </option>
          ))}
        </select>
      </div>

      {/* Allocation Slider */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Equity / Fixed Income Split
        </label>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={equityPct}
            onChange={handleSliderChange}
            className="w-full accent-[#00f0db] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">Equity</div>
              <div className="text-lg font-semibold text-[#0B6D7B]">
                {formatPercent(equityPct)}
              </div>
            </div>
            <div className="flex-1 text-right">
              <div className="text-sm font-medium text-gray-700">Fixed Income</div>
              <div className="text-lg font-semibold text-[#074269]">
                {formatPercent(fixedIncomePct)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Metrics */}
      {benchmark.loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Calculating benchmark...</p>
        </div>
      )}

      {benchmark.error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-red-500 mb-1">Failed to load benchmark</p>
            <p className="text-xs text-gray-400">{benchmark.error}</p>
          </div>
        </div>
      )}

      {benchmarkData && (
        <div className="flex-1 space-y-4">
          {/* Blended Benchmark */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Blended Benchmark
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Expected Return</p>
                <p className="text-lg font-semibold text-gray-800">
                  {formatPercent(benchmarkData.blended_return)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Risk (Std Dev)</p>
                <p className="text-lg font-semibold text-gray-800">
                  {formatPercent(benchmarkData.blended_risk)}
                </p>
              </div>
            </div>
          </div>

          {/* Component Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0B6D7B]/5 rounded-lg p-3">
              <h5 className="text-xs font-medium text-[#0B6D7B] mb-2">Equity Component</h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Return:</span>
                  <span className="font-mono text-gray-800">
                    {formatPercent(benchmarkData.equity_return)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Risk:</span>
                  <span className="font-mono text-gray-800">
                    {formatPercent(benchmarkData.equity_risk)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#074269]/5 rounded-lg p-3">
              <h5 className="text-xs font-medium text-[#074269] mb-2">Fixed Income</h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Return:</span>
                  <span className="font-mono text-gray-800">
                    {formatPercent(benchmarkData.fixed_income_return)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Risk:</span>
                  <span className="font-mono text-gray-800">
                    {formatPercent(benchmarkData.fixed_income_risk)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Comparison */}
          {hasPortfolio && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Portfolio vs Benchmark
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white rounded p-2">
                  <span className="text-xs text-gray-600">Return Deviation</span>
                  <div className="flex items-center gap-2">
                    {returnDeviation! > 0 ? (
                      <TrendingUp size={14} className="text-emerald-500" />
                    ) : (
                      <TrendingDown size={14} className="text-red-500" />
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        returnDeviation! > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {returnDeviation! > 0 ? '+' : ''}
                      {formatPercent(returnDeviation!)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white rounded p-2">
                  <span className="text-xs text-gray-600">Risk Deviation</span>
                  <div className="flex items-center gap-2">
                    {riskDeviation! > 0 ? (
                      <TrendingUp size={14} className="text-red-500" />
                    ) : (
                      <TrendingDown size={14} className="text-emerald-500" />
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        riskDeviation! > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {riskDeviation! > 0 ? '+' : ''}
                      {formatPercent(riskDeviation!)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-auto pt-4">
        <p className="text-xs text-gray-400">
          Benchmark uses 60/40 equity/fixed income allocation as default.
          Adjust to match your strategic allocation targets.
        </p>
      </div>
    </div>
  );
}
