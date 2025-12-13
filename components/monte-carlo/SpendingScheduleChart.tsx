'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { SimulationResult, SimulationSlotParams } from '@/lib/types';

interface SpendingScheduleChartProps {
  result: SimulationResult | null;
  slotParams: SimulationSlotParams;
  initialValue: number;
  color: string;
  className?: string;
}

/**
 * Format large numbers for display (e.g., 1.5M, 500K)
 */
function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export default function SpendingScheduleChart({
  result,
  slotParams,
  initialValue,
  color,
  className = '',
}: SpendingScheduleChartProps) {
  // Prepare chart data combining portfolio value and spending
  const chartData = useMemo(() => {
    if (!result) return [];

    const customSpending = slotParams.customSpending || {};
    const numQuarters = slotParams.durationQuarters;

    return result.years.map((year, idx) => {
      const quarter = idx + 1;
      const spending = customSpending[quarter] || 0;

      return {
        year,
        quarter,
        median: result.median[idx],
        p25: result.percentile25[idx],
        p75: result.percentile75[idx],
        p5: result.percentile5[idx],
        p95: result.percentile95[idx],
        inflation: result.inflationLine[idx],
        spending,
        cumulativeSpending: Object.entries(customSpending)
          .filter(([q]) => parseInt(q) <= quarter)
          .reduce((sum, [, amt]) => sum + amt, 0),
      };
    });
  }, [result, slotParams]);

  // Calculate spending summary
  const spendingSummary = useMemo(() => {
    const customSpending = slotParams.customSpending || {};
    const entries = Object.entries(customSpending);
    const totalSpending = entries.reduce((sum, [, amt]) => sum + amt, 0);
    const numEvents = entries.filter(([, amt]) => amt > 0).length;
    const avgSpending = numEvents > 0 ? totalSpending / numEvents : 0;

    // Find quarters where spending occurs
    const spendingQuarters = entries
      .filter(([, amt]) => amt > 0)
      .map(([q, amt]) => ({ quarter: parseInt(q), amount: amt }))
      .sort((a, b) => a.quarter - b.quarter);

    return {
      totalSpending,
      numEvents,
      avgSpending,
      spendingQuarters,
      hasSpending: numEvents > 0,
    };
  }, [slotParams.customSpending]);

  if (!result) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 rounded ${className}`}>
        <p className="text-gray-400 text-sm">Run simulation to see spending schedule</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Spending Summary */}
      {spendingSummary.hasSpending && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-amber-800">{slotParams.name} Spending Schedule</p>
              <p className="text-[11px] text-amber-600">
                {spendingSummary.numEvents} spending event{spendingSummary.numEvents !== 1 ? 's' : ''} totaling{' '}
                <span className="font-semibold">{formatCompact(spendingSummary.totalSpending)}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-amber-600 uppercase">Initial Value</p>
              <p className="text-[14px] font-semibold text-amber-800">{formatCompact(initialValue)}</p>
            </div>
          </div>

          {/* Spending Events List */}
          {spendingSummary.spendingQuarters.length > 0 && spendingSummary.spendingQuarters.length <= 8 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {spendingSummary.spendingQuarters.map(({ quarter, amount }) => (
                <span
                  key={quarter}
                  className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px]"
                >
                  Q{quarter}: {formatCompact(amount)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {!spendingSummary.hasSpending && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-[12px] text-gray-500">
            No custom spending events configured. Upload a spending schedule to see projections with withdrawals.
          </p>
        </div>
      )}

      {/* Chart */}
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis
              yAxisId="value"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickFormatter={(v) => formatCompact(v)}
              width={60}
            />
            <YAxis
              yAxisId="spending"
              orientation="right"
              tick={{ fontSize: 10, fill: '#f59e0b' }}
              tickFormatter={(v) => formatCompact(v)}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  median: 'Median Portfolio',
                  p25: '25th Percentile',
                  p75: '75th Percentile',
                  spending: 'Spending',
                  cumulativeSpending: 'Cumulative Spending',
                  inflation: 'Inflation-Adjusted',
                };
                return [formatCompact(value), labels[name] || name];
              }}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: '10px' }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  median: 'Median',
                  p25: '25th Pct',
                  p75: '75th Pct',
                  spending: 'Spending',
                  cumulativeSpending: 'Cumul. Spending',
                };
                return labels[value] || value;
              }}
            />

            {/* Confidence band (25-75 percentile) */}
            <Area
              yAxisId="value"
              type="monotone"
              dataKey="p75"
              stroke="none"
              fill={color}
              fillOpacity={0.15}
            />
            <Area
              yAxisId="value"
              type="monotone"
              dataKey="p25"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
            />

            {/* Median portfolio line */}
            <Line
              yAxisId="value"
              type="monotone"
              dataKey="median"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />

            {/* Inflation line */}
            <Line
              yAxisId="value"
              type="monotone"
              dataKey="inflation"
              stroke="#9ca3af"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
            />

            {/* Spending bars */}
            {spendingSummary.hasSpending && (
              <Bar
                yAxisId="spending"
                dataKey="spending"
                fill="#f59e0b"
                opacity={0.7}
                barSize={8}
              />
            )}

            {/* Cumulative spending line */}
            {spendingSummary.hasSpending && (
              <Line
                yAxisId="spending"
                type="stepAfter"
                dataKey="cumulativeSpending"
                stroke="#dc2626"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            )}

            {/* Reference line at initial value */}
            <ReferenceLine
              yAxisId="value"
              y={initialValue}
              stroke="#6b7280"
              strokeDasharray="5 5"
              label={{ value: 'Initial', fontSize: 9, fill: '#6b7280' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Explanation */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5" style={{ backgroundColor: color }} />
          <span>Median Portfolio Value</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 opacity-20" style={{ backgroundColor: color }} />
          <span>25-75th Percentile Range</span>
        </div>
        {spendingSummary.hasSpending && (
          <>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-500 opacity-70" />
              <span>Spending Events</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 bg-red-600 border-dashed" style={{ borderTopWidth: 2 }} />
              <span>Cumulative Spending</span>
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <p className="text-[10px] text-gray-500 mt-2 text-center">
        Shows projected portfolio values alongside scheduled spending events. Yellow bars indicate withdrawal amounts.
      </p>
    </div>
  );
}
