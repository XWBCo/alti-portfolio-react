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
} from 'recharts';
import type { SimulationProbabilities } from '@/lib/types';

interface OutcomeProbabilitiesProps {
  probabilities: SimulationProbabilities | null;
}

export default function OutcomeProbabilities({
  probabilities,
}: OutcomeProbabilitiesProps) {
  if (!probabilities) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded border border-[#e6e6e6]">
        <p className="text-[#757575] text-[15px]">
          Run simulation to see outcome probabilities
        </p>
      </div>
    );
  }

  const data = [
    {
      name: 'Beat Inflation',
      value: probabilities.outperformInflation * 100,
      color: '#0B6D7B',
      description: 'Probability of outperforming inflation',
    },
    {
      name: 'Maintain Value',
      value: probabilities.maintainValue * 100,
      color: '#074269',
      description: 'Probability of maintaining initial value',
    },
    {
      name: 'Significant Loss',
      value: probabilities.significantLoss * 100,
      color: '#F59E0B',
      description: 'Probability of losing >50% of initial value',
    },
    {
      name: 'Depletion',
      value: probabilities.portfolioDepletion * 100,
      color: '#EF4444',
      description: 'Probability of complete portfolio depletion',
    },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; description: string } }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#010203] text-white p-3 rounded shadow-lg text-[13px]">
          <p className="font-medium">{item.name}</p>
          <p className="text-[#00f0db]">{item.value.toFixed(1)}%</p>
          <p className="text-[#A3A3A3] text-[11px] mt-1">{item.description}</p>
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
        Outcome Probabilities
      </h3>

      <ResponsiveContainer width="100%" height="75%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            stroke="#757575"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#757575"
            tick={{ fontSize: 12 }}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="text-center p-3 bg-[#E5F5F3] rounded">
          <p className="text-[24px] font-semibold text-[#0B6D7B]">
            {(probabilities.outperformInflation * 100).toFixed(0)}%
          </p>
          <p className="text-[11px] text-[#757575]">Beat Inflation</p>
        </div>
        <div className="text-center p-3 bg-[#f8f9fa] rounded">
          <p className="text-[24px] font-semibold text-[#074269]">
            {(probabilities.maintainValue * 100).toFixed(0)}%
          </p>
          <p className="text-[11px] text-[#757575]">Maintain Value</p>
        </div>
      </div>
    </div>
  );
}
