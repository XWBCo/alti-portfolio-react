'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, Check, X } from 'lucide-react';
import type { PortfolioWeights } from '@/lib/risk-types';

interface EditablePortfolioTableProps {
  portfolio: PortfolioWeights;
  onPortfolioChange: (portfolio: PortfolioWeights) => void;
  availableAssets?: string[];
  title?: string;
  maxHeight?: string;
}

export default function EditablePortfolioTable({
  portfolio,
  onPortfolioChange,
  availableAssets = [],
  title = 'Portfolio Holdings',
  maxHeight = '350px',
}: EditablePortfolioTableProps) {
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetWeight, setNewAssetWeight] = useState('');

  const totalWeight = Object.values(portfolio).reduce((sum, w) => sum + w, 0);
  const assetCount = Object.keys(portfolio).length;

  // Start editing a weight
  const handleStartEdit = (asset: string, currentWeight: number) => {
    setEditingAsset(asset);
    setEditValue((currentWeight * 100).toFixed(2));
  };

  // Save edited weight
  const handleSaveEdit = () => {
    if (editingAsset && editValue !== '') {
      const newWeight = parseFloat(editValue) / 100;
      if (!isNaN(newWeight) && newWeight >= 0 && newWeight <= 1) {
        onPortfolioChange({
          ...portfolio,
          [editingAsset]: newWeight,
        });
      }
    }
    setEditingAsset(null);
    setEditValue('');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingAsset(null);
    setEditValue('');
  };

  // Remove asset
  const handleRemoveAsset = (asset: string) => {
    const newPortfolio = { ...portfolio };
    delete newPortfolio[asset];
    onPortfolioChange(newPortfolio);
  };

  // Add new asset
  const handleAddAsset = () => {
    if (newAssetName && newAssetWeight) {
      const weight = parseFloat(newAssetWeight) / 100;
      if (!isNaN(weight) && weight >= 0 && weight <= 1) {
        onPortfolioChange({
          ...portfolio,
          [newAssetName]: weight,
        });
        setNewAssetName('');
        setNewAssetWeight('');
        setShowAddAsset(false);
      }
    }
  };

  // Normalize weights to sum to 100%
  const handleNormalize = useCallback(() => {
    if (totalWeight === 0) return;
    const normalized: PortfolioWeights = {};
    Object.entries(portfolio).forEach(([asset, weight]) => {
      normalized[asset] = weight / totalWeight;
    });
    onPortfolioChange(normalized);
  }, [portfolio, totalWeight, onPortfolioChange]);

  // Get unused assets for dropdown
  const unusedAssets = availableAssets.filter(a => !(a in portfolio));

  // Handle key press for edit input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded ${
            Math.abs(totalWeight - 1) < 0.001
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {(totalWeight * 100).toFixed(1)}%
          </span>
          {Math.abs(totalWeight - 1) > 0.001 && (
            <button
              onClick={handleNormalize}
              className="p-1 text-gray-400 hover:text-[#0B6D7B] transition-colors"
              title="Normalize to 100%"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              <th className="text-left py-1.5 px-2 font-medium text-gray-500">Asset</th>
              <th className="text-right py-1.5 px-2 font-medium text-gray-500 w-20">Weight</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(portfolio)
              .sort((a, b) => b[1] - a[1])
              .map(([asset, weight]) => (
                <tr key={asset} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-1.5 px-2 text-gray-700 truncate max-w-[140px]" title={asset}>
                    {asset}
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    {editingAsset === asset ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyPress}
                          className="w-14 px-1 py-0.5 text-right border border-[#0B6D7B] rounded text-xs focus:outline-none"
                          step="0.1"
                          min="0"
                          max="100"
                          autoFocus
                        />
                        <span className="text-gray-400">%</span>
                        <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-700">
                          <Check size={12} />
                        </button>
                        <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => handleStartEdit(asset, weight)}
                        className="font-mono text-gray-700 cursor-pointer hover:text-[#0B6D7B] hover:underline"
                      >
                        {(weight * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-1">
                    <button
                      onClick={() => handleRemoveAsset(asset)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      title="Remove asset"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Add Asset Section */}
      {showAddAsset ? (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {unusedAssets.length > 0 ? (
              <select
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0B6D7B] focus:border-transparent"
              >
                <option value="">Select asset...</option>
                {unusedAssets.map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                placeholder="Asset name"
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0B6D7B] focus:border-transparent"
              />
            )}
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={newAssetWeight}
                onChange={(e) => setNewAssetWeight(e.target.value)}
                placeholder="0"
                className="w-14 px-2 py-1.5 text-xs text-right border border-gray-300 rounded focus:ring-1 focus:ring-[#0B6D7B] focus:border-transparent"
                step="0.1"
                min="0"
                max="100"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddAsset}
              disabled={!newAssetName || !newAssetWeight}
              className="flex-1 py-1.5 px-2 bg-[#0B6D7B] text-white text-xs font-medium rounded hover:bg-[#095a66] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddAsset(false);
                setNewAssetName('');
                setNewAssetWeight('');
              }}
              className="py-1.5 px-3 bg-gray-200 text-gray-600 text-xs font-medium rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddAsset(true)}
          className="mt-3 w-full py-2 text-xs text-gray-500 hover:text-[#0B6D7B] hover:bg-gray-50 rounded border border-dashed border-gray-300 hover:border-[#0B6D7B] transition-colors flex items-center justify-center gap-1"
        >
          <Plus size={14} />
          Add Asset
        </button>
      )}

      {/* Summary */}
      <div className="mt-3 flex justify-between text-xs text-gray-500">
        <span>{assetCount} assets</span>
        <span className="text-gray-400">Click weight to edit</span>
      </div>
    </div>
  );
}
