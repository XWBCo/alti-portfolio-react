'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PortfolioWithMetrics } from '@/lib/portfolio-types';

interface GrowthProjectionChartProps {
  portfolios: PortfolioWithMetrics[];
  initialInvestment: number;
  years?: number;
}

const COLORS = ['#00E7D7', '#074269', '#821A8B', '#0F94A6', '#E57373'];

export default function GrowthProjectionChart({
  portfolios,
  initialInvestment,
  years = 30,
}: GrowthProjectionChartProps) {
  // Calculate growth paths for each portfolio
  const chartData = useMemo(() => {
    const data: any[] = [];

    for (let year = 0; year <= years; year++) {
      const point: any = { year };

      portfolios.forEach((portfolio, idx) => {
        const growth = Math.pow(1 + portfolio.metrics.expectedReturn, year);
        point[portfolio.name] = initialInvestment * growth;
      });

      // Add 60/40 benchmark
      const benchmarkGrowth = Math.pow(1.06, year); // ~6% benchmark
      point['60/40 Benchmark'] = initialInvestment * benchmarkGrowth;

      data.push(point);
    }

    return data;
  }, [portfolios, initialInvestment, years]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  if (portfolios.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p className="text-sm">Load portfolios to view growth projections</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="year"
          label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickFormatter={formatCurrency}
          label={{ value: 'Portfolio Value', angle: -90, position: 'insideLeft', offset: 10 }}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          labelFormatter={(year) => `Year ${year}`}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{ paddingTop: 25, fontSize: 11 }}
        />

        {/* Benchmark line */}
        <Line
          type="monotone"
          dataKey="60/40 Benchmark"
          stroke="#9CA3AF"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          isAnimationActive={false}
        />

        {/* Portfolio lines */}
        {portfolios.map((portfolio, idx) => (
          <Line
            key={portfolio.name}
            type="monotone"
            dataKey={portfolio.name}
            stroke={COLORS[idx % COLORS.length]}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
