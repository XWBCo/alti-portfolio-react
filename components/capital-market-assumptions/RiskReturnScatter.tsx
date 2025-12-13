'use client';

import { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  ZAxis,
} from 'recharts';
import type { CMAAsset, Purpose } from '@/lib/cma-types';
import { PURPOSE_COLORS } from '@/lib/cma-types';

interface RiskReturnScatterProps {
  data: CMAAsset[];
}

interface ScatterPoint {
  x: number;
  y: number;
  z: number; // for bubble size
  name: string;
  purpose: Purpose;
  group: string;
}

type LabelPosition = 'top' | 'bottom' | 'left' | 'right';

export default function RiskReturnScatter({ data }: RiskReturnScatterProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  // Transform data for scatter chart
  const scatterData: ScatterPoint[] = useMemo(() =>
    data.map((item) => ({
      x: item.forecastVolatility * 100,
      y: item.forecastReturn * 100,
      z: 120, // uniform bubble size
      name: item.assetClass,
      purpose: item.purpose,
      group: item.group,
    })), [data]);

  // Smart label positioning to reduce overlap
  const getLabelPositions = useMemo((): Map<string, LabelPosition> => {
    const positions = new Map<string, LabelPosition>();
    const sorted = [...scatterData].sort((a, b) => a.x - b.x);

    sorted.forEach((point, idx) => {
      // Check nearby points
      const nearby = sorted.filter((p, i) =>
        i !== idx &&
        Math.abs(p.x - point.x) < 3 &&
        Math.abs(p.y - point.y) < 2
      );

      if (nearby.length === 0) {
        // No overlap, use right
        positions.set(point.name, 'right');
      } else {
        // Find best position
        const hasAbove = nearby.some(p => p.y > point.y);
        const hasBelow = nearby.some(p => p.y < point.y);
        const hasLeft = nearby.some(p => p.x < point.x);

        if (!hasAbove && point.y < 10) positions.set(point.name, 'top');
        else if (!hasBelow && point.y > 4) positions.set(point.name, 'bottom');
        else if (!hasLeft && point.x > 5) positions.set(point.name, 'left');
        else positions.set(point.name, 'right');
      }
    });

    return positions;
  }, [scatterData]);

  // Group data by purpose for color coding
  const stabilityData = scatterData.filter((d) => d.purpose === 'Stability');
  const diversifiedData = scatterData.filter((d) => d.purpose === 'Diversified');
  const growthData = scatterData.filter((d) => d.purpose === 'Growth');

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterPoint }> }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-[#e6e6e6] rounded shadow-lg z-50">
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

  // Custom dot renderer with labels
  const renderDot = (props: { cx?: number; cy?: number; payload?: ScatterPoint }, color: string): React.ReactElement => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return <g />;

    const isHovered = hoveredPoint === payload.name;
    const labelPos = getLabelPositions.get(payload.name) || 'right';

    // Calculate label offset based on position
    let labelX = cx;
    let labelY = cy;
    let textAnchor: 'start' | 'end' | 'middle' = 'start';

    switch (labelPos) {
      case 'top':
        labelY = cy - 14;
        textAnchor = 'middle';
        break;
      case 'bottom':
        labelY = cy + 18;
        textAnchor = 'middle';
        break;
      case 'left':
        labelX = cx - 10;
        textAnchor = 'end';
        break;
      case 'right':
      default:
        labelX = cx + 10;
        textAnchor = 'start';
        break;
    }

    return (
      <g
        key={payload.name}
        onMouseEnter={() => setHoveredPoint(payload.name)}
        onMouseLeave={() => setHoveredPoint(null)}
        style={{ cursor: 'pointer' }}
      >
        {/* Outer ring on hover */}
        {isHovered && (
          <circle
            cx={cx}
            cy={cy}
            r={12}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={0.5}
          />
        )}
        {/* Main dot */}
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? 8 : 6}
          fill={color}
          stroke="white"
          strokeWidth={2}
          style={{ transition: 'r 0.15s ease' }}
        />
        {/* Label */}
        {showLabels && (
          <text
            x={labelX}
            y={labelY}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            fontSize={isHovered ? 11 : 9}
            fontWeight={isHovered ? 600 : 400}
            fill={isHovered ? color : '#555'}
            style={{
              transition: 'font-size 0.15s ease',
              pointerEvents: 'none',
            }}
          >
            {payload.name}
          </text>
        )}
      </g>
    );
  };

  // Custom legend
  const renderLegend = () => (
    <div className="flex justify-center items-center gap-6 mt-2 flex-wrap">
      {(['Stability', 'Diversified', 'Growth'] as const).map((purpose) => (
        <div key={purpose} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: PURPOSE_COLORS[purpose] }}
          />
          <span className="text-[12px] text-[#4A4A4A]">{purpose}</span>
        </div>
      ))}
      <label className="flex items-center gap-2 ml-4 cursor-pointer">
        <input
          type="checkbox"
          checked={showLabels}
          onChange={(e) => setShowLabels(e.target.checked)}
          className="w-3 h-3 accent-[#0B6D7B]"
        />
        <span className="text-[11px] text-[#757575]">Show labels</span>
      </label>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart margin={{ top: 20, right: 80, bottom: 60, left: 60 }}>
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
          <ZAxis type="number" dataKey="z" range={[80, 80]} />
          <Tooltip content={<CustomTooltip />} />

          {/* Stability scatter */}
          <Scatter
            name="Stability"
            data={stabilityData}
            fill={PURPOSE_COLORS.Stability}
            shape={(props: unknown) => renderDot(props as { cx?: number; cy?: number; payload?: ScatterPoint }, PURPOSE_COLORS.Stability)}
          />

          {/* Diversified scatter */}
          <Scatter
            name="Diversified"
            data={diversifiedData}
            fill={PURPOSE_COLORS.Diversified}
            shape={(props: unknown) => renderDot(props as { cx?: number; cy?: number; payload?: ScatterPoint }, PURPOSE_COLORS.Diversified)}
          />

          {/* Growth scatter */}
          <Scatter
            name="Growth"
            data={growthData}
            fill={PURPOSE_COLORS.Growth}
            shape={(props: unknown) => renderDot(props as { cx?: number; cy?: number; payload?: ScatterPoint }, PURPOSE_COLORS.Growth)}
          />
        </ScatterChart>
      </ResponsiveContainer>
      {renderLegend()}
    </div>
  );
}
