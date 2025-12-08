'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search, Upload, X, FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import type { Holding, SecurityIdType } from '@/lib/clarity-api/types';

type FundType = 'ALL' | 'US_FUND' | 'INTL_FUND' | 'LP' | 'SMA';

interface PortfolioSelectorProps {
  holdings: Holding[];
  onHoldingsChange: (holdings: Holding[]) => void;
  portfolioName: string;
  onNameChange: (name: string) => void;
  placeholder?: string;
}

// Mock search data - in production this would come from an API
const MOCK_FUNDS: Holding[] = [
  { id: 'US1234567890', idType: 'ISIN', name: 'Smith Family Growth SMA', ticker: 'SFGSMA', weight: 0.124, type: 'SMA' },
  { id: 'US0987654321', idType: 'ISIN', name: 'AlTi Private Equity II', ticker: 'ALTPE2', weight: 0.082, type: 'LP' },
  { id: 'US0378331005', idType: 'ISIN', name: 'Apple Inc.', ticker: 'AAPL', weight: 0.061, type: 'US_FUND' },
  { id: 'US5949181045', idType: 'ISIN', name: 'Microsoft Corp.', ticker: 'MSFT', weight: 0.055, type: 'US_FUND' },
  { id: 'IE00B4L5Y983', idType: 'ISIN', name: 'iShares Core MSCI World', ticker: 'SWDA', weight: 0.048, type: 'INTL_FUND' },
  { id: 'LU0323578657', idType: 'ISIN', name: 'Flossbach von Storch SICAV', ticker: 'FVS', weight: 0.042, type: 'INTL_FUND' },
  { id: 'US9229083632', idType: 'ISIN', name: 'Vanguard Total Stock Market', ticker: 'VTI', weight: 0.038, type: 'US_FUND' },
  { id: 'US4642872349', idType: 'ISIN', name: 'iShares MSCI EAFE ETF', ticker: 'EFA', weight: 0.035, type: 'INTL_FUND' },
  { id: 'US92826C8394', idType: 'ISIN', name: 'NVIDIA Corp.', ticker: 'NVDA', weight: 0.032, type: 'US_FUND' },
  { id: 'US0231351067', idType: 'ISIN', name: 'Amazon.com Inc.', ticker: 'AMZN', weight: 0.028, type: 'US_FUND' },
];

const FUND_TYPE_LABELS: Record<FundType, string> = {
  ALL: 'All',
  US_FUND: 'US Funds',
  INTL_FUND: 'Non-US Funds',
  LP: 'LPs',
  SMA: 'SMAs',
};

// CSV Template content
const CSV_TEMPLATE = `ISIN,Name,Weight
US0378331005,Apple Inc.,10
IE00B4L5Y983,iShares Core MSCI World,15
B0YQ5W0,Unilever PLC (SEDOL example),8
US5949181045,Microsoft Corp.,12
LU0323578657,Flossbach von Storch SICAV,5`;

