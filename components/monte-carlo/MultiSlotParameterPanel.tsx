'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import SimulationSlot from './SimulationSlot';
import type {
  GlobalSimulationParams,
  SimulationSlotParams,
  ChartSizingParams,
  Currency,
} from '@/lib/types';

interface MultiSlotParameterPanelProps {
  globalParams: GlobalSimulationParams;
  slot1: SimulationSlotParams;
  slot2: SimulationSlotParams;
  slot3: SimulationSlotParams;
  chartSizing: ChartSizingParams;
  onGlobalParamsChange: (params: GlobalSimulationParams) => void;
  onSlot1Change: (params: SimulationSlotParams) => void;
  onSlot2Change: (params: SimulationSlotParams) => void;
  onSlot3Change: (params: SimulationSlotParams) => void;
  onChartSizingChange: (params: ChartSizingParams) => void;
  onRunSlot1: () => void;
  onRunSlot2: () => void;
  onRunSlot3: () => void;
  runningSlots: { slot1: boolean; slot2: boolean; slot3: boolean };
}

const SLOT_COLORS = {
  slot1: '#621368',
  slot2: '#074269',
  slot3: '#0B6D7B',
};

export default function MultiSlotParameterPanel({
  globalParams,
  slot1,
  slot2,
  slot3,
  chartSizing,
  onGlobalParamsChange,
  onSlot1Change,
  onSlot2Change,
  onSlot3Change,
  onChartSizingChange,
  onRunSlot1,
  onRunSlot2,
  onRunSlot3,
  runningSlots,
}: MultiSlotParameterPanelProps) {
  const [chartSettingsOpen, setChartSettingsOpen] = useState(false);

  const formatCurrency = (value: number) => {
    const currencyCode = globalParams.currency || 'USD';
    return new Intl.NumberFormat(currencyCode === 'GBP' ? 'en-GB' : currencyCode === 'EUR' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const updateGlobalParam = <K extends keyof GlobalSimulationParams>(
    key: K,
    value: GlobalSimulationParams[K]
  ) => {
    onGlobalParamsChange({ ...globalParams, [key]: value });
  };

  const updateChartSizing = <K extends keyof ChartSizingParams>(
    key: K,
    value: ChartSizingParams[K]
  ) => {
    onChartSizingChange({ ...chartSizing, [key]: value });
  };

  return (
    <div
      className="bg-[#f8f9fa] h-full overflow-y-auto"
      style={{ padding: '24px', width: '360px', minWidth: '360px' }}
    >
      <h2
        className="text-[#010203] mb-6"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: '21px',
          fontWeight: 400,
        }}
      >
        Monte Carlo Simulations
      </h2>

      {/* Global Parameters */}
      <div className="mb-6 pb-6 border-b border-[#e6e6e6]">
        <h3 className="text-[15px] font-medium text-[#010203] mb-4">
          Global Parameters
        </h3>

        <div className="space-y-4">
          {/* Initial Portfolio Value */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              Initial Portfolio Value
            </label>
            <input
              type="text"
              value={formatCurrency(globalParams.initialValue)}
              onChange={(e) => {
                const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                updateGlobalParam('initialValue', value);
              }}
              className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
            />
          </div>

          {/* Number of Simulations */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              Number of Simulations (Scenarios)
            </label>
            <input
              type="number"
              value={globalParams.numSimulations}
              onChange={(e) =>
                updateGlobalParam('numSimulations', parseInt(e.target.value) || 1000)
              }
              min={100}
              max={10000}
              step={100}
              className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
            />
          </div>

          {/* Inflation Rate */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              Inflation Rate (%)
            </label>
            <input
              type="number"
              value={(globalParams.inflationRate * 100).toFixed(1)}
              onChange={(e) =>
                updateGlobalParam('inflationRate', parseFloat(e.target.value) / 100 || 0)
              }
              min={0}
              max={10}
              step={0.1}
              className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
            />
          </div>

          {/* After-Tax Rate */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              After-Tax Rate (%)
            </label>
            <input
              type="number"
              value={(globalParams.afterTaxRate * 100).toFixed(1)}
              onChange={(e) =>
                updateGlobalParam('afterTaxRate', parseFloat(e.target.value) / 100 || 0)
              }
              min={0}
              max={10}
              step={0.1}
              className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
            />
          </div>

          {/* Currency Selector */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              Currency
            </label>
            <select
              value={globalParams.currency || 'USD'}
              onChange={(e) => updateGlobalParam('currency', e.target.value as Currency)}
              className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
            >
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart Display Settings */}
      <div className="mb-6 pb-6 border-b border-[#e6e6e6]">
        <button
          onClick={() => setChartSettingsOpen(!chartSettingsOpen)}
          className="flex items-center gap-2 text-[15px] font-medium text-[#010203] mb-4 w-full text-left hover:text-[#00B5AD] transition-colors"
        >
          {chartSettingsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <Settings size={16} />
          Chart Display Settings
        </button>

        {chartSettingsOpen && (
          <div className="space-y-3 pl-1">
            <div>
              <label className="block text-[11px] text-[#757575] mb-1">
                Line Chart Width (px)
              </label>
              <input
                type="number"
                value={chartSizing.lineChartWidth}
                onChange={(e) =>
                  updateChartSizing('lineChartWidth', parseInt(e.target.value) || 1200)
                }
                min={800}
                max={2000}
                step={50}
                className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#757575] mb-1">
                Line Chart Height (px)
              </label>
              <input
                type="number"
                value={chartSizing.lineChartHeight}
                onChange={(e) =>
                  updateChartSizing('lineChartHeight', parseInt(e.target.value) || 600)
                }
                min={400}
                max={1000}
                step={50}
                className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#757575] mb-1">
                Bar Chart Height (px)
              </label>
              <input
                type="number"
                value={chartSizing.barChartHeight}
                onChange={(e) =>
                  updateChartSizing('barChartHeight', parseInt(e.target.value) || 400)
                }
                min={300}
                max={800}
                step={50}
                className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#757575] mb-1">
                Probability Chart Height (px)
              </label>
              <input
                type="number"
                value={chartSizing.probChartHeight}
                onChange={(e) =>
                  updateChartSizing('probChartHeight', parseInt(e.target.value) || 400)
                }
                min={300}
                max={800}
                step={50}
                className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Simulation Slots */}
      <div className="space-y-4">
        <SimulationSlot
          slotNumber={1}
          params={slot1}
          onParamsChange={onSlot1Change}
          onRunSimulation={onRunSlot1}
          isRunning={runningSlots.slot1}
          color={SLOT_COLORS.slot1}
        />

        <SimulationSlot
          slotNumber={2}
          params={slot2}
          onParamsChange={onSlot2Change}
          onRunSimulation={onRunSlot2}
          isRunning={runningSlots.slot2}
          color={SLOT_COLORS.slot2}
        />

        <SimulationSlot
          slotNumber={3}
          params={slot3}
          onParamsChange={onSlot3Change}
          onRunSimulation={onRunSlot3}
          isRunning={runningSlots.slot3}
          color={SLOT_COLORS.slot3}
        />
      </div>
    </div>
  );
}
