'use client';

import {
  Area,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PortfolioWithMetrics } from '@/lib/portfolio-types';

interface IbbotsonConeChartProps {
  selectedPortfolio?: PortfolioWithMetrics;
  benchmarkReturn?: number;
  benchmarkRisk?: number;
  initialInvestment?: number;
  showBenchmarkCone?: boolean;
}

const HORIZON_YEARS = [1, 3, 5, 10, 15, 20, 25, 30];

const CHART_COLORS = {
  benchmarkBand95: 'rgba(130, 26, 139, 0.10)',
  benchmarkBand75: 'rgba(130, 26, 139, 0.20)',
  benchmarkMedian: '#821A8B',
  portfolioBand95: 'rgba(0, 231, 215, 0.12)',
  portfolioBand75: 'rgba(0, 231, 215, 0.25)',
  portfolioMedian: '#00E7D7',
};

interface PercentilePaths {
  median: number[];
  p5: number[];
  p95: number[];
  p25: number[];
  p75: number[];
}

/**
 * Calculate percentile paths using log-normal GBM formulation
 * Following Ibbotson methodology from legacy app_eval.py
 */
function calculateConePaths(
  expectedReturn: number,
  expectedRisk: number,
  initialInvestment: number
): PercentilePaths | null {
  const sigma = Math.max(expectedRisk, 0.0);

  // Avoid invalid log calculations
  if (expectedReturn <= -0.99) {
    return null;
  }

  // GBM drift: mu_c = ln(1 + E[R]) - 0.5 * sigma^2
  const drift = Math.log(1 + expectedReturn) - 0.5 * sigma ** 2;

  // Z-scores for different percentiles (normal distribution)
  const zVals = {
    p5: -1.645,   // 5th percentile
    p95: 1.645,   // 95th percentile
    p25: -0.674,  // 25th percentile
    p75: 0.674,   // 75th percentile
  };

  const median: number[] = [];
  const p5: number[] = [];
  const p95: number[] = [];
  const p25: number[] = [];
  const p75: number[] = [];

  HORIZON_YEARS.forEach((year) => {
    // Median (50th percentile): S_t = S_0 * exp(drift * t)
    median.push(initialInvestment * Math.exp(drift * year));

    // Other percentiles: S_t = S_0 * exp(drift * t + z * sigma * sqrt(t))
    p5.push(initialInvestment * Math.exp(drift * year + zVals.p5 * sigma * Math.sqrt(year)));
    p95.push(initialInvestment * Math.exp(drift * year + zVals.p95 * sigma * Math.sqrt(year)));
    p25.push(initialInvestment * Math.exp(drift * year + zVals.p25 * sigma * Math.sqrt(year)));
    p75.push(initialInvestment * Math.exp(drift * year + zVals.p75 * sigma * Math.sqrt(year)));
  });

  return { median, p5, p95, p25, p75 };
}

