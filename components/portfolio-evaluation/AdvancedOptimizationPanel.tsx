'use client';

import { useState } from 'react';
import { Sliders, Target, TrendingUp, Loader2 } from 'lucide-react';
import { useOptimalPortfolio } from '@/lib/hooks/useOptimizationAPI';
import type { OptimizationMode } from '@/lib/optimization-api-types';

interface AdvancedOptimizationPanelProps {
  mode: OptimizationMode;
  capsTemplate: 'standard' | 'tight' | 'loose';
  onResultsReady?: (results: any) => void;
}

export default function AdvancedOptimizationPanel({
  mode,
  capsTemplate,
  onResultsReady,
}: AdvancedOptimizationPanelProps) {
  const [optimizationType, setOptimizationType] = useState<'return' | 'risk' | 'sharpe'>('sharpe');
  const [targetReturn, setTargetReturn] = useState(0.065); // 6.5%
  const [targetRisk, setTargetRisk] = useState(0.10); // 10%

  const optimalPortfolio = useOptimalPortfolio();

  const handleOptimize = async () => {
    const request: any = {
      mode,
      caps_template: capsTemplate,
    };

    if (optimizationType === 'return') {
      request.target_return = targetReturn;
    } else if (optimizationType === 'risk') {
      request.target_risk = targetRisk;
    }
    // For 'sharpe', no additional constraints

    const result = await optimalPortfolio.execute(request);
    if (result && onResultsReady) {
      onResultsReady(result);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Sliders size={16} />
          Advanced Optimization
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Find optimal portfolio using Python optimization engine
        </p>
      </div>

      {/* Optimization Type */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Optimization Goal
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="opt-type"
              value="sharpe"
              checked={optimizationType === 'sharpe'}
              onChange={(e) => setOptimizationType(e.target.value as any)}
              className="text-[#00f0db] focus:ring-[#00f0db]"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Max Sharpe Ratio</p>
              <p className="text-xs text-gray-500">Best risk-adjusted returns</p>
            </div>
          </label>

          <label className="flex items-center gap-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="opt-type"
              value="return"
              checked={optimizationType === 'return'}
              onChange={(e) => setOptimizationType(e.target.value as any)}
              className="text-[#00f0db] focus:ring-[#00f0db]"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Target Return</p>
              <p className="text-xs text-gray-500">Minimize risk for desired return</p>
            </div>
          </label>

          <label className="flex items-center gap-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="opt-type"
              value="risk"
              checked={optimizationType === 'risk'}
              onChange={(e) => setOptimizationType(e.target.value as any)}
              className="text-[#00f0db] focus:ring-[#00f0db]"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Target Risk</p>
              <p className="text-xs text-gray-500">Maximize return for risk limit</p>
            </div>
          </label>
        </div>
      </div>

      {/* Target Return Input */}
      {optimizationType === 'return' && (
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Target Return (Annual)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.02"
              max="0.15"
              step="0.005"
              value={targetReturn}
              onChange={(e) => setTargetReturn(parseFloat(e.target.value))}
              className="flex-1 accent-[#00f0db]"
            />
            <div className="w-16 text-sm font-semibold text-gray-800">
              {(targetReturn * 100).toFixed(1)}%
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>2%</span>
            <span>15%</span>
          </div>
        </div>
      )}

      {/* Target Risk Input */}
      {optimizationType === 'risk' && (
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Target Risk (Std Dev)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.02"
              max="0.20"
              step="0.005"
              value={targetRisk}
              onChange={(e) => setTargetRisk(parseFloat(e.target.value))}
              className="flex-1 accent-[#00f0db]"
            />
            <div className="w-16 text-sm font-semibold text-gray-800">
              {(targetRisk * 100).toFixed(1)}%
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>2%</span>
            <span>20%</span>
          </div>
        </div>
      )}

      {/* Optimize Button */}
      <button
        onClick={handleOptimize}
        disabled={optimalPortfolio.loading}
        className="w-full py-3 px-4 bg-[#074269] text-white font-semibold rounded-lg hover:bg-[#053050] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {optimalPortfolio.loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Optimizing...
          </>
        ) : (
          <>
            <Target size={18} />
            Find Optimal Portfolio
          </>
        )}
      </button>

      {/* Error Display */}
      {optimalPortfolio.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs font-medium text-red-800 mb-1">Optimization Failed</p>
          <p className="text-xs text-red-600">{optimalPortfolio.error}</p>
        </div>
      )}

      {/* API Status Indicator */}
      <div className="text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">
        {optimalPortfolio.loading ? (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            Connecting to Python API...
          </span>
        ) : optimalPortfolio.data ? (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            API connected
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-300 rounded-full" />
            Ready
          </span>
        )}
      </div>
    </div>
  );
}
