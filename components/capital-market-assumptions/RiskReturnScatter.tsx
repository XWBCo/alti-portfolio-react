'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  Cell,
  Legend,
  LabelList,
} from 'recharts';
import type { CMAAsset, Purpose } from '@/lib/cma-types';
import { PURPOSE_COLORS } from '@/lib/cma-types';

interface RiskReturnScatterProps {
  data: CMAAsset[];
}

interface ScatterPoint {
  x: number;
  y: number;
  name: string;
  purpose: Purpose;
  group: string;
}

export default function RiskReturnScatter({ data }: RiskReturnScatterProps) {
  // Transform data for scatter chart
  const scatterData: ScatterPoint[] = data.map((item) => ({
    x: item.forecastVolatility * 100,
    y: item.forecastReturn * 100,
    name: item.assetClass,
    purpose: item.purpose,
    group: item.group,
  }));

  // Group data by purpose for color coding
  const stabilityData = scatterData.filter((d) => d.purpose === 'Stability');
  const diversifiedData = scatterData.filter((d) => d.purpose === 'Diversified');
  const growthData = scatterData.filter((d) => d.purpose === 'Growth');

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterPoint }> }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-[#e6e6e6] rounded shadow-lg">
          <p className="font-semibold text-[14px] text-[#010203] mb-1">{point.name}</p>
          <p className="text-[12px] text-[#757575] mb-2">{point.group}</p>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PURPOSE_COLORS[point.purpose] }}
            />
            <span className="text-[12px] text-[#4A4A4A]">{point.purpose}</span>
          </div>
          <p className="text-[13px] text-[#010203]">
            Return: <span className="font-semibold">{point.y.toFixed(2)}%</span>
          </p>
          <p className="text-[13px] text-[#010203]">
            Volatility: <span className="font-semibold">{point.x.toFixed(2)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderLegend = () => (
    <div className="flex justify-center gap-6 mt-2">
      {(['Stability', 'Diversified', 'Growth'] as const).map((purpose) => (
        <div key={purpose} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: PURPOSE_COLORS[purpose] }}
          />
          <span className="text-[12px] text-[#4A4A4A]">{purpose}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 'auto']}
            tickFormatter={(v) => `${v.toFixed(0)}`}
            tick={{ fontSize: 12, fill: '#4A4A4A' }}
            axisLine={{ stroke: '#e6e6e6' }}
          >
            <Label
              value="Volatility (%)"
              position="bottom"
              offset={40}
              style={{ fontSize: 14, fill: '#4A4A4A', fontFamily: 'Arial, sans-serif' }}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 'auto']}
            tickFormatter={(v) => `${v.toFixed(0)}`}
            tick={{ fontSize: 12, fill: '#4A4A4A' }}
            axisLine={{ stroke: '#e6e6e6' }}
          >
            <Label
              value="Expected Return (%)"
              angle={-90}
              position="left"
              offset={40}
              style={{ fontSize: 14, fill: '#4A4A4A', fontFamily: 'Arial, sans-serif' }}
            />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />

          {/* Stability scatter */}
          <Scatter
            name="Stability"
            data={stabilityData}
            fill={PURPOSE_COLORS.Stability}
          >
            {stabilityData.map((entry, index) => (
              <Cell
                key={`stability-${index}`}
                fill={PURPOSE_COLORS.Stability}
                stroke="white"
                strokeWidth={2}
              />
            ))}
            <LabelList
              dataKey="name"
              position="right"
              offset={8}
              style={{ fontSize: 10, fill: '#333', fontFamily: 'Arial, sans-serif' }}
            />
          </Scatter>

          {/* Diversified scatter */}
          <Scatter
            name="Diversified"
            data={diversifiedData}
            fill={PURPOSE_COLORS.Diversified}
          >
            {diversifiedData.map((entry, index) => (
              <Cell
                key={`diversified-${index}`}
                fill={PURPOSE_COLORS.Diversified}
                stroke="white"
                strokeWidth={2}
              />
            ))}
            <LabelList
              dataKey="name"
              position="right"
              offset={8}
              style={{ fontSize: 10, fill: '#333', fontFamily: 'Arial, sans-serif' }}
            />
          </Scatter>

          {/* Growth scatter */}
          <Scatter
            name="Growth"
            data={growthData}
            fill={PURPOSE_COLORS.Growth}
          >
            {growthData.map((entry, index) => (
              <Cell
                key={`growth-${index}`}
                fill={PURPOSE_COLORS.Growth}
                stroke="white"
                strokeWidth={2}
              />
            ))}
            <LabelList
              dataKey="name"
              position="right"
              offset={8}
              style={{ fontSize: 10, fill: '#333', fontFamily: 'Arial, sans-serif' }}
            />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      {renderLegend()}
    </div>
  );
}
