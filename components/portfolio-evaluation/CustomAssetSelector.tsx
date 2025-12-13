'use client';

import { useState, useMemo } from 'react';
import { Check, X, Search, AlertCircle } from 'lucide-react';
import { AssetClass } from '@/lib/portfolio-types';

interface CustomAssetSelectorProps {
  assets: AssetClass[];
  selectedAssets: string[];
  onSelectionChange: (assets: string[]) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export default function CustomAssetSelector({
  assets,
  selectedAssets,
  onSelectionChange,
  enabled,
  onEnabledChange,
}: CustomAssetSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRiskAllocation, setFilterRiskAllocation] = useState<string>('all');

  // Group assets by risk allocation
  const groupedAssets = useMemo(() => {
    const groups: Record<string, AssetClass[]> = {
      STABILITY: [],
      DIVERSIFIED: [],
      GROWTH: [],
    };

    assets.forEach((asset) => {
      const allocation = asset.riskAllocation?.toUpperCase() || 'GROWTH';
      if (groups[allocation]) {
        groups[allocation].push(asset);
      } else {
        groups.GROWTH.push(asset);
      }
    });

    return groups;
  }, [assets]);

  // Filter assets based on search and risk allocation filter
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          a.riskAllocation?.toLowerCase().includes(term)
      );
    }

    if (filterRiskAllocation !== 'all') {
      filtered = filtered.filter(
        (a) => a.riskAllocation?.toUpperCase() === filterRiskAllocation
      );
    }

    return filtered;
  }, [assets, searchTerm, filterRiskAllocation]);

  const handleToggleAsset = (assetName: string) => {
    if (selectedAssets.includes(assetName)) {
      onSelectionChange(selectedAssets.filter((a) => a !== assetName));
    } else {
      onSelectionChange([...selectedAssets, assetName]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(filteredAssets.map((a) => a.name));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const handleSelectGroup = (group: string) => {
    const groupAssets = groupedAssets[group] || [];
    const groupNames = groupAssets.map((a) => a.name);
    const allSelected = groupNames.every((n) => selectedAssets.includes(n));

    if (allSelected) {
      // Deselect all in group
      onSelectionChange(selectedAssets.filter((a) => !groupNames.includes(a)));
    } else {
      // Select all in group
      const newSelection = [...new Set([...selectedAssets, ...groupNames])];
      onSelectionChange(newSelection);
    }
  };

  const isValid = selectedAssets.length >= 2;

  return (
    <div className="border border-[#e6e6e6] rounded-lg bg-white">
      {/* Header with Toggle */}
      <div className="p-4 border-b border-[#e6e6e6] bg-[#f8f9fa]">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#00f0db] focus:ring-[#00f0db]"
            />
            <span className="text-[14px] font-medium text-[#010203]">
              Custom Asset Frontier
            </span>
          </label>
          {enabled && (
            <span
              className={`text-[12px] px-2 py-1 rounded ${
                isValid
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {selectedAssets.length} selected {!isValid && '(min 2)'}
            </span>
          )}
        </div>

        {enabled && (
          <p className="text-[12px] text-[#757575]">
            Select specific assets to build a custom efficient frontier. Minimum 2 assets required.
          </p>
        )}
      </div>

      {enabled && (
        <>
          {/* Search and Filter */}
          <div className="p-4 border-b border-[#e6e6e6]">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#e6e6e6] rounded text-[13px] focus:outline-none focus:ring-1 focus:ring-[#00f0db]"
                />
              </div>
              <select
                value={filterRiskAllocation}
                onChange={(e) => setFilterRiskAllocation(e.target.value)}
                className="px-3 py-2 border border-[#e6e6e6] rounded text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[#00f0db]"
              >
                <option value="all">All Categories</option>
                <option value="STABILITY">Stability</option>
                <option value="DIVERSIFIED">Diversified</option>
                <option value="GROWTH">Growth</option>
              </select>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-[12px] bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Select All ({filteredAssets.length})
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-1 text-[12px] bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Clear All
              </button>
              <div className="flex-1" />
              {['STABILITY', 'DIVERSIFIED', 'GROWTH'].map((group) => {
                const count = groupedAssets[group]?.length || 0;
                const selectedCount =
                  groupedAssets[group]?.filter((a) =>
                    selectedAssets.includes(a.name)
                  ).length || 0;
                return (
                  <button
                    key={group}
                    onClick={() => handleSelectGroup(group)}
                    className={`px-2 py-1 text-[11px] rounded transition-colors ${
                      selectedCount === count && count > 0
                        ? 'bg-[#00f0db] text-[#010203]'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {group.charAt(0) + group.slice(1).toLowerCase()} ({selectedCount}/{count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asset List */}
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredAssets.length === 0 ? (
              <div className="p-4 text-center text-[13px] text-gray-500">
                No assets match your search
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAssets.includes(asset.name);
                  return (
                    <button
                      key={asset.name}
                      onClick={() => handleToggleAsset(asset.name)}
                      className={`flex items-center gap-2 p-2 rounded text-left transition-colors ${
                        isSelected
                          ? 'bg-[#00f0db]/20 border border-[#00f0db]'
                          : 'bg-white border border-[#e6e6e6] hover:border-[#00f0db]/50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-[#00f0db] text-[#010203]'
                            : 'border border-gray-300'
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#010203] truncate">
                          {asset.name}
                        </p>
                        <p className="text-[10px] text-[#757575]">
                          {asset.riskAllocation} • {(asset.expectedReturn * 100).toFixed(1)}% /
                          {(asset.risk * 100).toFixed(1)}%
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Validation Warning */}
          {!isValid && selectedAssets.length > 0 && (
            <div className="p-3 bg-amber-50 border-t border-amber-200 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
              <p className="text-[12px] text-amber-700">
                Select at least 2 assets to generate a custom frontier
              </p>
            </div>
          )}

          {/* Selected Assets Summary */}
          {selectedAssets.length > 0 && (
            <div className="p-3 border-t border-[#e6e6e6] bg-[#f8f9fa]">
              <p className="text-[11px] text-[#757575] mb-2">Selected Assets:</p>
              <div className="flex flex-wrap gap-1">
                {selectedAssets.slice(0, 10).map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#e6e6e6] rounded text-[11px]"
                  >
                    {name}
                    <button
                      onClick={() => handleToggleAsset(name)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {selectedAssets.length > 10 && (
                  <span className="px-2 py-1 text-[11px] text-[#757575]">
                    +{selectedAssets.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
