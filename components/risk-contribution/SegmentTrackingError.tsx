'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SegmentTEResult {
  growth_te: number;
  stability_te: number;
  total_te: number;
  growth_contribution: number;
  stability_contribution: number;
  growth_allocation: number;
  stability_allocation: number;
}

interface SegmentTrackingErrorProps {
  data: SegmentTEResult | null;
  isLoading?: boolean;
}

const COLORS = {
  growth: '#0A598C',
  stability: '#0F94A6',
};

export default function SegmentTrackingError({ data, isLoading }: SegmentTrackingErrorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-[#757575]">Calculating segment TE...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#757575] text-[13px]">Run analysis to see segment tracking error</p>
      </div>
    );
  }

  const contributionData = [
    { name: 'Growth', value: data.growth_contribution, color: COLORS.growth },
    { name: 'Stability', value: data.stability_contribution, color: COLORS.stability },
  ];

  return (
    <div className="h-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-[#0A598C]/10 to-[#0A598C]/5 rounded-lg p-3">
          <p className="text-[10px] text-[#757575] uppercase tracking-wide mb-1">Growth TE</p>
          <p className="text-[20px] font-semibold text-[#0A598C]">
            {(data.growth_te * 100).toFixed(2)}%
          </p>
          <p className="text-[10px] text-[#757575]">
            {(data.growth_allocation * 100).toFixed(0)}% allocation
          </p>
        </div>
        <div className="bg-gradient-to-br from-[#0F94A6]/10 to-[#0F94A6]/5 rounded-lg p-3">
          <p className="text-[10px] text-[#757575] uppercase tracking-wide mb-1">Stability TE</p>
          <p className="text-[20px] font-semibold text-[#0F94A6]">
            {(data.stability_te * 100).toFixed(2)}%
          </p>
          <p className="text-[10px] text-[#757575]">
            {(data.stability_allocation * 100).toFixed(0)}% allocation
          </p>
        </div>
        <div className="bg-[#f8f9fa] rounded-lg p-3">
          <p className="text-[10px] text-[#757575] uppercase tracking-wide mb-1">Total TE</p>
          <p className="text-[20px] font-semibold text-[#010203]">
            {(data.total_te * 100).toFixed(2)}%
          </p>
          <p className="text-[10px] text-[#757575]">Combined</p>
        </div>
      </div>

      {/* Contribution Pie Chart */}
      <div className="flex items-center gap-4">
        <div className="w-[140px] h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={contributionData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {contributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e6e6e6',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.growth }} />
                <span className="text-[12px] text-[#4A4A4A]">Growth Contribution</span>
              </div>
              <span className="text-[12px] font-medium text-[#010203]">
                {(data.growth_contribution * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-[#e6e6e6] rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.min(data.growth_contribution * 100, 100)}%`,
                  backgroundColor: COLORS.growth,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.stability }} />
                <span className="text-[12px] text-[#4A4A4A]">Stability Contribution</span>
              </div>
              <span className="text-[12px] font-medium text-[#010203]">
                {(data.stability_contribution * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-[#e6e6e6] rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.min(data.stability_contribution * 100, 100)}%`,
                  backgroundColor: COLORS.stability,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <p className="text-[10px] text-[#757575] mt-4 text-center">
        Growth: Equity-like assets vs benchmark. Stability: Fixed income assets vs benchmark.
      </p>
    </div>
  );
}
