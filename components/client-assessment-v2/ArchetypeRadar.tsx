'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { ArchetypeId, ArchetypeScore } from '@/lib/client-assessment-types';
import { ARCHETYPE_DETAILS } from '@/lib/client-assessment-types';

interface ArchetypeRadarProps {
  scores: Record<ArchetypeId, ArchetypeScore>;
}

// AlTi brand colors for radar
const RADAR_COLORS = {
  fill: '#0B6D7B',
  stroke: '#0A2240',
  grid: '#E5E5E5',
  axis: '#737373',
  accent: '#00F0DB',
};

export default function ArchetypeRadar({ scores }: ArchetypeRadarProps) {
  // Transform data for radar chart - use shorter names for better fit
  const shortNames: Record<ArchetypeId, string> = {
    impact_100: '100% Impact',
    inclusive_innovation: 'Inclusive',
    climate_sustainability: 'Climate',
    integrated_best_ideas: 'Integrated',
  };

  const radarData = (Object.entries(scores) as [ArchetypeId, ArchetypeScore][]).map(
    ([id, data]) => ({
      archetype: shortNames[id],
      fullName: ARCHETYPE_DETAILS[id].name,
      percentage: data.percentage,
      color: ARCHETYPE_DETAILS[id].color,
      fullMark: 100,
    })
  );

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullName: string; percentage: number; color: string } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-[#E5E5E5]">
          <p className="text-[13px] font-medium text-[#0A2240]">{data.fullName}</p>
          <p className="text-[14px] font-semibold" style={{ color: data.color }}>
            {data.percentage}% match
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
          <PolarGrid
            stroke={RADAR_COLORS.grid}
            strokeWidth={1}
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="archetype"
            tick={{
              fontSize: 12,
              fill: RADAR_COLORS.axis,
              fontWeight: 500,
            }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{
              fontSize: 10,
              fill: '#A3A3A3',
            }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name="Match %"
            dataKey="percentage"
            stroke={RADAR_COLORS.stroke}
            fill={RADAR_COLORS.fill}
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{
              r: 4,
              fill: RADAR_COLORS.stroke,
              strokeWidth: 0,
            }}
            activeDot={{
              r: 6,
              fill: RADAR_COLORS.accent,
              stroke: RADAR_COLORS.stroke,
              strokeWidth: 2,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
