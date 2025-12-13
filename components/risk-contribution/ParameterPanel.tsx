'use client';

import { useState } from 'react';
import { Play, RefreshCw, Upload } from 'lucide-react';
import { PortfolioWeights, SAMPLE_RISK_PORTFOLIOS, SAMPLE_BENCHMARK } from '@/lib/risk-types';
import EditablePortfolioTable from './EditablePortfolioTable';
import PortfolioUpload from './PortfolioUpload';

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
  const [showUpload, setShowUpload] = useState(false);

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

  return (
    <div
      className="w-[320px] bg-white border-r border-gray-200 p-5 overflow-y-auto"
      style={{ height: 'calc(100vh - 122px)' }}
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
        Risk Analysis Settings
      </h2>

      {/* Portfolio Source Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setShowUpload(false)}
          className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
            !showUpload
              ? 'bg-[#074269] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setShowUpload(true)}
          className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
            showUpload
              ? 'bg-[#074269] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Upload size={12} />
          Upload
        </button>
      </div>

      {/* Portfolio Preset or Upload */}
      {!showUpload ? (
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
      ) : (
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Upload Portfolio
          </label>
          <PortfolioUpload
            onPortfolioLoaded={(weights, name) => {
              onPortfolioChange(weights);
              setSelectedPreset(name);
              setShowUpload(false);
            }}
          />
        </div>
      )}

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

      {/* Editable Portfolio Table */}
      <EditablePortfolioTable
        portfolio={portfolio}
        onPortfolioChange={onPortfolioChange}
        title="Portfolio Holdings"
        maxHeight="280px"
      />

      {/* Info */}
      <div className="mt-6 p-3 bg-[#074269]/5 rounded-lg">
        <p className="text-xs text-[#074269]">
          Risk analysis uses LASSO regression for factor betas and EWMA for time-varying covariance estimation.
        </p>
      </div>

    </div>
  );
}
