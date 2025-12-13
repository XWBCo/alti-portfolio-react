'use client';

import { useMemo, useState } from 'react';
import {
  calculateBetaMatrix,
  BENCHMARK_OPTIONS,
  type ReturnSeriesAsset,
} from '@/lib/beta-calculator';

interface BetaMatrixHeatmapProps {
  className?: string;
}

export default function BetaMatrixHeatmap({ className = '' }: BetaMatrixHeatmapProps) {
  const [benchmark, setBenchmark] = useState<ReturnSeriesAsset>('Global Equities ACWI');

  const betaData = useMemo(() => calculateBetaMatrix(benchmark), [benchmark]);

  // Calculate color scale bounds
  const { minBeta, maxBeta } = useMemo(() => {
    if (betaData.length === 0) return { minBeta: -1, maxBeta: 2 };
    const betas = betaData.map(d => d.beta);
    return {
      minBeta: Math.min(...betas),
      maxBeta: Math.max(...betas),
    };
  }, [betaData]);

  // Color interpolation: purple (low/negative) -> white (0-0.5) -> teal (high)
  const getBetaColor = (beta: number): string => {
    // Normalize to 0-1 range
    const normalized = (beta - minBeta) / (maxBeta - minBeta);

    if (normalized < 0.5) {
      // Purple to white
      const t = normalized * 2;
      const r = Math.round(211 + (255 - 211) * t);
      const g = Math.round(81 + (255 - 81) * t);
      const b = Math.round(222 + (255 - 222) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // White to teal
      const t = (normalized - 0.5) * 2;
      const r = Math.round(255 - (255 - 15) * t);
      const g = Math.round(255 - (255 - 148) * t);
      const b = Math.round(255 - (255 - 166) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const getTextColor = (beta: number): string => {
    const normalized = (beta - minBeta) / (maxBeta - minBeta);
    return normalized < 0.3 || normalized > 0.7 ? '#fff' : '#333';
  };

  return (
    <div className={className}>
      {/* Benchmark Selector */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-[13px] text-[#757575]">Benchmark:</label>
        <select
          value={benchmark}
          onChange={(e) => setBenchmark(e.target.value as ReturnSeriesAsset)}
          className="px-3 py-1.5 text-[13px] border border-[#e6e6e6] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#0B6D7B]"
        >
          {BENCHMARK_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(betaData.length, 14)}, minmax(70px, 1fr))` }}>
          {betaData.slice(0, 26).map(({ asset, beta }) => (
            <div
              key={asset}
              className="p-2 rounded text-center transition-all hover:scale-105 cursor-default"
              style={{ backgroundColor: getBetaColor(beta) }}
              title={`${asset}: β = ${beta.toFixed(3)}`}
            >
              <p
                className="text-[10px] font-medium truncate"
                style={{ color: getTextColor(beta) }}
              >
                {asset.length > 12 ? asset.substring(0, 12) + '…' : asset}
              </p>
              <p
                className="text-[14px] font-bold"
                style={{ color: getTextColor(beta) }}
              >
                {beta.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#D351DE' }} />
          <span className="text-[11px] text-[#757575]">Low/Negative β</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border border-[#e6e6e6]" />
          <span className="text-[11px] text-[#757575]">β ≈ 0.5</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0F94A6' }} />
          <span className="text-[11px] text-[#757575]">High β</span>
        </div>
      </div>

      {/* Info */}
      <p className="text-[11px] text-[#757575] mt-3 text-center">
        Beta measures sensitivity to benchmark movements. β &gt; 1 = more volatile than benchmark.
      </p>
    </div>
  );
}
