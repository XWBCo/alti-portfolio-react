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

export default function ArchetypeRadar({ scores }: ArchetypeRadarProps) {
  // Transform data for radar chart
  const radarData = (Object.entries(scores) as [ArchetypeId, ArchetypeScore][]).map(
    ([id, data]) => ({
      archetype: ARCHETYPE_DETAILS[id].name,
      percentage: data.percentage,
      fullMark: 100,
    })
  );

  return (
    <div className="bg-white border border-[#e6e6e6] rounded p-4" style={{ height: '320px' }}>
      <h3
        className="text-[16px] font-light text-[#010203] mb-2"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        Archetype Match
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#e6e6e6" />
          <PolarAngleAxis
            dataKey="archetype"
            tick={{ fontSize: 11, fill: '#4A4A4A' }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#757575' }}
            tickCount={5}
          />
          <Radar
            name="Match %"
            dataKey="percentage"
            stroke="#0B6D7B"
            fill="#0B6D7B"
            fillOpacity={0.4}
            strokeWidth={2}
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Match']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e6e6e6',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
