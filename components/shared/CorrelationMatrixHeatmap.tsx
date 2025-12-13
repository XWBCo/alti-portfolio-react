'use client';

import { useMemo } from 'react';
import type { CorrelationMatrix } from '@/lib/portfolio-types';

interface CorrelationMatrixHeatmapProps {
  correlationMatrix: CorrelationMatrix;
  assetNames?: string[];
  className?: string;
  showValues?: boolean;
  compactMode?: boolean;
}

export default function CorrelationMatrixHeatmap({
  correlationMatrix,
  assetNames,
  className = '',
  showValues = true,
  compactMode = false,
}: CorrelationMatrixHeatmapProps) {
  // Get asset names from matrix if not provided
  const assets = useMemo(() => {
    if (assetNames && assetNames.length > 0) return assetNames;
    return Object.keys(correlationMatrix);
  }, [correlationMatrix, assetNames]);

  // Color interpolation: red (negative) -> white (0) -> blue (positive)
  const getCorrelationColor = (corr: number): string => {
    // Clamp to [-1, 1]
    const value = Math.max(-1, Math.min(1, corr));

    if (value < 0) {
      // Red gradient for negative correlations
      const intensity = Math.abs(value);
      const r = 239;
      const g = Math.round(68 + (255 - 68) * (1 - intensity));
      const b = Math.round(68 + (255 - 68) * (1 - intensity));
      return `rgb(${r}, ${g}, ${b})`;
    } else if (value > 0) {
      // Blue/Teal gradient for positive correlations
      const intensity = value;
      const r = Math.round(255 - (255 - 11) * intensity);
      const g = Math.round(255 - (255 - 109) * intensity);
      const b = Math.round(255 - (255 - 123) * intensity);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return '#ffffff';
  };

  const getTextColor = (corr: number): string => {
    const absCorr = Math.abs(corr);
    return absCorr > 0.5 ? '#fff' : '#333';
  };

  // Truncate asset name for compact display
  const truncateName = (name: string, maxLen: number = 8): string => {
    if (name.length <= maxLen) return name;
    return name.slice(0, maxLen - 1) + '…';
  };

  // Larger cells to prevent compression - wider for readability
  const cellSize = compactMode ? 'min-w-[48px] w-[48px] h-10' : 'min-w-[56px] w-[56px] h-12';
  const fontSize = compactMode ? 'text-[9px]' : 'text-[11px]';
  const headerFontSize = compactMode ? 'text-[9px]' : 'text-[10px]';
  // Extra height for rotated column headers
  const headerHeight = compactMode ? 'h-24' : 'h-28';
  // Row label width
  const rowLabelWidth = compactMode ? 'min-w-[80px] w-[80px]' : 'min-w-[100px] w-[100px]';

  return (
    <div className={`overflow-auto ${className}`}>
      <div className="inline-block">
        {/* Header Row - taller to accommodate rotated labels */}
        <div className="flex">
          <div className={`${rowLabelWidth} flex-shrink-0`} /> {/* Empty corner */}
          {assets.map((asset) => (
            <div
              key={`header-${asset}`}
              className={`${cellSize} ${headerHeight} flex items-end justify-center pb-2 ${headerFontSize} text-gray-600 font-medium flex-shrink-0`}
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              title={asset}
            >
              {truncateName(asset, compactMode ? 10 : 14)}
            </div>
          ))}
        </div>

        {/* Matrix Rows */}
        {assets.map((rowAsset, rowIdx) => (
          <div key={`row-${rowAsset}`} className="flex">
            {/* Row Label */}
            <div
              className={`${rowLabelWidth} flex items-center justify-end pr-3 ${headerFontSize} text-gray-600 font-medium flex-shrink-0`}
              title={rowAsset}
            >
              {truncateName(rowAsset, compactMode ? 10 : 14)}
            </div>

            {/* Correlation Cells */}
            {assets.map((colAsset, colIdx) => {
              const corr = correlationMatrix[rowAsset]?.[colAsset] ?? 0;
              const isDiagonal = rowIdx === colIdx;

              return (
                <div
                  key={`cell-${rowAsset}-${colAsset}`}
                  className={`${cellSize} flex items-center justify-center ${fontSize} font-mono transition-transform hover:scale-110 hover:z-10 cursor-default border border-white/20 flex-shrink-0`}
                  style={{
                    backgroundColor: isDiagonal ? '#e5e7eb' : getCorrelationColor(corr),
                    color: isDiagonal ? '#6b7280' : getTextColor(corr),
                  }}
                  title={`${rowAsset} ↔ ${colAsset}: ${corr.toFixed(2)}`}
                >
                  {showValues && (isDiagonal ? '1.00' : corr.toFixed(2))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }} />
          <span className="text-[10px] text-gray-500">Negative (-1)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border border-gray-200" />
          <span className="text-[10px] text-gray-500">Zero (0)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0B6D7B' }} />
          <span className="text-[10px] text-gray-500">Positive (+1)</span>
        </div>
      </div>

      {/* Info */}
      <p className="text-[10px] text-gray-500 mt-2 text-center">
        Correlation measures how assets move together. Values range from -1 (inverse) to +1 (same direction).
      </p>
    </div>
  );
}
