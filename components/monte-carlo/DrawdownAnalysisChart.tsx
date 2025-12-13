'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SimulationResult } from '@/lib/types';

interface DrawdownAnalysisChartProps {
  results: (SimulationResult | null)[];
  slotNames: string[];
  slotColors: string[];
  className?: string;
}

interface DrawdownMetrics {
  maxDrawdown: number;
  avgMaxDrawdown: number;
  percentile95Drawdown: number;
  avgRecoveryQuarters: number;
}

/**
 * Calculate drawdown series from a portfolio value path
 * Drawdown = (peak - current) / peak
 */
function calculateDrawdownSeries(path: number[]): number[] {
  let peak = path[0];
  return path.map((value) => {
    if (value > peak) peak = value;
    return peak > 0 ? (peak - value) / peak : 0;
  });
}

/**
 * Calculate max drawdown from a path
 */
function calculateMaxDrawdown(path: number[]): number {
  const drawdowns = calculateDrawdownSeries(path);
  return Math.max(...drawdowns);
}

/**
 * Calculate percentile from array
 */
function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export default function DrawdownAnalysisChart({
  results,
  slotNames,
  slotColors,
  className = '',
}: DrawdownAnalysisChartProps) {
  // Calculate drawdown metrics and percentile series for each slot
  const drawdownData = useMemo(() => {
    return results.map((result, idx) => {
      if (!result || result.paths.length === 0) return null;

      // Calculate max drawdown for each simulation path
      const maxDrawdowns = result.paths.map(calculateMaxDrawdown);

      // Calculate drawdown series for each path, then compute percentiles
      const allDrawdownSeries = result.paths.map(calculateDrawdownSeries);

      // Calculate percentile drawdowns at each time step
      const numSteps = result.paths[0].length;
      const medianDrawdown: number[] = [];
      const p75Drawdown: number[] = [];
      const p95Drawdown: number[] = [];

      for (let t = 0; t < numSteps; t++) {
        const drawdownsAtT = allDrawdownSeries.map(series => series[t]);
        medianDrawdown.push(percentile(drawdownsAtT, 50));
        p75Drawdown.push(percentile(drawdownsAtT, 75));
        p95Drawdown.push(percentile(drawdownsAtT, 95));
      }

      // Calculate aggregate metrics
      const metrics: DrawdownMetrics = {
        maxDrawdown: Math.max(...maxDrawdowns),
        avgMaxDrawdown: maxDrawdowns.reduce((a, b) => a + b, 0) / maxDrawdowns.length,
        percentile95Drawdown: percentile(maxDrawdowns, 95),
        avgRecoveryQuarters: 0, // Would require more complex calculation
      };

      return {
        name: slotNames[idx],
        color: slotColors[idx],
        metrics,
        medianDrawdown,
        p75Drawdown,
        p95Drawdown,
        years: result.years,
      };
    });
  }, [results, slotNames, slotColors]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const validData = drawdownData.filter(Boolean);
    if (validData.length === 0) return [];

    const firstValid = validData[0]!;
    return firstValid.years.map((year, idx) => {
      const point: Record<string, number> = { year };
      drawdownData.forEach((data, slotIdx) => {
        if (data) {
          point[`median_${slotIdx}`] = data.medianDrawdown[idx] * 100;
          point[`p75_${slotIdx}`] = data.p75Drawdown[idx] * 100;
          point[`p95_${slotIdx}`] = data.p95Drawdown[idx] * 100;
        }
      });
      return point;
    });
  }, [drawdownData]);

  const validDrawdownData = drawdownData.filter(Boolean);

  if (validDrawdownData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 rounded ${className}`}>
        <p className="text-gray-400 text-sm">Run simulations to see drawdown analysis</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {validDrawdownData.map((data, idx) => (
          <div
            key={data!.name}
            className="p-3 rounded-lg border"
            style={{ borderColor: data!.color + '40', backgroundColor: data!.color + '10' }}
          >
            <p className="text-[11px] font-medium mb-2" style={{ color: data!.color }}>
              {data!.name}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] text-gray-500 uppercase">Max Drawdown</p>
                <p className="text-[14px] font-semibold text-red-600">
                  -{(data!.metrics.maxDrawdown * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase">Avg Max DD</p>
                <p className="text-[14px] font-semibold text-amber-600">
                  -{(data!.metrics.avgMaxDrawdown * 100).toFixed(1)}%
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] text-gray-500 uppercase">95th Pct Drawdown</p>
                <p className="text-[14px] font-semibold text-orange-600">
                  -{(data!.metrics.percentile95Drawdown * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drawdown Chart */}
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              {validDrawdownData.map((data, idx) => (
                <linearGradient key={`gradient_${idx}`} id={`drawdownGradient_${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={data!.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={data!.color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickFormatter={(v) => `-${v}%`}
              domain={[0, 'auto']}
              reversed
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              formatter={(value: number, name: string) => {
                const slotIdx = parseInt(name.split('_')[1]);
                const type = name.split('_')[0];
                const slotName = validDrawdownData[slotIdx]?.name || '';
                const label = type === 'median' ? 'Median' : type === 'p75' ? '75th Pct' : '95th Pct';
                return [`-${value.toFixed(1)}%`, `${slotName} ${label}`];
              }}
              labelFormatter={(label) => `Year ${label}`}
            />
            <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '20% DD', fontSize: 9, fill: '#f59e0b' }} />
            <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '40% DD', fontSize: 9, fill: '#ef4444' }} />

            {/* Draw 95th percentile (worst case) areas */}
            {validDrawdownData.map((data, idx) => (
              <Area
                key={`p95_${idx}`}
                type="monotone"
                dataKey={`p95_${idx}`}
                stroke={data!.color}
                strokeWidth={1}
                strokeDasharray="4 4"
                fill={`url(#drawdownGradient_${idx})`}
                fillOpacity={0.3}
              />
            ))}

            {/* Draw median drawdown lines */}
            {validDrawdownData.map((data, idx) => (
              <Area
                key={`median_${idx}`}
                type="monotone"
                dataKey={`median_${idx}`}
                stroke={data!.color}
                strokeWidth={2}
                fill="none"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-gray-600" />
          <span className="text-[10px] text-gray-500">Median Drawdown</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 border-t-2 border-dashed border-gray-600" />
          <span className="text-[10px] text-gray-500">95th Percentile (Worst Case)</span>
        </div>
      </div>

      {/* Info */}
      <p className="text-[10px] text-gray-500 mt-2 text-center">
        Drawdown measures peak-to-trough decline. Lower (more negative) values indicate larger losses from historical highs.
      </p>
    </div>
  );
}
