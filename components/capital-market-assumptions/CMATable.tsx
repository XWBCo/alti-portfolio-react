'use client';

import { useState, useMemo } from 'react';
import type { CMAAsset, Purpose } from '@/lib/cma-types';
import { PURPOSE_COLORS } from '@/lib/cma-types';

interface CMATableProps {
  data: CMAAsset[];
}

type SortField = 'purpose' | 'group' | 'assetClass' | 'forecastReturn' | 'forecastVolatility';
type SortDirection = 'asc' | 'desc';

const PURPOSE_BG: Record<Purpose, string> = {
  Stability: '#e6f4f7',
  Diversified: '#f6e6f9',
  Growth: '#e6eef7',
};

export default function CMATable({ data }: CMATableProps) {
  const [sortField, setSortField] = useState<SortField>('purpose');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterText, setFilterText] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    if (filterText) {
      const lower = filterText.toLowerCase();
      filtered = data.filter(
        (item) =>
          item.assetClass.toLowerCase().includes(lower) ||
          item.group.toLowerCase().includes(lower) ||
          item.purpose.toLowerCase().includes(lower)
      );
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'purpose':
          comparison = a.purpose.localeCompare(b.purpose);
          break;
        case 'group':
          comparison = a.group.localeCompare(b.group);
          break;
        case 'assetClass':
          comparison = a.assetClass.localeCompare(b.assetClass);
          break;
        case 'forecastReturn':
          comparison = a.forecastReturn - b.forecastReturn;
          break;
        case 'forecastVolatility':
          comparison = a.forecastVolatility - b.forecastVolatility;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection, filterText]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 opacity-30">↕</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filter Input */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Filter by asset class, group, or purpose..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full p-2 border border-[#e6e6e6] rounded text-[13px] focus:outline-none focus:border-[#074269]"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-[#e6e6e6] rounded">
        <table className="w-full text-[14px]" style={{ fontFamily: 'Arial, sans-serif' }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#074269] text-white">
              <th
                className="p-2 text-left font-semibold cursor-pointer hover:bg-[#0a5280] w-[20%]"
                onClick={() => handleSort('purpose')}
              >
                Purpose <SortIcon field="purpose" />
              </th>
              <th
                className="p-2 text-left font-semibold cursor-pointer hover:bg-[#0a5280] w-[25%]"
                onClick={() => handleSort('group')}
              >
                Group <SortIcon field="group" />
              </th>
              <th
                className="p-2 text-left font-semibold cursor-pointer hover:bg-[#0a5280] w-[25%]"
                onClick={() => handleSort('assetClass')}
              >
                Asset Class <SortIcon field="assetClass" />
              </th>
              <th
                className="p-2 text-center font-semibold cursor-pointer hover:bg-[#0a5280] w-[15%]"
                onClick={() => handleSort('forecastReturn')}
              >
                Return (%) <SortIcon field="forecastReturn" />
              </th>
              <th
                className="p-2 text-center font-semibold cursor-pointer hover:bg-[#0a5280] w-[15%]"
                onClick={() => handleSort('forecastVolatility')}
              >
                Volatility (%) <SortIcon field="forecastVolatility" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((item, idx) => (
              <tr
                key={`${item.assetClass}-${idx}`}
                className="border-b border-[#e6e6e6] hover:brightness-95 transition-all"
                style={{ backgroundColor: PURPOSE_BG[item.purpose] }}
              >
                <td className="p-2">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-[12px] text-white font-medium"
                    style={{ backgroundColor: PURPOSE_COLORS[item.purpose] }}
                  >
                    {item.purpose}
                  </span>
                </td>
                <td className="p-2 text-[#4A4A4A]">{item.group}</td>
                <td className="p-2 text-[#010203] font-medium">{item.assetClass}</td>
                <td className="p-2 text-center text-[#010203]">
                  {(item.forecastReturn * 100).toFixed(2)}
                </td>
                <td className="p-2 text-center text-[#010203]">
                  {(item.forecastVolatility * 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-2 text-[11px] text-[#757575]">
        Showing {filteredAndSortedData.length} of {data.length} asset classes
      </div>
    </div>
  );
}
