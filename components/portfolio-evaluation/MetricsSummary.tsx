'use client';

import { PortfolioWithMetrics } from '@/lib/portfolio-types';
import { formatPercent } from '@/lib/optimization';

interface MetricsSummaryProps {
  portfolios: PortfolioWithMetrics[];
}

const METRIC_LABELS = [
  { key: 'expectedReturn', label: 'Expected Return', format: 'percent' },
  { key: 'risk', label: 'Risk (Std Dev)', format: 'percent' },
  { key: 'var95', label: 'VaR (95%)', format: 'percent' },
  { key: 'cvar95', label: 'CVaR (95%)', format: 'percent' },
  { key: 'sharpeRatio', label: 'Sharpe Ratio', format: 'number' },
] as const;

const PORTFOLIO_COLORS = [
  '#00E7D7',
  '#0F94A6',
  '#0A598C',
  '#8EFFF7',
  '#86E7F4',
  '#78C4F5',
];

export default function MetricsSummary({ portfolios }: MetricsSummaryProps) {
  if (portfolios.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-400">Upload portfolios to see metrics</p>
      </div>
    );
  }

  const formatValue = (value: number, format: 'percent' | 'number') => {
    if (format === 'percent') {
      return formatPercent(value);
    }
    return value.toFixed(2);
  };

  // Find best value for each metric (for highlighting)
  const getBestIndex = (metricKey: string) => {
    const values = portfolios.map(p => p.metrics[metricKey as keyof typeof p.metrics]);
    if (metricKey === 'risk' || metricKey === 'var95' || metricKey === 'cvar95') {
      // Lower is better
      const min = Math.min(...values);
      return values.indexOf(min);
    }
    // Higher is better
    const max = Math.max(...values);
    return values.indexOf(max);
  };

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="text-left p-3 font-medium text-gray-600 border-b">Metric</th>
            {portfolios.map((p, i) => (
              <th key={p.name} className="text-right p-3 font-medium border-b min-w-[100px]">
                <div className="flex items-center justify-end gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length] }}
                  />
                  <span className="text-gray-600">{p.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRIC_LABELS.map(({ key, label, format }) => {
            const bestIdx = getBestIndex(key);
            return (
              <tr key={key} className="hover:bg-gray-50 border-b border-gray-100">
                <td className="p-3 text-gray-700 font-medium">{label}</td>
                {portfolios.map((p, i) => {
                  const value = p.metrics[key as keyof typeof p.metrics];
                  const isBest = i === bestIdx && portfolios.length > 1;
                  return (
                    <td
                      key={p.name}
                      className={`text-right p-3 font-mono ${
                        isBest ? 'text-emerald-600 font-semibold' : 'text-gray-600'
                      }`}
                    >
                      {formatValue(value, format)}
                      {isBest && (
                        <span className="ml-1 text-emerald-500 text-xs">★</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">
          <span className="text-emerald-600 font-semibold">★</span> Best value among portfolios.
          VaR/CVaR shown as potential loss (positive = loss). Sharpe assumes 3% risk-free rate.
        </p>
      </div>
    </div>
  );
}
