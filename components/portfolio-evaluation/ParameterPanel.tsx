'use client';

import { useCallback, useState } from 'react';
import { Play, FileSpreadsheet, Database, ChevronDown, Loader2, Settings2, RefreshCw } from 'lucide-react';
import { OptimizationParams, PortfolioHoldings } from '@/lib/portfolio-types';
import { ExtendedOptimizationParams } from '@/lib/optimization';
import { usePortfolioNames, usePortfolio, useSecurityMetadata } from '@/lib/hooks/usePortfolioData';
import { mapPortfolioToAllocations } from '@/lib/portfolio-mapper';
import { getAssetsByMode } from '@/lib/cma-data';
import FileUpload from './FileUpload';
import CustomAssetSelector from './CustomAssetSelector';

interface ParameterPanelProps {
  params: ExtendedOptimizationParams;
  onParamsChange: (params: ExtendedOptimizationParams) => void;
  onRunOptimization: () => void;
  onResample?: () => void;
  onPortfoliosLoaded: (portfolios: PortfolioHoldings[]) => void;
  isRunning: boolean;
  isResampling?: boolean;
  hasFrontier?: boolean;
  uploadedPortfolios: PortfolioHoldings[];
}

export default function ParameterPanel({
  params,
  onParamsChange,
  onRunOptimization,
  onResample,
  onPortfoliosLoaded,
  isRunning,
  isResampling = false,
  hasFrontier = false,
  uploadedPortfolios,
}: ParameterPanelProps) {
  // Portfolio universe data
  const { names: portfolioNames, loading: loadingNames } = usePortfolioNames();
  const { metadata } = useSecurityMetadata();
  const [selectedPortfolioName, setSelectedPortfolioName] = useState<string>('');
  const { portfolio: selectedPortfolio, loading: loadingPortfolio } = usePortfolio(
    selectedPortfolioName || null
  );

  // Load portfolio when selected (prevent duplicates)
  const handleLoadPortfolio = useCallback(() => {
    if (!selectedPortfolio) return;

    // Check if already added
    const alreadyExists = uploadedPortfolios.some(p => p.name === selectedPortfolio.name);
    if (alreadyExists) {
      return; // Don't add duplicates
    }

    const mapped = mapPortfolioToAllocations(selectedPortfolio, metadata);
    onPortfoliosLoaded([...uploadedPortfolios, mapped]);
    setSelectedPortfolioName(''); // Reset selection after adding
  }, [selectedPortfolio, metadata, uploadedPortfolios, onPortfoliosLoaded]);


  return (
    <div
      className="w-[360px] min-w-[360px] bg-white border-r border-gray-200 p-5 overflow-y-auto"
      style={{ height: 'calc(100vh - 122px)' }}
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
        Optimization Settings
      </h2>

      {/* Mode Selection */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Asset Universe
        </label>
        <select
          value={params.mode}
          onChange={(e) => onParamsChange({ ...params, mode: e.target.value as OptimizationParams['mode'] })}
          className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#00f0db] focus:border-transparent"
        >
          <option value="core">Core Assets</option>
          <option value="core_private">Core + Private</option>
          <option value="unconstrained">Unconstrained</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          {params.mode === 'core' && '7 liquid asset classes'}
          {params.mode === 'core_private' && '11 asset classes including alternatives'}
          {params.mode === 'unconstrained' && 'All 13 asset classes'}
        </p>
      </div>

      {/* Caps Template */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Weight Constraints
        </label>
        <select
          value={params.capsTemplate}
          onChange={(e) => onParamsChange({ ...params, capsTemplate: e.target.value as OptimizationParams['capsTemplate'] })}
          className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#00f0db] focus:border-transparent"
        >
          <option value="standard">Standard</option>
          <option value="tight">Tight (max 25%)</option>
          <option value="loose">Loose (max 100%)</option>
        </select>
      </div>

      {/* Frontier Points */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Frontier Points
        </label>
        <input
          type="range"
          min="10"
          max="50"
          value={params.numPoints ?? 30}
          onChange={(e) => onParamsChange({ ...params, numPoints: parseInt(e.target.value) })}
          className="w-full accent-[#00f0db]"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>10</span>
          <span className="font-medium text-gray-600">{params.numPoints ?? 30}</span>
          <span>50</span>
        </div>
      </div>

      {/* Custom Asset Selection */}
      <div className="mb-5">
        <CustomAssetSelector
          assets={getAssetsByMode(params.mode)}
          selectedAssets={params.customAssets || []}
          onSelectionChange={(assets) => onParamsChange({ ...params, customAssets: assets })}
          enabled={!!params.customAssets && params.customAssets.length > 0}
          onEnabledChange={(enabled) => {
            if (enabled) {
              // Enable with all assets selected by default
              onParamsChange({
                ...params,
                customAssets: getAssetsByMode(params.mode).map((a) => a.name),
              });
            } else {
              // Disable by clearing custom assets
              onParamsChange({ ...params, customAssets: undefined });
            }
          }}
        />
      </div>

      {/* Bucket Constraints */}
      <div className="mb-5">
        <div className="border border-[#e6e6e6] rounded-lg bg-white">
          <div className="p-3 border-b border-[#e6e6e6] bg-[#f8f9fa]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.enableBucketConstraints || false}
                onChange={(e) =>
                  onParamsChange({
                    ...params,
                    enableBucketConstraints: e.target.checked,
                    bucketConstraints: e.target.checked
                      ? {
                          stability: { min: 0, max: 1 },
                          diversified: { min: 0, max: 1 },
                          growth: { min: 0, max: 1 },
                        }
                      : undefined,
                  })
                }
                className="w-4 h-4 rounded border-gray-300 text-[#00f0db] focus:ring-[#00f0db]"
              />
              <span className="text-[14px] font-medium text-[#010203] flex items-center gap-1">
                <Settings2 size={14} />
                Bucket Constraints
              </span>
            </label>
          </div>

          {params.enableBucketConstraints && (
            <div className="p-3 space-y-3">
              <p className="text-[11px] text-[#757575] mb-2">
                Set min/max allocation limits for each risk bucket
              </p>

              {/* Stability */}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#010203] w-20">Stability</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={(params.bucketConstraints?.stability?.min ?? 0) * 100}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      bucketConstraints: {
                        ...params.bucketConstraints,
                        stability: {
                          ...params.bucketConstraints?.stability,
                          min: parseFloat(e.target.value) / 100 || 0,
                          max: params.bucketConstraints?.stability?.max ?? 1,
                        },
                      },
                    })
                  }
                  className="w-16 px-2 py-1 border border-[#e6e6e6] rounded text-[12px] text-center"
                />
                <span className="text-[11px] text-[#757575]">% to</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={(params.bucketConstraints?.stability?.max ?? 100) * 100}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      bucketConstraints: {
                        ...params.bucketConstraints,
                        stability: {
                          ...params.bucketConstraints?.stability,
                          min: params.bucketConstraints?.stability?.min ?? 0,
                          max: parseFloat(e.target.value) / 100 || 1,
                        },
                      },
                    })
                  }
                  className="w-16 px-2 py-1 border border-[#e6e6e6] rounded text-[12px] text-center"
                />
                <span className="text-[11px] text-[#757575]">%</span>
              </div>

              {/* Diversified */}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#010203] w-20">Diversified</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={(params.bucketConstraints?.diversified?.min ?? 0) * 100}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      bucketConstraints: {
                        ...params.bucketConstraints,
                        diversified: {
                          ...params.bucketConstraints?.diversified,
                          min: parseFloat(e.target.value) / 100 || 0,
                          max: params.bucketConstraints?.diversified?.max ?? 1,
                        },
                      },
                    })
                  }
                  className="w-16 px-2 py-1 border border-[#e6e6e6] rounded text-[12px] text-center"
                />
                <span className="text-[11px] text-[#757575]">% to</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={(params.bucketConstraints?.diversified?.max ?? 100) * 100}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      bucketConstraints: {
                        ...params.bucketConstraints,
                        diversified: {
                          ...params.bucketConstraints?.diversified,
                          min: params.bucketConstraints?.diversified?.min ?? 0,
                          max: parseFloat(e.target.value) / 100 || 1,
                        },
                      },
                    })
                  }
                  className="w-16 px-2 py-1 border border-[#e6e6e6] rounded text-[12px] text-center"
                />
                <span className="text-[11px] text-[#757575]">%</span>
              </div>

              {/* Growth */}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#010203] w-20">Growth</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={(params.bucketConstraints?.growth?.min ?? 0) * 100}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      bucketConstraints: {
                        ...params.bucketConstraints,
                        growth: {
                          ...params.bucketConstraints?.growth,
                          min: parseFloat(e.target.value) / 100 || 0,
                          max: params.bucketConstraints?.growth?.max ?? 1,
                        },
                      },
                    })
                  }
                  className="w-16 px-2 py-1 border border-[#e6e6e6] rounded text-[12px] text-center"
                />
                <span className="text-[11px] text-[#757575]">% to</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={(params.bucketConstraints?.growth?.max ?? 100) * 100}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      bucketConstraints: {
                        ...params.bucketConstraints,
                        growth: {
                          ...params.bucketConstraints?.growth,
                          min: params.bucketConstraints?.growth?.min ?? 0,
                          max: parseFloat(e.target.value) / 100 || 1,
                        },
                      },
                    })
                  }
                  className="w-16 px-2 py-1 border border-[#e6e6e6] rounded text-[12px] text-center"
                />
                <span className="text-[11px] text-[#757575]">%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={onRunOptimization}
        disabled={isRunning}
        className="w-full py-3 px-4 bg-[#00f0db] text-[#010203] font-semibold rounded-lg hover:bg-[#00d4c1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
      >
        <Play size={18} />
        {isRunning ? 'Optimizing...' : 'Run Optimization'}
      </button>

      {/* Resample Button */}
      {onResample && (
        <button
          onClick={onResample}
          disabled={isResampling || !hasFrontier}
          className="w-full py-2.5 px-4 bg-[#621368] text-white text-sm font-medium rounded-lg hover:bg-[#4e0f53] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
          title={!hasFrontier ? 'Run optimization first to generate frontier' : 'Generate resampled portfolios'}
        >
          <RefreshCw size={16} className={isResampling ? 'animate-spin' : ''} />
          {isResampling ? 'Resampling...' : 'Resample Portfolios'}
        </button>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 pt-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Database size={16} />
          Select from Portfolio Universe
        </h3>
      </div>

      {/* Portfolio Selector */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          AlTi Model Portfolios ({portfolioNames.length})
        </label>
        <div className="relative">
          <select
            value={selectedPortfolioName}
            onChange={(e) => setSelectedPortfolioName(e.target.value)}
            disabled={loadingNames}
            className="w-full p-2.5 pr-8 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#00f0db] focus:border-transparent appearance-none disabled:opacity-50"
          >
            <option value="">Select a portfolio...</option>
            {portfolioNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
        {loadingNames && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" />
            Loading portfolios...
          </p>
        )}
      </div>

      {/* Selected Portfolio Preview */}
      {selectedPortfolio && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-1">{selectedPortfolio.name}</p>
          <p className="text-xs text-gray-500">
            {selectedPortfolio.holdings.length} holdings
          </p>
          <div className="mt-2 text-xs text-gray-400 max-h-[80px] overflow-y-auto">
            {selectedPortfolio.holdings.slice(0, 5).map((h, i) => (
              <div key={i} className="flex justify-between">
                <span className="truncate mr-2">{h.security}</span>
                <span className="font-mono">{(h.weight * 100).toFixed(1)}%</span>
              </div>
            ))}
            {selectedPortfolio.holdings.length > 5 && (
              <div className="text-gray-400 mt-1">
                +{selectedPortfolio.holdings.length - 5} more...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Portfolio Button */}
      <button
        onClick={handleLoadPortfolio}
        disabled={!selectedPortfolio || loadingPortfolio}
        className="w-full py-2 px-4 bg-[#074269] text-white text-sm font-medium rounded-lg hover:bg-[#053050] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
      >
        {loadingPortfolio ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Database size={16} />
            Add to Analysis
          </>
        )}
      </button>

      {/* Or Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* File Upload Header */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Upload Custom Portfolio</h3>
      </div>

      {/* File Upload Component */}
      <FileUpload
        onPortfoliosLoaded={onPortfoliosLoaded}
        existingPortfolios={uploadedPortfolios}
      />

      {/* Uploaded Portfolios List */}
      {uploadedPortfolios.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <FileSpreadsheet size={16} />
            <span>{uploadedPortfolios.length} portfolio(s) loaded</span>
          </div>
          <div className="space-y-1">
            {uploadedPortfolios.map((p, i) => (
              <div key={i} className="text-xs text-gray-500 pl-6">
                • {p.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">
          The optimizer uses mean-variance optimization with the Goldfarb-Idnani algorithm to generate the efficient frontier.
        </p>
      </div>
    </div>
  );
}
