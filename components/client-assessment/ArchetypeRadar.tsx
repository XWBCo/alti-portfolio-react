'use client';

import { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Eye, EyeOff } from 'lucide-react';
import type { ArchetypeId, ArchetypeScore } from '@/lib/client-assessment-types';
import { ARCHETYPE_DETAILS } from '@/lib/client-assessment-types';

interface ArchetypeRadarProps {
  scores: Record<ArchetypeId, ArchetypeScore>;
  topArchetype?: ArchetypeId;
}

export default function ArchetypeRadar({ scores, topArchetype }: ArchetypeRadarProps) {
  const [showComparison, setShowComparison] = useState(false);

  // Get sorted archetypes by rank
  const sortedArchetypes = (Object.entries(scores) as [ArchetypeId, ArchetypeScore][])
    .sort((a, b) => a[1].rank - b[1].rank);

  const topId = sortedArchetypes[0]?.[0];
  const secondId = sortedArchetypes[1]?.[0];

  // Transform data for radar chart
  const radarData = (Object.entries(scores) as [ArchetypeId, ArchetypeScore][]).map(
    ([id, data]) => ({
      archetype: ARCHETYPE_DETAILS[id].name,
      percentage: data.percentage,
      fullMark: 100,
    })
  );

  const topColor = topId ? ARCHETYPE_DETAILS[topId].color : '#0B6D7B';
  const secondColor = secondId ? ARCHETYPE_DETAILS[secondId].color : '#D351DE';

  return (
    <div className="bg-white border border-[#e6e6e6] rounded p-4" style={{ height: '380px' }}>
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-[16px] font-light text-[#010203]"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Archetype Match
        </h3>
        {/* Comparison Toggle */}
        <button
          onClick={() => setShowComparison(!showComparison)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors ${
            showComparison
              ? 'bg-[#074269] text-white'
              : 'bg-[#f0f0f0] text-[#4A4A4A] hover:bg-[#e6e6e6]'
          }`}
        >
          {showComparison ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showComparison ? 'Hide #2' : 'Compare #2'}
        </button>
      </div>

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
          {/* Primary radar - Top archetype */}
          <Radar
            name={topId ? ARCHETYPE_DETAILS[topId].name : 'Match %'}
            dataKey="percentage"
            stroke={topColor}
            fill={topColor}
            fillOpacity={0.4}
            strokeWidth={2}
          />
          {/* Secondary radar - 2nd archetype (comparison) */}
          {showComparison && secondId && (
            <Radar
              name={ARCHETYPE_DETAILS[secondId].name}
              dataKey="percentage"
              stroke={secondColor}
              fill={secondColor}
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Match']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e6e6e6',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          />
          {showComparison && (
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              iconType="line"
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
