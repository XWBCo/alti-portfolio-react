'use client';

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { SimulationResult } from '@/lib/types';
import { formatCurrency } from '@/lib/simulation';

interface SimulationChartProps {
  result: SimulationResult | null;
  showPaths?: boolean;
  numPathsToShow?: number;
}

export default function SimulationChart({
  result,
  showPaths = true,
  numPathsToShow = 100,
}: SimulationChartProps) {
  if (!result) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded border border-[#e6e6e6]">
        <div className="text-center">
          <p className="text-[#757575] text-[15px]">
            Configure parameters and run simulation to see results
          </p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = result.years.map((year, index) => {
    const dataPoint: Record<string, number> = {
      year,
      median: result.median[index],
      p25: result.percentile25[index],
      p75: result.percentile75[index],
      p5: result.percentile5[index],
      p95: result.percentile95[index],
      inflation: result.inflationLine[index],
    };

    // Add sample paths for visualization
    if (showPaths) {
      const step = Math.max(1, Math.floor(result.paths.length / numPathsToShow));
      for (let i = 0; i < result.paths.length; i += step) {
        dataPoint[`path${i}`] = result.paths[i][index];
      }
    }

    return dataPoint;
  });

  // Get path keys for rendering
  const pathKeys = showPaths
    ? Object.keys(chartData[0]).filter((key) => key.startsWith('path'))
    : [];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: number }) => {
    if (active && payload && payload.length) {
      const medianValue = payload.find((p) => p.name === 'median')?.value;
      const p25Value = payload.find((p) => p.name === 'p25')?.value;
      const p75Value = payload.find((p) => p.name === 'p75')?.value;
      const inflationValue = payload.find((p) => p.name === 'inflation')?.value;

      return (
        <div className="bg-[#010203] text-white p-4 rounded shadow-lg text-[13px]">
          <p className="font-medium mb-2">Year {label?.toFixed(1)}</p>
          {medianValue !== undefined && (
            <p className="text-[#00f0db]">Median: {formatCurrency(medianValue)}</p>
          )}
          {p25Value !== undefined && p75Value !== undefined && (
            <p className="text-[#0B6D7B]">
              25th-75th: {formatCurrency(p25Value)} - {formatCurrency(p75Value)}
            </p>
          )}
          {inflationValue !== undefined && (
            <p className="text-[#57FFF2]">Inflation: {formatCurrency(inflationValue)}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full bg-white rounded border border-[#e6e6e6] p-6">
      <h3
        className="text-[#010203] mb-4"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: '18px',
          fontWeight: 400,
        }}
      >
        Portfolio Value Projection
      </h3>

      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
          <XAxis
            dataKey="year"
            stroke="#757575"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `Y${value}`}
          />
          <YAxis
            stroke="#757575"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Reference line at initial value */}
          <ReferenceLine
            y={result.paths[0][0]}
            stroke="#A3A3A3"
            strokeDasharray="5 5"
            label={{ value: 'Initial', position: 'right', fill: '#A3A3A3', fontSize: 11 }}
          />

          {/* Sample paths (semi-transparent) */}
          {showPaths &&
            pathKeys.slice(0, 50).map((pathKey) => (
              <Line
                key={pathKey}
                type="monotone"
                dataKey={pathKey}
                stroke="#E3E3E3"
                strokeWidth={0.5}
                dot={false}
                legendType="none"
                isAnimationActive={false}
              />
            ))}

          {/* 5th-95th percentile band */}
          <Area
            type="monotone"
            dataKey="p95"
            stroke="none"
            fill="#E5F5F3"
            fillOpacity={0.5}
            legendType="none"
          />
          <Area
            type="monotone"
            dataKey="p5"
            stroke="none"
            fill="#ffffff"
            legendType="none"
          />

          {/* 25th-75th percentile band */}
          <Area
            type="monotone"
            dataKey="p75"
            stroke="none"
            fill="#C3E6E3"
            fillOpacity={0.7}
            name="25th-75th Percentile"
          />
          <Area
            type="monotone"
            dataKey="p25"
            stroke="none"
            fill="#ffffff"
            legendType="none"
          />

          {/* Inflation benchmark */}
          <Line
            type="monotone"
            dataKey="inflation"
            stroke="#57FFF2"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Inflation Benchmark"
          />

          {/* Median line */}
          <Line
            type="monotone"
            dataKey="median"
            stroke="#074269"
            strokeWidth={3}
            dot={false}
            name="Median"
          />

          {/* Percentile lines */}
          <Line
            type="monotone"
            dataKey="p25"
            stroke="#0B6D7B"
            strokeWidth={1.5}
            dot={false}
            name="25th Percentile"
          />
          <Line
            type="monotone"
            dataKey="p75"
            stroke="#0B6D7B"
            strokeWidth={1.5}
            dot={false}
            name="75th Percentile"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
