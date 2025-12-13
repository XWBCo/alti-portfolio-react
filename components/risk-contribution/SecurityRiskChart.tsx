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
  Scatter,
  ComposedChart,
} from 'recharts';
import type { RiskContributionsResponse, PortfolioWeights } from '@/lib/risk-types';

interface SecurityRiskChartProps {
  contributions: RiskContributionsResponse | null;
  portfolio: PortfolioWeights;
  topN?: number;
  title?: string;
}

const COLORS = {
  riskContribution: '#074269',
  weight: '#57FFF2',
  overweight: '#EF4444',
  underweight: '#22C55E',
};

interface ChartDataPoint {
  name: string;
  fullName: string;
  pctr: number;
  weight: number;
  riskWeightRatio: number;
}

export default function SecurityRiskChart({
  contributions,
  portfolio,
  topN = 15,
  title = 'Risk Contribution by Holding',
}: SecurityRiskChartProps) {
  if (!contributions) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#757575] text-[13px]">Run analysis to see security risk contributions</p>
      </div>
    );
  }

  // Transform data for chart - combine PCTR with weights
  const chartData: ChartDataPoint[] = Object.entries(contributions.pctr)
    .map(([name, pctr]) => {
      const weight = portfolio[name] || 0;
      return {
        name: name.length > 20 ? name.substring(0, 20) + '…' : name,
        fullName: name,
        pctr: pctr * 100, // Convert to percentage
        weight: weight * 100,
        riskWeightRatio: weight > 0 ? pctr / weight : 0,
      };
    })
    .filter(d => d.weight > 0) // Only show assets with weight
    .sort((a, b) => b.pctr - a.pctr)
    .slice(0, topN);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#757575] text-[13px]">No holdings data available</p>
      </div>
    );
  }

  // Get bar color based on whether risk contribution exceeds weight
  const getBarColor = (pctr: number, weight: number) => {
    const ratio = weight > 0 ? pctr / weight : 0;
    if (ratio > 1.2) return COLORS.overweight; // Risk concentrator
    if (ratio < 0.8) return COLORS.underweight; // Risk diversifier
    return COLORS.riskContribution;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[14px] font-medium text-[#010203]">{title}</h4>
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.riskContribution }} />
            <span className="text-[#757575]">Risk Contrib</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: COLORS.weight, backgroundColor: 'transparent' }} />
            <span className="text-[#757575]">Weight</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.overweight }} />
            <span className="text-[#757575]">Risk Concentrator</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 'auto']}
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              tick={{ fontSize: 10, fill: '#757575' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: '#4A4A4A' }}
              width={120}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'pctr') return [`${value.toFixed(2)}%`, 'Risk Contribution'];
                if (name === 'weight') return [`${value.toFixed(2)}%`, 'Weight'];
                return [value, name];
              }}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.name === label);
                return item?.fullName || label;
              }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e6e6e6',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            />
            <ReferenceLine x={0} stroke="#757575" strokeWidth={1} />

            {/* Risk Contribution Bars */}
            <Bar
              dataKey="pctr"
              name="pctr"
              radius={[0, 4, 4, 0]}
              barSize={14}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.pctr, entry.weight)}
                />
              ))}
            </Bar>

            {/* Weight Diamond Markers */}
            <Scatter
              dataKey="weight"
              name="weight"
              fill={COLORS.weight}
              shape="diamond"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-3 pt-3 border-t border-[#e6e6e6] grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-[10px] text-[#757575] uppercase">Portfolio Vol</p>
          <p className="text-[14px] font-semibold text-[#074269]">
            {(contributions.portfolio_vol_annualized * 100).toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#757575] uppercase">Top Contributor</p>
          <p className="text-[14px] font-semibold text-[#010203]">
            {chartData[0]?.fullName.substring(0, 12) || '-'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#757575] uppercase">Top 5 Risk %</p>
          <p className="text-[14px] font-semibold text-[#621368]">
            {chartData.slice(0, 5).reduce((sum, d) => sum + d.pctr, 0).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
