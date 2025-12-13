'use client';

import { Download, AlertCircle, CheckCircle } from 'lucide-react';
import type { OptimalPortfolioResponse } from '@/lib/optimization-api-types';
import { formatPercent } from '@/lib/optimization';
import { ASSET_CLASSES } from '@/lib/cma-data';

interface OptimizationResultsProps {
  result: OptimalPortfolioResponse | null;
  currentWeights?: Record<string, number>;
  onExport?: () => void;
}

export default function OptimizationResults({
  result,
  currentWeights,
  onExport,
}: OptimizationResultsProps) {
  if (!result) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <AlertCircle size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400">Set optimization target to see results</p>
        </div>
      </div>
    );
  }

  // Calculate changes from current portfolio
  const changes = currentWeights
    ? Object.entries(result.weights).map(([asset, newWeight]) => {
        const currentWeight = currentWeights[asset] || 0;
        const change = newWeight - currentWeight;
        return { asset, currentWeight, newWeight, change };
      })
    : null;

  // Sort by absolute change (largest first)
  const sortedChanges = changes?.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return (
    <div className="h-full flex flex-col">
      {/* Header with Metrics */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            Optimal Portfolio Found
          </h3>
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 text-gray-600 hover:text-[#00f0db] hover:bg-gray-50 rounded transition-colors"
              title="Export Results"
            >
              <Download size={16} />
            </button>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#00f0db]/10 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Expected Return</p>
            <p className="text-lg font-semibold text-[#0B6D7B]">
              {formatPercent(result.expected_return)}
            </p>
          </div>
          <div className="bg-[#074269]/10 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Risk (Std Dev)</p>
            <p className="text-lg font-semibold text-[#074269]">
              {formatPercent(result.risk)}
            </p>
          </div>
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Sharpe Ratio</p>
            <p className="text-lg font-semibold text-gray-800">
              {result.sharpe_ratio.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Constraint Info */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
          {result.constraint_used === 'return' && (
            <span>Optimized for target return constraint</span>
          )}
          {result.constraint_used === 'risk' && (
            <span>Optimized for target risk constraint</span>
          )}
          {result.constraint_used === 'none' && (
            <span>Unconstrained optimization (max Sharpe ratio)</span>
          )}
        </div>
      </div>

      {/* Weights Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left p-2 font-medium text-gray-600 border-b">Asset Class</th>
              {currentWeights && (
                <th className="text-right p-2 font-medium text-gray-600 border-b min-w-[80px]">
                  Current
                </th>
              )}
              <th className="text-right p-2 font-medium text-gray-600 border-b min-w-[80px]">
                Optimal
              </th>
              {currentWeights && (
                <th className="text-right p-2 font-medium text-gray-600 border-b min-w-[80px]">
                  Change
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedChanges ? (
              sortedChanges.map(({ asset, currentWeight, newWeight, change }) => {
                const assetInfo = ASSET_CLASSES.find(a => a.name === asset);
                return (
                  <tr key={asset} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="p-2 text-gray-700">{asset}</td>
                    <td className="text-right p-2 font-mono text-gray-600">
                      {currentWeight > 0.001 ? formatPercent(currentWeight) : '-'}
                    </td>
                    <td className="text-right p-2 font-mono text-gray-800 font-semibold">
                      {newWeight > 0.001 ? formatPercent(newWeight) : '-'}
                    </td>
                    <td
                      className={`text-right p-2 font-mono ${
                        Math.abs(change) > 0.001
                          ? change > 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {Math.abs(change) > 0.001
                        ? `${change > 0 ? '+' : ''}${formatPercent(change)}`
                        : '-'}
                    </td>
                  </tr>
                );
              })
            ) : (
              // No current portfolio comparison
              Object.entries(result.weights)
                .filter(([_, weight]) => weight > 0.001)
                .sort((a, b) => b[1] - a[1])
                .map(([asset, weight]) => (
                  <tr key={asset} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="p-2 text-gray-700">{asset}</td>
                    <td className="text-right p-2 font-mono text-gray-800 font-semibold">
                      {formatPercent(weight)}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      {currentWeights && sortedChanges && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-emerald-50 rounded p-2">
              <p className="text-gray-600 mb-1">Positions Increased</p>
              <p className="text-lg font-semibold text-emerald-700">
                {sortedChanges.filter(c => c.change > 0.001).length}
              </p>
            </div>
            <div className="bg-red-50 rounded p-2">
              <p className="text-gray-600 mb-1">Positions Decreased</p>
              <p className="text-lg font-semibold text-red-700">
                {sortedChanges.filter(c => c.change < -0.001).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
