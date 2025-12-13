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

interface FactorExposureChartProps {
  data: FactorDecompositionResponse | null;
  isLoading?: boolean;
}

export default function FactorExposureChart({ data, isLoading }: FactorExposureChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-[#757575]">Loading factor data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#757575] text-[13px]">Run analysis to see factor exposures</p>
      </div>
    );
  }

  // Transform factor exposures for chart
  const chartData = Object.entries(data.portfolio_factor_exposures || {})
    .map(([factor, exposure]) => ({
      factor: factor.length > 15 ? factor.substring(0, 15) + '…' : factor,
      fullFactor: factor,
      exposure: exposure as number,
      contribution: (data.factor_contributions?.[factor] || 0) as number,
    }))
    .sort((a, b) => Math.abs(b.exposure) - Math.abs(a.exposure))
    .slice(0, 12);

  const getExposureColor = (exposure: number) => {
    if (exposure > 0.5) return '#0B6D7B';
    if (exposure > 0) return '#3B9EAA';
    if (exposure > -0.5) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="h-full">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-[#f8f9fa] rounded p-3 text-center">
          <p className="text-[10px] text-[#757575] uppercase mb-1">Systematic Risk</p>
          <p className="text-[16px] font-semibold text-[#074269]">
            {(data.systematic_risk * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-[#757575]">
            ({(data.systematic_pct * 100).toFixed(0)}% of total)
          </p>
        </div>
        <div className="bg-[#f8f9fa] rounded p-3 text-center">
          <p className="text-[10px] text-[#757575] uppercase mb-1">Specific Risk</p>
          <p className="text-[16px] font-semibold text-[#621368]">
            {(data.specific_risk * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-[#757575]">
            ({((1 - data.systematic_pct) * 100).toFixed(0)}% of total)
          </p>
        </div>
        <div className="bg-[#f8f9fa] rounded p-3 text-center">
          <p className="text-[10px] text-[#757575] uppercase mb-1">Total Risk</p>
          <p className="text-[16px] font-semibold text-[#010203]">
            {(data.total_risk * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Factor Exposure Bar Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
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
              width={75}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${(value * 100).toFixed(2)}%`,
                name === 'exposure' ? 'Exposure' : 'Contribution',
              ]}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.factor === label);
                return item?.fullFactor || label;
              }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e6e6e6',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
            <ReferenceLine x={0} stroke="#757575" strokeWidth={1} />
            <Bar dataKey="exposure" name="exposure" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getExposureColor(entry.exposure)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[220px]">
          <p className="text-[#757575] text-[13px]">No factor exposure data available</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#0B6D7B' }} />
          <span className="text-[10px] text-[#757575]">High Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3B9EAA' }} />
          <span className="text-[10px] text-[#757575]">Low Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F59E0B' }} />
          <span className="text-[10px] text-[#757575]">Low Negative</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }} />
          <span className="text-[10px] text-[#757575]">High Negative</span>
        </div>
      </div>
    </div>
  );
}