const downloadTemplate = () => {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'portfolio-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export function PortfolioSelector({
  holdings,
  onHoldingsChange,
  portfolioName,
  onNameChange,
  placeholder = 'e.g., Smith Family Trust',
}: PortfolioSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FundType>('ALL');
  const [showResults, setShowResults] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);

  // Filter mock data based on search and type filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return MOCK_FUNDS.filter((fund) => {
      const matchesQuery =
        fund.name.toLowerCase().includes(query) ||
        fund.ticker?.toLowerCase().includes(query) ||
        fund.id.toLowerCase().includes(query);

      const matchesType = activeFilter === 'ALL' || fund.type === activeFilter;

      // Exclude already selected holdings
      const notSelected = !holdings.some((h) => h.id === fund.id);

      return matchesQuery && matchesType && notSelected;
    });
  }, [searchQuery, activeFilter, holdings]);

  const addHolding = useCallback(
    (holding: Holding) => {
      // For dropdown assets, use equal weight distribution
      const newCount = holdings.length + 1;
      const equalWeight = 1 / newCount;

      // Recalculate all existing holdings to equal weight
      const updatedHoldings = holdings.map(h => ({
        ...h,
        weight: equalWeight,
      }));

      // Add new holding with equal weight
      onHoldingsChange([...updatedHoldings, { ...holding, weight: equalWeight }]);
      setSearchQuery('');
      setShowResults(false);
    },
    [holdings, onHoldingsChange]
  );

  const removeHolding = useCallback(
    (id: string) => {
      const remaining = holdings.filter((h) => h.id !== id);
      if (remaining.length > 0) {
        // Redistribute weights equally
        const equalWeight = 1 / remaining.length;
        const redistributed = remaining.map(h => ({ ...h, weight: equalWeight }));
        onHoldingsChange(redistributed);
      } else {
        onHoldingsChange([]);
      }
    },
    [holdings, onHoldingsChange]
  );

  const clearAll = useCallback(() => {
    onHoldingsChange([]);
    setCsvSuccess(null);
  }, [onHoldingsChange]);

  const handleCsvUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setCsvError(null);
      setCsvSuccess(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter((line) => line.trim());

          if (lines.length < 2) {
            setCsvError('CSV must have a header row and at least one data row');
            return;
          }

          const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
          const idColIndex =
            header.findIndex((h) => h === 'isin') !== -1
              ? header.findIndex((h) => h === 'isin')
              : header.findIndex((h) => h === 'cusip') !== -1
              ? header.findIndex((h) => h === 'cusip')
              : header.findIndex((h) => h === 'sedol') !== -1
              ? header.findIndex((h) => h === 'sedol')
              : header.findIndex((h) => h === 'ticker');

          const weightColIndex = header.findIndex(
            (h) => h === 'weight' || h === 'percentage' || h === '%'
          );
          const nameColIndex = header.findIndex(
            (h) => h === 'name' || h === 'security' || h === 'holding'
          );

          if (idColIndex === -1) {
            setCsvError('CSV must have an ISIN, CUSIP, SEDOL, or Ticker column');
            return;
          }

          const idType: SecurityIdType =
            header[idColIndex] === 'isin'
              ? 'ISIN'
              : header[idColIndex] === 'cusip'
              ? 'CUSIP'
              : 'OTHER';

          const newHoldings: Holding[] = [];
          let matchedCount = 0;

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v) => v.trim());
            const id = values[idColIndex];
            if (!id) continue;

            const weight =
              weightColIndex !== -1 ? parseFloat(values[weightColIndex]) / 100 : 0.01;
            const name =
              nameColIndex !== -1 ? values[nameColIndex] : `Security ${id}`;

            // Check if already in holdings
            if (!holdings.some((h) => h.id === id)) {
              newHoldings.push({
                id,
                idType,
                name,
                weight: isNaN(weight) ? 0.01 : weight,
                type: 'US_FUND', // Default, would be enriched by API
              });
              matchedCount++;
            }
          }

          if (newHoldings.length > 0) {
            onHoldingsChange([...holdings, ...newHoldings]);
            setCsvSuccess(`Added ${matchedCount} holdings from CSV`);
          } else {
            setCsvError('No new holdings found in CSV');
          }
        } catch {
          setCsvError('Failed to parse CSV file');
        }
      };

      reader.readAsText(file);
      event.target.value = ''; // Reset input
    },
    [holdings, onHoldingsChange]
  );

  // Sort holdings by weight (highest first)
  const sortedHoldings = useMemo(
    () => [...holdings].sort((a, b) => b.weight - a.weight),
    [holdings]
  );

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Search by name, ticker, or ISIN..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] transition-colors placeholder:text-gray-500"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {searchResults.map((fund) => (
              <button
                key={fund.id}
                onClick={() => addHolding(fund)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{fund.name}</p>
                  <p className="text-xs text-gray-600">
                    {fund.ticker} · {fund.id}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-700">
                  {FUND_TYPE_LABELS[fund.type]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(FUND_TYPE_LABELS) as FundType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${
              activeFilter === type
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {FUND_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Selected Holdings List */}
      {sortedHoldings.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {sortedHoldings.map((holding) => (
              <div
                key={holding.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {holding.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {holding.ticker || holding.id}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 flex-shrink-0">
                    {FUND_TYPE_LABELS[holding.type]}
                  </span>
                  <span className="text-sm font-medium text-gray-700 w-16 text-right flex-shrink-0">
                    {(holding.weight * 100).toFixed(1)}%
                  </span>
                </div>
                <button
                  onClick={() => removeHolding(holding.id)}
                  className="ml-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Selection Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {holdings.length} {holdings.length === 1 ? 'fund' : 'funds'} selected
            </p>
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {holdings.length === 0 && (
        <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Search for funds or upload a CSV to get started</p>
        </div>
      )}

      {/* CSV Upload Section */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Have a list?</span>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#2DD4BF] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download template</span>
          </button>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <Upload className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700">Upload CSV</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="hidden"
          />
        </label>

        {csvError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            {csvError}
          </div>
        )}

        {csvSuccess && (
          <div className="mt-3 flex items-center gap-2 text-sm text-[#2DD4BF]">
            <FileSpreadsheet className="w-4 h-4" />
            {csvSuccess}
          </div>
        )}

        <p className="mt-2 text-xs text-gray-500">
          Accepts ISIN, CUSIP, SEDOL, Ticker columns with optional Name and Weight
        </p>
      </div>

      {/* Portfolio Name */}
      <div className="border-t border-gray-100 pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Portfolio Name <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="text"
          value={portfolioName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] transition-colors placeholder:text-gray-500"
        />
      </div>
    </div>
  );
}

export default PortfolioSelector;
