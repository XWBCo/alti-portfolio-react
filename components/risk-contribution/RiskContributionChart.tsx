'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { RiskContributionsResponse, PortfolioWeights } from '@/lib/risk-types';

interface RiskContributionChartProps {
  contributions: RiskContributionsResponse | null;
  portfolio: PortfolioWeights;
}

const PCTR_COLOR = '#074269';
const WEIGHT_COLOR = '#57FFF2';

export default function RiskContributionChart({
  contributions,
  portfolio,
}: RiskContributionChartProps) {
  if (!contributions) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-400">Run analysis to see risk contributions</p>
      </div>
    );
  }

  // Prepare chart data - sort by PCTR descending
  const chartData = Object.entries(contributions.pctr)
    .map(([name, pctr]) => ({
      name,
      pctr: pctr * 100,
      weight: (portfolio[name] || 0) * 100,
    }))
    .filter(d => d.pctr > 0.5 || d.weight > 0.5) // Filter small values
    .sort((a, b) => b.pctr - a.pctr)
    .slice(0, 15); // Top 15

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          type="number"
          domain={[0, 'auto']}
          tickFormatter={(v) => `${v.toFixed(0)}%`}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(value: number) => `${value.toFixed(1)}%`}
          labelStyle={{ fontWeight: 'bold' }}
        />
        <Legend />
        <Bar dataKey="pctr" name="Risk Contribution" fill={PCTR_COLOR} />
        <Bar dataKey="weight" name="Weight" fill={WEIGHT_COLOR} />
      </BarChart>
    </ResponsiveContainer>
  );
}
