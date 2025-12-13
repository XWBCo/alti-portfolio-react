'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, AlertCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { PortfolioHoldings } from '@/lib/portfolio-types';

interface FileUploadProps {
  onPortfoliosLoaded: (portfolios: PortfolioHoldings[]) => void;
  existingPortfolios: PortfolioHoldings[];
}

interface ValidationError {
  message: string;
  details?: string;
}

export default function FileUpload({ onPortfoliosLoaded, existingPortfolios }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<ValidationError | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateAndParseData = useCallback((data: string[][]): PortfolioHoldings[] | null => {
    if (data.length < 2) {
      setError({
        message: 'Invalid file format',
        details: 'File must have at least a header row and one data row',
      });
      return null;
    }

    // Parse header to find portfolio columns
    const header = data[0];
    const assetClassCol = header.findIndex(h =>
      h?.toString().toUpperCase().includes('ASSET')
    );

    if (assetClassCol === -1) {
      setError({
        message: 'Missing required column',
        details: 'Could not find ASSET or ASSET CLASS column',
      });
      return null;
    }

    // Find portfolio columns (numeric columns after asset class)
    const portfolioIndices: number[] = [];
    const portfolioNames: string[] = [];

    for (let i = 0; i < header.length; i++) {
      if (i === assetClassCol) continue;
      const colName = header[i]?.toString().trim();
      if (!colName) continue;

      // Skip metadata columns
      const skipPatterns = ['RISK', 'ALLOCATION', 'TIER', 'CLASS', 'CATEGORY'];
      if (skipPatterns.some(pattern => colName.toUpperCase().includes(pattern))) {
        continue;
      }

      // Check if first data row has a number in this column
      const firstValue = data[1]?.[i];
      const parsed = parseFloat(firstValue?.toString() || '');

      if (!isNaN(parsed)) {
        portfolioIndices.push(i);
        portfolioNames.push(colName || `Portfolio ${portfolioIndices.length}`);
      }
    }

    if (portfolioIndices.length === 0) {
      setError({
        message: 'No portfolio data found',
        details: 'Could not find any numeric portfolio allocation columns',
      });
      return null;
    }

    // Build portfolio objects
    const portfolios: PortfolioHoldings[] = portfolioNames.map((name, idx) => ({
      name,
      allocations: {},
    }));

    // Parse data rows
    let validRowCount = 0;
    for (let row = 1; row < data.length; row++) {
      const rowData = data[row];
      if (!rowData || !rowData[assetClassCol]) continue;

      const assetClass = rowData[assetClassCol].toString().trim().toUpperCase();
      if (!assetClass) continue;

      validRowCount++;
      portfolioIndices.forEach((colIdx, portIdx) => {
        const value = parseFloat(rowData[colIdx]?.toString() || '0');
        if (!isNaN(value) && value !== 0) {
          portfolios[portIdx].allocations[assetClass] = value;
        }
      });
    }

    if (validRowCount === 0) {
      setError({
        message: 'No valid data rows',
        details: 'No asset class data found in the file',
      });
      return null;
    }

    // Normalize allocations and validate
    for (const portfolio of portfolios) {
      const sum = Object.values(portfolio.allocations).reduce((a, b) => a + b, 0);

      if (sum === 0) {
        setError({
          message: 'Empty portfolio',
          details: `Portfolio "${portfolio.name}" has no allocations`,
        });
        return null;
      }

      // Assume percentages if sum > 1.5, convert to decimals
      if (sum > 1.5) {
        Object.keys(portfolio.allocations).forEach(key => {
          portfolio.allocations[key] /= 100;
        });
      }

      // Validate normalized sum
      const normalizedSum = Object.values(portfolio.allocations).reduce((a, b) => a + b, 0);
      if (normalizedSum < 0.9 || normalizedSum > 1.1) {
        setError({
          message: 'Invalid allocation sum',
          details: `Portfolio "${portfolio.name}" allocations sum to ${(normalizedSum * 100).toFixed(1)}% (expected 100%)`,
        });
        return null;
      }
    }

    setError(null);
    return portfolios;
  }, []);

  const parseCSVFile = useCallback((file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const data = results.data as string[][];
          const portfolios = validateAndParseData(data);

          if (portfolios) {
            onPortfoliosLoaded([...existingPortfolios, ...portfolios]);
          }
        } catch (err) {
          setError({
            message: 'Error parsing CSV',
            details: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      },
      error: (err) => {
        setError({
          message: 'Error reading CSV file',
          details: err.message,
        });
      },
    });
  }, [validateAndParseData, existingPortfolios, onPortfoliosLoaded]);

  const parseExcelFile = useCallback((file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Use first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setError({
            message: 'Empty Excel file',
            details: 'No sheets found in the Excel file',
          });
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        const portfolios = validateAndParseData(jsonData);

        if (portfolios) {
          onPortfoliosLoaded([...existingPortfolios, ...portfolios]);
        }
      } catch (err) {
        setError({
          message: 'Error parsing Excel file',
          details: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    };

    reader.onerror = () => {
      setError({
        message: 'Error reading Excel file',
        details: 'Could not read the file. Please check file permissions.',
      });
    };

    reader.readAsArrayBuffer(file);
  }, [validateAndParseData, existingPortfolios, onPortfoliosLoaded]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      parseCSVFile(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      parseExcelFile(file);
    } else {
      setError({
        message: 'Unsupported file type',
        details: 'Please upload a CSV or Excel (.xlsx, .xls) file',
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [parseCSVFile, parseExcelFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Trigger file input change event
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      setError({
        message: 'Unsupported file type',
        details: 'Please drop a CSV or Excel (.xlsx, .xls) file',
      });
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div>
      {/* Upload Area */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload portfolio file. Drop file here or press Enter to browse."
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#00f0db] bg-[#00f0db]/10 scale-[1.02]'
            : error
            ? 'border-red-300 bg-red-50 hover:border-red-400'
            : 'border-gray-300 hover:border-[#00f0db] hover:bg-[#00f0db]/5'
        } focus:outline-none focus:ring-2 focus:ring-[#00f0db] focus:ring-offset-2`}
      >
        <Upload className={`mx-auto mb-2 ${error ? 'text-red-400' : 'text-gray-400'}`} size={24} />
        <p className="text-sm text-gray-600">Drop file or click to upload</p>
        <p className="text-xs text-gray-400 mt-1">CSV, XLSX, or XLS</p>
        <p className="text-xs text-gray-400">Format: ASSET, Portfolio1, Portfolio2...</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">{error.message}</p>
              {error.details && (
                <p className="text-xs text-red-600 mt-1">{error.details}</p>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Format Help */}
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 font-medium mb-1">Expected Format:</p>
        <div className="text-xs text-gray-500 font-mono">
          <div>ASSET CLASS, Conservative, Moderate, Aggressive</div>
          <div>US Equity, 20, 40, 60</div>
          <div>US Bonds, 60, 40, 20</div>
          <div>International, 20, 20, 20</div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Values can be percentages (0-100) or decimals (0-1).
        </p>
      </div>
    </div>
  );
}
