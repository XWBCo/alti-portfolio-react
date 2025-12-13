'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { FactorDecompositionResponse } from '@/lib/risk-types';

interface ActiveFactorExposureChartProps {
  data: FactorDecompositionResponse | null;
  benchmarkExposures?: Record<string, number>;
  topN?: number;
}

const COLORS = {
  positive: '#074269',
  negative: '#57FFF2',
};

interface ChartDataPoint {
  factor: string;
  fullFactor: string;
  activeExposure: number;
  portfolioExposure: number;
  benchmarkExposure: number;
}

export default function ActiveFactorExposureChart({
  data,
  benchmarkExposures = {},
  topN = 10,
}: ActiveFactorExposureChartProps) {
  if (!data || !data.portfolio_factor_exposures) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#757575] text-[13px]">Run analysis to see factor exposures</p>
      </div>
    );
  }

  // Calculate active exposures (portfolio - benchmark)
  const chartData: ChartDataPoint[] = Object.entries(data.portfolio_factor_exposures)
    .map(([factor, portfolioExposure]) => {
      const benchmarkExposure = benchmarkExposures[factor] || 0;
      const activeExposure = (portfolioExposure as number) - benchmarkExposure;
      return {
        factor: factor.length > 18 ? factor.substring(0, 18) + '…' : factor,
        fullFactor: factor,
        activeExposure,
        portfolioExposure: portfolioExposure as number,
        benchmarkExposure,
      };
    })
    .sort((a, b) => Math.abs(b.activeExposure) - Math.abs(a.activeExposure))
    .slice(0, topN);

  // Get top 3 positive and top 3 negative for summary
  const sortedByExposure = [...chartData].sort((a, b) => b.activeExposure - a.activeExposure);
  const topPositive = sortedByExposure.filter(d => d.activeExposure > 0).slice(0, 3);
  const topNegative = sortedByExposure.filter(d => d.activeExposure < 0).slice(-3).reverse();

  // Sort chart data by active exposure for visual clarity
  const sortedChartData = [...chartData].sort((a, b) => a.activeExposure - b.activeExposure);

  return (
    <div className="h-full flex flex-col">
      {/* Top/Bottom Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Top Overweights */}
        <div className="bg-[#074269]/5 rounded p-2">
          <p className="text-[10px] text-[#757575] uppercase mb-1">Top Overweights</p>
          {topPositive.length > 0 ? (
            <div className="space-y-1">
              {topPositive.map((item, i) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span className="text-[#4A4A4A] truncate mr-2">{item.fullFactor}</span>
                  <span className="font-mono text-[#074269]">+{(item.activeExposure * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[#757575]">None</p>
          )}
        </div>

        {/* Top Underweights */}
        <div className="bg-[#0F94A6]/5 rounded p-2">
          <p className="text-[10px] text-[#757575] uppercase mb-1">Top Underweights</p>
          {topNegative.length > 0 ? (
            <div className="space-y-1">
              {topNegative.map((item, i) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span className="text-[#4A4A4A] truncate mr-2">{item.fullFactor}</span>
                  <span className="font-mono text-[#0F94A6]">{(item.activeExposure * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[#757575]">None</p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedChartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" horizontal={false} />
            <XAxis
              type="number"
              domain={['auto', 'auto']}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fontSize: 10, fill: '#757575' }}
            />
            <YAxis
              type="category"
              dataKey="factor"
              tick={{ fontSize: 10, fill: '#4A4A4A' }}
              width={120}
            />
            <Tooltip
              formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Active Exposure']}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.factor === label);
                return item?.fullFactor || label;
              }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e6e6e6',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            />
            <ReferenceLine x={0} stroke="#757575" strokeWidth={1} />
            <Bar dataKey="activeExposure" radius={[0, 4, 4, 0]} barSize={12}>
              {sortedChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.activeExposure >= 0 ? COLORS.positive : COLORS.negative}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-6 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.positive }} />
          <span className="text-[#757575]">Overweight vs Benchmark</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.negative }} />
          <span className="text-[#757575]">Underweight vs Benchmark</span>
        </div>
      </div>
    </div>
  );
}
