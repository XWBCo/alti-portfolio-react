'use client';

import { StressScenarioResult } from '@/lib/risk-types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StressScenariosTableProps {
  results: StressScenarioResult[];
  isLoading?: boolean;
}

export default function StressScenariosTable({ results, isLoading }: StressScenariosTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded border border-[#e6e6e6] p-6">
        <h3 className="text-[16px] font-light text-[#010203] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Stress Scenario Analysis
        </h3>
        <div className="flex items-center justify-center h-32 text-gray-400">
          <div className="animate-pulse">Loading scenarios...</div>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="bg-white rounded border border-[#e6e6e6] p-6">
        <h3 className="text-[16px] font-light text-[#010203] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Stress Scenario Analysis
        </h3>
        <div className="text-center text-gray-400 py-8">
          <p>Run analysis to see stress scenario results</p>
        </div>
      </div>
    );
  }

  const getReturnColor = (value: number) => {
    if (value > 5) return 'text-green-600';
    if (value > 0) return 'text-green-500';
    if (value > -5) return 'text-amber-600';
    return 'text-red-600';
  };

  const getReturnIcon = (value: number) => {
    if (value > 0) return <TrendingUp size={14} className="text-green-500" />;
    if (value < 0) return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-gray-400" />;
  };

  return (
    <div className="bg-white rounded border border-[#e6e6e6] p-6">
      <h3 className="text-[16px] font-light text-[#010203] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
        Stress Scenario Analysis
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Scenario
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Return
              </th>
              {results[0]?.benchmark_return !== undefined && (
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Benchmark
                </th>
              )}
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Max DD
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Volatility
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => (
              <tr
                key={result.scenario}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    {getReturnIcon(result.portfolio_return)}
                    <span className="font-medium text-gray-700">{result.scenario}</span>
                  </div>
                </td>
                <td className={`text-right py-3 px-2 font-mono font-semibold ${getReturnColor(result.portfolio_return)}`}>
                  {result.portfolio_return > 0 ? '+' : ''}{result.portfolio_return.toFixed(1)}%
                </td>
                {result.benchmark_return !== undefined && (
                  <td className={`text-right py-3 px-2 font-mono ${getReturnColor(result.benchmark_return)}`}>
                    {result.benchmark_return > 0 ? '+' : ''}{result.benchmark_return.toFixed(1)}%
                  </td>
                )}
                <td className="text-right py-3 px-2 font-mono text-red-600">
                  {result.max_drawdown.toFixed(1)}%
                </td>
                <td className="text-right py-3 px-2 font-mono text-gray-600">
                  {result.volatility.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-[#074269]/5 rounded text-xs text-[#074269]">
        <strong>Note:</strong> Historical scenarios show how the portfolio would have performed during specific market periods.
        Returns are cumulative for the scenario period. Max DD is the maximum peak-to-trough decline.
      </div>
    </div>
  );
}