interface TooltipPayload {
  name: string;
  value: number;
  dataKey: string;
  color: string;
  payload: {
    year: string;
    [key: string]: string | number | undefined;
  };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || payload.length === 0) return null;

  const year = payload[0].payload.year;

  // Filter to only show visible median lines
  const medianPayloads = payload.filter(p =>
    p.dataKey === 'portfolioMedian' || p.dataKey === 'benchmarkMedian'
  );

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold text-gray-800 mb-2">Year {year}</p>
      <div className="text-sm space-y-1">
        {medianPayloads.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">
                {item.dataKey === 'portfolioMedian' ? 'Portfolio' : 'Benchmark'}
              </span>
            </div>
            <span className="font-medium text-gray-800">
              ${item.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IbbotsonConeChart({
  selectedPortfolio,
  benchmarkReturn,
  benchmarkRisk,
  initialInvestment = 100,
  showBenchmarkCone = false,
}: IbbotsonConeChartProps) {
  // Calculate cone paths
  const portfolioPaths = selectedPortfolio
    ? calculateConePaths(
        selectedPortfolio.metrics.expectedReturn,
        selectedPortfolio.metrics.risk,
        initialInvestment
      )
    : null;

  const benchmarkPaths =
    showBenchmarkCone && benchmarkReturn !== undefined && benchmarkRisk !== undefined
      ? calculateConePaths(benchmarkReturn, benchmarkRisk, initialInvestment)
      : null;

  // Prepare data for chart
  const chartData = HORIZON_YEARS.map((year, idx) => {
    const dataPoint: any = {
      year: year.toString(),
      yearLabel: `${year}y`,
    };

    // Portfolio bands
    if (portfolioPaths) {
      dataPoint.portfolioP5 = portfolioPaths.p5[idx];
      dataPoint.portfolioP95 = portfolioPaths.p95[idx];
      dataPoint.portfolioP25 = portfolioPaths.p25[idx];
      dataPoint.portfolioP75 = portfolioPaths.p75[idx];
      dataPoint.portfolioMedian = portfolioPaths.median[idx];
    }

    // Benchmark bands
    if (benchmarkPaths) {
      dataPoint.benchmarkP5 = benchmarkPaths.p5[idx];
      dataPoint.benchmarkP95 = benchmarkPaths.p95[idx];
      dataPoint.benchmarkP25 = benchmarkPaths.p25[idx];
      dataPoint.benchmarkP75 = benchmarkPaths.p75[idx];
      dataPoint.benchmarkMedian = benchmarkPaths.median[idx];
    }

    return dataPoint;
  });

  // Calculate Y-axis domain
  const allValues: number[] = [];
  chartData.forEach((d) => {
    if (d.portfolioP5) allValues.push(d.portfolioP5);
    if (d.portfolioP95) allValues.push(d.portfolioP95);
    if (d.benchmarkP5) allValues.push(d.benchmarkP5);
    if (d.benchmarkP95) allValues.push(d.benchmarkP95);
  });

  const minValue = allValues.length > 0 ? Math.min(...allValues) * 0.9 : initialInvestment * 0.5;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) * 1.1 : initialInvestment * 3;

  if (!portfolioPaths && !benchmarkPaths) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-400 mb-2">Select a portfolio to view projection cone</p>
        <p className="text-xs text-gray-400">
          Initial investment: ${initialInvestment.toLocaleString()}
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="yearLabel"
          label={{ value: 'Time Horizon (Years)', position: 'bottom', offset: 0 }}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          domain={[minValue, maxValue]}
          tickFormatter={(v) =>
            `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0)}`
          }
          label={{ value: 'Portfolio Value ($)', angle: -90, position: 'insideLeft', offset: 10 }}
          tick={{ fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />

        {/* Benchmark Cone - Render first so it's in the background */}
        {benchmarkPaths && (
          <>
            {/* 5-95% confidence band */}
            <Area
              type="monotone"
              dataKey="benchmarkP95"
              stroke="none"
              fill={CHART_COLORS.benchmarkBand95}
              fillOpacity={1}
              name="Benchmark 5-95%"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="benchmarkP5"
              stroke="none"
              fill="white"
              fillOpacity={1}
              name=""
              isAnimationActive={false}
            />

            {/* 25-75% confidence band */}
            <Area
              type="monotone"
              dataKey="benchmarkP75"
              stroke="none"
              fill={CHART_COLORS.benchmarkBand75}
              fillOpacity={1}
              name="Benchmark 25-75%"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="benchmarkP25"
              stroke="none"
              fill="white"
              fillOpacity={1}
              name=""
              isAnimationActive={false}
            />

            {/* Median line */}
            <Line
              type="monotone"
              dataKey="benchmarkMedian"
              stroke={CHART_COLORS.benchmarkMedian}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: CHART_COLORS.benchmarkMedian }}
              name="Benchmark Median"
              isAnimationActive={false}
            />
          </>
        )}

        {/* Portfolio Cone */}
        {portfolioPaths && (
          <>
            {/* 5-95% confidence band */}
            <Area
              type="monotone"
              dataKey="portfolioP95"
              stroke="none"
              fill={CHART_COLORS.portfolioBand95}
              fillOpacity={1}
              name={`${selectedPortfolio?.name || 'Portfolio'} 5-95%`}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="portfolioP5"
              stroke="none"
              fill="white"
              fillOpacity={1}
              name=""
              isAnimationActive={false}
            />

            {/* 25-75% confidence band */}
            <Area
              type="monotone"
              dataKey="portfolioP75"
              stroke="none"
              fill={CHART_COLORS.portfolioBand75}
              fillOpacity={1}
              name={`${selectedPortfolio?.name || 'Portfolio'} 25-75%`}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="portfolioP25"
              stroke="none"
              fill="white"
              fillOpacity={1}
              name=""
              isAnimationActive={false}
            />

            {/* Median line */}
            <Line
              type="monotone"
              dataKey="portfolioMedian"
              stroke={CHART_COLORS.portfolioMedian}
              strokeWidth={3}
              dot={{
                r: 5,
                fill: CHART_COLORS.portfolioMedian,
                strokeWidth: 1.2,
                stroke: '#000',
              }}
              name={`${selectedPortfolio?.name || 'Portfolio'} Median`}
              isAnimationActive={false}
            />
          </>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
