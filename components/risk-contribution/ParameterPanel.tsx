'use client';

import { useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { PortfolioWeights, SAMPLE_RISK_PORTFOLIOS, SAMPLE_BENCHMARK } from '@/lib/risk-types';

interface ParameterPanelProps {
  portfolio: PortfolioWeights;
  benchmark: PortfolioWeights | null;
  onPortfolioChange: (portfolio: PortfolioWeights) => void;
  onBenchmarkChange: (benchmark: PortfolioWeights | null) => void;
  onRunAnalysis: () => void;
  isLoading: boolean;
  useEwma: boolean;
  onUseEwmaChange: (value: boolean) => void;
  runStressScenarios: boolean;
  onRunStressScenariosChange: (value: boolean) => void;
}

export default function ParameterPanel({
  portfolio,
  benchmark,
  onPortfolioChange,
  onBenchmarkChange,
  onRunAnalysis,
  isLoading,
  useEwma,
  onUseEwmaChange,
  runStressScenarios,
  onRunStressScenariosChange,
}: ParameterPanelProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('Balanced');

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = SAMPLE_RISK_PORTFOLIOS.find(p => p.name === presetName);
    if (preset) {
      onPortfolioChange(preset.weights);
    }
  };

  const handleUseBenchmark = (use: boolean) => {
    if (use) {
      onBenchmarkChange(SAMPLE_BENCHMARK);
    } else {
      onBenchmarkChange(null);
    }
  };

  const totalWeight = Object.values(portfolio).reduce((sum, w) => sum + w, 0);
  const assetCount = Object.keys(portfolio).length;

  return (
    <div
      className="w-[320px] bg-white border-r border-gray-200 p-5 overflow-y-auto"
      style={{ height: 'calc(100vh - 122px)' }}
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
        Risk Analysis Settings
      </h2>

      {/* Portfolio Preset */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Portfolio Preset
        </label>
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#00f0db] focus:border-transparent"
        >
          {SAMPLE_RISK_PORTFOLIOS.map(p => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Portfolio Summary */}
      <div className="mb-5 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Assets:</span>
          <span className="font-medium text-gray-700">{assetCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Weight:</span>
          <span className={`font-medium ${Math.abs(totalWeight - 1) < 0.001 ? 'text-green-600' : 'text-amber-600'}`}>
            {(totalWeight * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Benchmark Toggle */}
      <div className="mb-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={benchmark !== null}
            onChange={(e) => handleUseBenchmark(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#00f0db] focus:ring-[#00f0db]"
          />
          <span className="text-sm text-gray-700">Compare to Benchmark</span>
        </label>
        {benchmark && (
          <p className="text-xs text-gray-400 mt-1 ml-6">
            Equal-weight 10 assets
          </p>
        )}
      </div>

      {/* EWMA Toggle */}
      <div className="mb-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useEwma}
            onChange={(e) => onUseEwmaChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#00f0db] focus:ring-[#00f0db]"
          />
          <span className="text-sm text-gray-700">Use EWMA Covariance</span>
        </label>
        <p className="text-xs text-gray-400 mt-1 ml-6">
          {useEwma ? 'Decay factor: 0.94 (recent data weighted higher)' : 'Simple historical covariance'}
        </p>
      </div>

      {/* Stress Scenarios Toggle */}
      <div className="mb-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={runStressScenarios}
            onChange={(e) => onRunStressScenariosChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#00f0db] focus:ring-[#00f0db]"
          />
          <span className="text-sm text-gray-700">Run Stress Scenarios</span>
        </label>
        <p className="text-xs text-gray-400 mt-1 ml-6">
          Analyze performance in 8 historical stress periods
        </p>
      </div>

      {/* Run Button */}
      <button
        onClick={onRunAnalysis}
        disabled={isLoading}
        className="w-full py-3 px-4 bg-[#00f0db] text-[#010203] font-semibold rounded-lg hover:bg-[#00d4c1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
      >
        {isLoading ? (
          <>
            <RefreshCw size={18} className="animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Play size={18} />
            Run Analysis
          </>
        )}
      </button>

      {/* Holdings Preview */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Portfolio Holdings</h3>
        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {Object.entries(portfolio)
            .sort((a, b) => b[1] - a[1])
            .map(([asset, weight]) => (
              <div key={asset} className="flex justify-between text-xs py-1 border-b border-gray-100">
                <span className="text-gray-600 truncate mr-2">{asset}</span>
                <span className="font-mono text-gray-700">{(weight * 100).toFixed(1)}%</span>
              </div>
            ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-3 bg-[#074269]/5 rounded-lg">
        <p className="text-xs text-[#074269]">
          Risk analysis uses LASSO regression for factor betas and EWMA for time-varying covariance estimation.
        </p>
      </div>
    </div>
  );
}
