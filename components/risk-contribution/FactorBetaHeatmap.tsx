'use client';

import { useMemo } from 'react';
import type { FactorDecompositionResponse } from '@/lib/risk-types';

interface FactorBetaHeatmapProps {
  data: FactorDecompositionResponse | null;
  isLoading?: boolean;
  className?: string;
}

// Standard factor labels for display
const FACTOR_LABELS: Record<string, string> = {
  market: 'Market',
  size: 'Size (SMB)',
  value: 'Value (HML)',
  momentum: 'Momentum',
  quality: 'Quality',
  low_vol: 'Low Volatility',
  liquidity: 'Liquidity',
  term: 'Term',
  credit: 'Credit',
  inflation: 'Inflation',
};

export default function FactorBetaHeatmap({
  data,
  isLoading = false,
  className = '',
}: FactorBetaHeatmapProps) {
  // Transform factor exposures to heatmap data
  const heatmapData = useMemo(() => {
    if (!data?.portfolio_factor_exposures) return [];

    return Object.entries(data.portfolio_factor_exposures)
      .map(([factor, beta]) => ({
        factor,
        label: FACTOR_LABELS[factor.toLowerCase()] || factor,
        beta: beta as number,
      }))
      .sort((a, b) => Math.abs(b.beta) - Math.abs(a.beta));
  }, [data]);

  // Calculate color scale bounds
  const { minBeta, maxBeta } = useMemo(() => {
    if (heatmapData.length === 0) return { minBeta: -1, maxBeta: 1 };
    const betas = heatmapData.map(d => d.beta);
    const absMax = Math.max(...betas.map(Math.abs), 0.1);
    return { minBeta: -absMax, maxBeta: absMax };
  }, [heatmapData]);

  // Color interpolation: red (negative) -> white (0) -> teal (positive)
  const getBetaColor = (beta: number): string => {
    // Normalize to -1 to 1 range
    const range = Math.max(Math.abs(minBeta), Math.abs(maxBeta));
    const normalized = beta / range;

    if (normalized < 0) {
      // Red gradient for negative
      const t = Math.abs(normalized);
      const r = 239;
      const g = Math.round(68 + (255 - 68) * (1 - t));
      const b = Math.round(68 + (255 - 68) * (1 - t));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Teal gradient for positive
      const t = normalized;
      const r = Math.round(255 - (255 - 15) * t);
      const g = Math.round(255 - (255 - 148) * t);
      const b = Math.round(255 - (255 - 166) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const getTextColor = (beta: number): string => {
    const range = Math.max(Math.abs(minBeta), Math.abs(maxBeta));
    const normalized = Math.abs(beta / range);
    return normalized > 0.5 ? '#fff' : '#333';
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="animate-pulse text-gray-400">Loading factor betas...</div>
      </div>
    );
  }

  if (!data || heatmapData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 rounded ${className}`}>
        <p className="text-gray-400 text-sm">Run analysis to see factor betas</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Heatmap Grid */}
      <div className="grid gap-2" style={{
        gridTemplateColumns: `repeat(${Math.min(heatmapData.length, 5)}, 1fr)`
      }}>
        {heatmapData.map(({ factor, label, beta }) => (
          <div
            key={factor}
            className="p-3 rounded-lg text-center transition-all hover:scale-105 cursor-default shadow-sm"
            style={{ backgroundColor: getBetaColor(beta) }}
            title={`${label}: β = ${beta.toFixed(3)}`}
          >
            <p
              className="text-[11px] font-medium mb-1 truncate"
              style={{ color: getTextColor(beta) }}
            >
              {label}
            </p>
            <p
              className="text-[18px] font-bold"
              style={{ color: getTextColor(beta) }}
            >
              {beta.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }} />
          <span className="text-[11px] text-[#757575]">Negative β</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border border-[#e6e6e6]" />
          <span className="text-[11px] text-[#757575]">β ≈ 0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0F94A6' }} />
          <span className="text-[11px] text-[#757575]">Positive β</span>
        </div>
      </div>

      {/* Risk Decomposition Summary */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10px] text-[#757575] uppercase tracking-wide">Systematic</p>
            <p className="text-[16px] font-semibold text-[#0B6D7B]">
              {(data.systematic_pct * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#757575] uppercase tracking-wide">Specific</p>
            <p className="text-[16px] font-semibold text-[#074269]">
              {((1 - data.systematic_pct) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#757575] uppercase tracking-wide">Total Risk</p>
            <p className="text-[16px] font-semibold text-[#010203]">
              {(data.total_risk * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <p className="text-[10px] text-[#757575] mt-3 text-center">
        Factor betas show sensitivity to risk factors. β &gt; 0 = positive exposure, β &lt; 0 = negative/hedging exposure.
      </p>
    </div>
  );
}
