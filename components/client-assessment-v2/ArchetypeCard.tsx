'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ArchetypeScore, ArchetypeDetail } from '@/lib/client-assessment-types';

interface ArchetypeCardProps {
  archetype: ArchetypeDetail;
  score: ArchetypeScore;
  isTopMatch: boolean;
}

// Score dimensions with weights (simulated breakdown)
const SCORE_DIMENSIONS = [
  { id: 'climate', label: 'Climate Alignment', weight: 0.30 },
  { id: 'social', label: 'Social Impact', weight: 0.25 },
  { id: 'governance', label: 'Governance', weight: 0.20 },
  { id: 'returns', label: 'Return Expectations', weight: 0.25 },
];

export default function ArchetypeCard({ archetype, score, isTopMatch }: ArchetypeCardProps) {
  const [isExpanded, setIsExpanded] = useState(isTopMatch);

  // Generate simulated dimension scores based on overall percentage
  // In production, these would come from actual survey scoring
  const dimensionScores = SCORE_DIMENSIONS.map((dim, idx) => {
    // Create variation around the main score
    const variance = ((idx * 7 + score.percentage) % 20) - 10;
    const dimScore = Math.min(100, Math.max(0, score.percentage + variance));
    return { ...dim, score: Math.round(dimScore) };
  });

  return (
    <div
      className={`border rounded overflow-hidden transition-all ${
        isTopMatch ? 'border-2' : 'border-[#e6e6e6]'
      }`}
      style={{ borderColor: isTopMatch ? archetype.color : undefined }}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-white flex items-center justify-between hover:bg-[#fafafa] transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Rank badge */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[14px] font-semibold"
            style={{ backgroundColor: archetype.color }}
          >
            {score.rank}
          </div>

          {/* Name and description */}
          <div className="text-left">
            <h4 className="text-[15px] font-semibold text-[#010203]">
              {archetype.name}
              {isTopMatch && (
                <span className="ml-2 text-[11px] px-2 py-0.5 bg-[#0B6D7B] text-white rounded">
                  Top Match
                </span>
              )}
            </h4>
            <p className="text-[12px] text-[#757575]">{archetype.description}</p>
          </div>
        </div>

        {/* Score and expand icon */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[20px] font-semibold" style={{ color: archetype.color }}>
              {score.percentage}%
            </p>
            <p className="text-[11px] text-[#757575]">Match</p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[#757575]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#757575]" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 bg-[#fafafa] border-t border-[#e6e6e6]">
          {/* Score Breakdown Bars */}
          <div className="mb-4">
            <h5 className="text-[12px] font-semibold text-[#4A4A4A] mb-3 uppercase tracking-wide">
              Score Breakdown
            </h5>
            <div className="space-y-2">
              {dimensionScores.map((dim) => (
                <div key={dim.id} className="flex items-center gap-3">
                  <span className="text-[11px] text-[#757575] w-[120px]">{dim.label}</span>
                  <div className="flex-1 h-2 bg-[#e6e6e6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${dim.score}%`,
                        backgroundColor: archetype.color,
                        opacity: 0.7 + (dim.score / 100) * 0.3,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-[#4A4A4A] w-[36px] text-right">
                    {dim.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Why this matches */}
            <div>
              <h5 className="text-[12px] font-semibold text-[#0B6D7B] mb-2 uppercase tracking-wide">
                Why This Matches
              </h5>
              <ul className="space-y-1">
                {archetype.whyMatch.map((item, idx) => (
                  <li key={idx} className="text-[12px] text-[#4A4A4A] flex items-start gap-2">
                    <span className="text-[#0B6D7B]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas of alignment */}
            <div>
              <h5 className="text-[12px] font-semibold text-[#074269] mb-2 uppercase tracking-wide">
                Areas of Alignment
              </h5>
              <ul className="space-y-1">
                {archetype.areasOfAlignment.map((item, idx) => (
                  <li key={idx} className="text-[12px] text-[#4A4A4A] flex items-start gap-2">
                    <span className="text-[#074269]">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
