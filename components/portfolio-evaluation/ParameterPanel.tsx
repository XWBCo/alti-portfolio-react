'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { Upload, Play, FileSpreadsheet, Database, ChevronDown, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { OptimizationParams, PortfolioHoldings } from '@/lib/portfolio-types';
import { usePortfolioNames, usePortfolio, useSecurityMetadata } from '@/lib/hooks/usePortfolioData';
import { mapPortfolioToAllocations } from '@/lib/portfolio-mapper';

interface ParameterPanelProps {
  params: OptimizationParams;
  onParamsChange: (params: OptimizationParams) => void;
  onRunOptimization: () => void;
  onPortfoliosLoaded: (portfolios: PortfolioHoldings[]) => void;
  isRunning: boolean;
  uploadedPortfolios: PortfolioHoldings[];
}

export default function ParameterPanel({
  params,
  onParamsChange,
  onRunOptimization,
  onPortfoliosLoaded,
  isRunning,
  uploadedPortfolios,
}: ParameterPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        try {
          const data = results.data as string[][];
          if (data.length < 2) {
            alert('CSV must have at least a header row and one data row');
            return;
          }

          // Parse header to find portfolio columns
          const header = data[0];
          const assetClassCol = header.findIndex(h =>
            h?.toUpperCase().includes('ASSET') || h?.toUpperCase().includes('CLASS')
          );

          if (assetClassCol === -1) {
            alert('Could not find ASSET CLASS column in CSV');
            return;
          }

          // Find portfolio columns (numeric columns after asset class)
          const portfolioIndices: number[] = [];
          const portfolioNames: string[] = [];
          for (let i = 0; i < header.length; i++) {
            if (i !== assetClassCol && header[i] && !header[i].toUpperCase().includes('RISK') && !header[i].toUpperCase().includes('ALLOCATION')) {
              // Check if first data row has a number in this column
              const firstValue = parseFloat(data[1]?.[i]);
              if (!isNaN(firstValue)) {
                portfolioIndices.push(i);
                portfolioNames.push(header[i] || `Portfolio ${portfolioIndices.length}`);
              }
            }
          }

          if (portfolioIndices.length === 0) {
            alert('Could not find portfolio allocation columns in CSV');
            return;
          }

          // Build portfolio objects
          const portfolios: PortfolioHoldings[] = portfolioNames.map((name, idx) => ({
            name,
            allocations: {},
          }));

          // Parse data rows
          for (let row = 1; row < data.length; row++) {
            const rowData = data[row];
            if (!rowData || !rowData[assetClassCol]) continue;

            const assetClass = rowData[assetClassCol].trim().toUpperCase();

            portfolioIndices.forEach((colIdx, portIdx) => {
              const value = parseFloat(rowData[colIdx] || '0');
              if (!isNaN(value)) {
                portfolios[portIdx].allocations[assetClass] = value;
              }
            });
          }

          // Normalize allocations if they don't sum to ~1
          portfolios.forEach(portfolio => {
            const sum = Object.values(portfolio.allocations).reduce((a, b) => a + b, 0);
            if (sum > 1.5) {
              // Assume percentages, convert to decimals
              Object.keys(portfolio.allocations).forEach(key => {
                portfolio.allocations[key] /= 100;
              });
            } else if (sum < 0.5 && sum > 0) {
              // Very low sum, might be wrong but leave as-is
            }
          });

          onPortfoliosLoaded(portfolios);
        } catch (error) {
          console.error('Error parsing CSV:', error);
          alert('Error parsing CSV file. Please check the format.');
        }
      },
      error: (error) => {
        console.error('Papa Parse error:', error);
        alert('Error reading CSV file');
      },
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onPortfoliosLoaded]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const changeEvent = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(changeEvent);
      }
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div
      className="w-[320px] bg-white border-r border-gray-200 p-5 overflow-y-auto"
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

      {/* Run Button */}
      <button
        onClick={onRunOptimization}
        disabled={isRunning}
        className="w-full py-3 px-4 bg-[#00f0db] text-[#010203] font-semibold rounded-lg hover:bg-[#00d4c1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
      >
        <Play size={18} />
        {isRunning ? 'Optimizing...' : 'Run Optimization'}
      </button>

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

      {/* CSV Upload Header */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Upload Custom CSV</h3>
      </div>

      {/* CSV Upload */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#00f0db] hover:bg-[#00f0db]/5 transition-colors"
      >
        <Upload className="mx-auto mb-2 text-gray-400" size={24} />
        <p className="text-sm text-gray-600">Drop CSV or click to upload</p>
        <p className="text-xs text-gray-400 mt-1">Format: ASSET CLASS, Portfolio1, Portfolio2...</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

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
