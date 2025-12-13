'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { PortfolioWeights } from '@/lib/risk-types';

interface PortfolioUploadProps {
  onPortfolioLoaded: (portfolio: PortfolioWeights, name: string) => void;
  className?: string;
}

interface ParsedPortfolio {
  name: string;
  weights: PortfolioWeights;
  assetCount: number;
  totalWeight: number;
}

export default function PortfolioUpload({ onPortfolioLoaded, className = '' }: PortfolioUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedPortfolio, setParsedPortfolio] = useState<ParsedPortfolio | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setParsedPortfolio(null);

    try {
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      let data: Record<string, string | number>[] = [];

      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const text = await file.text();
        const lines = text.trim().split('\n');
        if (lines.length < 2) throw new Error('CSV must have header row and at least one data row');

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string | number> = {};
          headers.forEach((h, i) => {
            row[h] = values[i] || '';
          });
          return row;
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Parse Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet);
      } else {
        throw new Error('Unsupported file format. Use CSV or Excel (.xlsx/.xls)');
      }

      if (data.length === 0) {
        throw new Error('No data found in file');
      }

      // Try to find asset/security and weight columns
      const firstRow = data[0];
      const columns = Object.keys(firstRow);

      // Common column name patterns
      const assetPatterns = ['asset', 'security', 'name', 'holding', 'ticker', 'symbol'];
      const weightPatterns = ['weight', 'allocation', 'pct', 'percent', '%'];

      let assetCol = columns.find(c =>
        assetPatterns.some(p => c.toLowerCase().includes(p))
      );
      let weightCol = columns.find(c =>
        weightPatterns.some(p => c.toLowerCase().includes(p))
      );

      // Fallback: first column is asset, second is weight
      if (!assetCol && columns.length >= 2) assetCol = columns[0];
      if (!weightCol && columns.length >= 2) weightCol = columns[1];

      if (!assetCol || !weightCol) {
        throw new Error('Could not identify asset and weight columns. Expected columns like "Asset" and "Weight".');
      }

      // Build portfolio weights
      const weights: PortfolioWeights = {};
      let totalWeight = 0;

      for (const row of data) {
        const asset = String(row[assetCol] || '').trim();
        let weight = row[weightCol];

        if (!asset) continue;

        // Parse weight (handle percentage strings)
        if (typeof weight === 'string') {
          weight = weight.replace('%', '').trim();
        }
        const numWeight = parseFloat(String(weight));

        if (isNaN(numWeight)) continue;

        // Convert percentage to decimal if needed
        const normalizedWeight = numWeight > 1 ? numWeight / 100 : numWeight;

        weights[asset] = normalizedWeight;
        totalWeight += normalizedWeight;
      }

      const assetCount = Object.keys(weights).length;
      if (assetCount === 0) {
        throw new Error('No valid holdings found in file');
      }

      setParsedPortfolio({
        name: fileName,
        weights,
        assetCount,
        totalWeight,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [parseFile]);

  const handleConfirm = useCallback(() => {
    if (parsedPortfolio) {
      onPortfolioLoaded(parsedPortfolio.weights, parsedPortfolio.name);
      setParsedPortfolio(null);
    }
  }, [parsedPortfolio, onPortfolioLoaded]);

  const handleClear = useCallback(() => {
    setParsedPortfolio(null);
    setError(null);
  }, []);

  return (
    <div className={className}>
      {/* Upload Area */}
      {!parsedPortfolio && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload portfolio file"
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#0B6D7B] bg-[#0B6D7B]/10'
              : error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-[#0B6D7B] hover:bg-[#0B6D7B]/5'
          } focus:outline-none focus:ring-2 focus:ring-[#0B6D7B] focus:ring-offset-2`}
        >
          {isProcessing ? (
            <div className="animate-pulse">
              <FileSpreadsheet className="mx-auto mb-2 text-[#0B6D7B]" size={24} />
              <p className="text-sm text-[#0B6D7B]">Processing...</p>
            </div>
          ) : (
            <>
              <Upload className={`mx-auto mb-2 ${error ? 'text-red-400' : 'text-gray-400'}`} size={24} />
              <p className="text-sm text-gray-600">Drop CSV/Excel or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">Format: Asset, Weight columns</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Preview Panel */}
      {parsedPortfolio && (
        <div className="mt-3 p-3 bg-[#f8f9fa] rounded-lg border border-[#e6e6e6]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="text-[#0B6D7B]" size={16} />
              <span className="text-sm font-medium text-[#010203]">{parsedPortfolio.name}</span>
            </div>
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="bg-white p-2 rounded">
              <span className="text-[#757575]">Holdings:</span>
              <span className="ml-1 font-medium text-[#010203]">{parsedPortfolio.assetCount}</span>
            </div>
            <div className="bg-white p-2 rounded">
              <span className="text-[#757575]">Total Weight:</span>
              <span className={`ml-1 font-medium ${
                Math.abs(parsedPortfolio.totalWeight - 1) < 0.01 ? 'text-green-600' : 'text-amber-600'
              }`}>
                {(parsedPortfolio.totalWeight * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Top Holdings Preview */}
          <div className="text-xs text-gray-500 mb-3 max-h-[100px] overflow-y-auto">
            {Object.entries(parsedPortfolio.weights)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([asset, weight]) => (
                <div key={asset} className="flex justify-between py-0.5">
                  <span className="truncate mr-2">{asset}</span>
                  <span className="font-mono">{(weight * 100).toFixed(1)}%</span>
                </div>
              ))}
            {parsedPortfolio.assetCount > 5 && (
              <div className="text-gray-400 mt-1">+{parsedPortfolio.assetCount - 5} more...</div>
            )}
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-2 bg-[#0B6D7B] text-white text-sm font-medium rounded hover:bg-[#095a66] transition-colors"
          >
            Use This Portfolio
          </button>
        </div>
      )}
    </div>
  );
}
