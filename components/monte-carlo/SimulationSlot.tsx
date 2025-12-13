'use client';

import { useState } from 'react';
import { Play, ChevronDown, ChevronRight } from 'lucide-react';
import type { SimulationSlotParams } from '@/lib/types';
import SpendingUpload from './SpendingUpload';

interface SimulationSlotProps {
  slotNumber: 1 | 2 | 3;
  params: SimulationSlotParams;
  onParamsChange: (params: SimulationSlotParams) => void;
  onRunSimulation: () => void;
  isRunning: boolean;
  color: string;
}

const currentYear = new Date().getFullYear();

export default function SimulationSlot({
  slotNumber,
  params,
  onParamsChange,
  onRunSimulation,
  isRunning,
  color,
}: SimulationSlotProps) {
  const [isExpanded, setIsExpanded] = useState(slotNumber === 1);

  const updateParam = <K extends keyof SimulationSlotParams>(
    key: K,
    value: SimulationSlotParams[K]
  ) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <div className="mb-6 pb-6 border-b border-[#e6e6e6]">
      {/* Header with expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left mb-4 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <h3
            className="text-[#010203]"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: '18px',
              fontWeight: 400,
            }}
          >
            Simulation {slotNumber}
          </h3>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
        <Play
          size={18}
          className={`${
            isRunning
              ? 'text-[#757575] cursor-not-allowed'
              : 'text-[#00f0db] cursor-pointer hover:text-[#00d6c3]'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isRunning) onRunSimulation();
          }}
        />
      </button>

      {isExpanded && (
        <div className="space-y-4 pl-1">
          {/* Simulation Name */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              Simulation Name
            </label>
            <input
              type="text"
              value={params.name}
              onChange={(e) => updateParam('name', e.target.value)}
              className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
              placeholder={`Simulation ${slotNumber}`}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              Duration (Quarters): {params.durationQuarters}
            </label>
            <input
              type="range"
              value={params.durationQuarters}
              onChange={(e) => updateParam('durationQuarters', parseInt(e.target.value))}
              min={20}
              max={200}
              step={4}
              className="w-full accent-[#00f0db]"
            />
            <div className="flex justify-between text-[11px] text-[#757575] mt-1">
              <span>20 qtrs (5y)</span>
              <span>{Math.floor(params.durationQuarters / 4)}y</span>
              <span>200 qtrs (50y)</span>
            </div>
          </div>

          {/* Piecewise Parameters Section */}
          <div className="mt-4">
            <p className="text-[12px] font-medium text-[#010203] mb-3">
              Returns & Risk Schedule
            </p>

            {/* Initial Period */}
            <div className="mb-4 p-3 bg-[#f8f9fa] rounded">
              <p className="text-[11px] font-medium text-[#757575] uppercase mb-2">
                Initial Period
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#757575] mb-1">
                    Annual Return (%)
                  </label>
                  <input
                    type="number"
                    value={(params.returnInitial * 100).toFixed(1)}
                    onChange={(e) =>
                      updateParam('returnInitial', parseFloat(e.target.value) / 100 || 0)
                    }
                    step={0.5}
                    min={-20}
                    max={30}
                    className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#757575] mb-1">
                    Volatility (%)
                  </label>
                  <input
                    type="number"
                    value={(params.volInitial * 100).toFixed(1)}
                    onChange={(e) =>
                      updateParam('volInitial', parseFloat(e.target.value) / 100 || 0)
                    }
                    step={0.5}
                    min={0}
                    max={50}
                    className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                  />
                </div>
              </div>
            </div>

            {/* Update 1 */}
            <div className="mb-4 p-3 border-l-2 border-[#00f0db] pl-3 bg-[#00f0db]/5">
              <p className="text-[11px] font-medium text-[#010203] uppercase mb-2">
                Piecewise Update 1
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-[#757575] mb-1">Year</label>
                  <input
                    type="number"
                    value={params.update1Year}
                    onChange={(e) => updateParam('update1Year', parseInt(e.target.value) || currentYear)}
                    min={currentYear}
                    max={currentYear + 50}
                    className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#757575] mb-1">Return (%)</label>
                  <input
                    type="number"
                    value={(params.returnUpdate1 * 100).toFixed(1)}
                    onChange={(e) =>
                      updateParam('returnUpdate1', parseFloat(e.target.value) / 100 || 0)
                    }
                    step={0.5}
                    className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#757575] mb-1">Vol (%)</label>
                  <input
                    type="number"
                    value={(params.volUpdate1 * 100).toFixed(1)}
                    onChange={(e) =>
                      updateParam('volUpdate1', parseFloat(e.target.value) / 100 || 0)
                    }
                    step={0.5}
                    className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                  />
                </div>
              </div>
            </div>

            {/* Update 2 */}
            <div className="p-3 border-l-2 border-[#0B6D7B] pl-3 bg-[#0B6D7B]/5">
              <p className="text-[11px] font-medium text-[#010203] uppercase mb-2">
                Piecewise Update 2
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-[#757575] mb-1">Year</label>
                  <input
                    type="number"
                    value={params.update2Year}
                    onChange={(e) => updateParam('update2Year', parseInt(e.target.value) || currentYear)}
                    min={params.update1Year}
                    max={currentYear + 50}
                    className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#757575] mb-1">Return (%)</label>
                  <input
                    type="number"
                    value={(params.returnUpdate2 * 100).toFixed(1)}
                    onChange={(e) =>
                      updateParam('returnUpdate2', parseFloat(e.target.value) / 100 || 0)
                    }
                    step={0.5}
                    className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#757575] mb-1">Vol (%)</label>
                  <input
                    type="number"
                    value={(params.volUpdate2 * 100).toFixed(1)}
                    onChange={(e) =>
                      updateParam('volUpdate2', parseFloat(e.target.value) / 100 || 0)
                    }
                    step={0.5}
                    className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Spending Upload */}
          <SpendingUpload
            slotName={params.name}
            durationQuarters={params.durationQuarters}
            onSpendingLoaded={(spending) => updateParam('customSpending', spending)}
          />

          {/* Run Button */}
          <button
            onClick={onRunSimulation}
            disabled={isRunning}
            className={`
              w-full py-3 rounded text-[14px] font-medium transition-all duration-200 flex items-center justify-center gap-2
              ${
                isRunning
                  ? 'bg-[#e6e6e6] text-[#757575] cursor-not-allowed'
                  : 'text-white hover:opacity-90'
              }
            `}
            style={{
              backgroundColor: isRunning ? undefined : color,
            }}
          >
            <Play size={14} />
            {isRunning ? 'Running...' : `Run Simulation ${slotNumber}`}
          </button>
        </div>
      )}
    </div>
  );
}
