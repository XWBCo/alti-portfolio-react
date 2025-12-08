'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PORTFOLIO_PRESETS } from '@/lib/mock-data';
import type { SimulationParams } from '@/lib/types';

interface ParameterPanelProps {
  params: SimulationParams;
  onParamsChange: (params: SimulationParams) => void;
  onRunSimulation: () => void;
  isRunning: boolean;
}

export default function ParameterPanel({
  params,
  onParamsChange,
  onRunSimulation,
  isRunning,
}: ParameterPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const updateParam = <K extends keyof SimulationParams>(
    key: K,
    value: SimulationParams[K]
  ) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <div
      className="bg-[#f8f9fa] h-full overflow-y-auto"
      style={{ padding: '24px', width: '320px', minWidth: '320px' }}
    >
      <h2
        className="text-[#010203] mb-6"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: '21px',
          fontWeight: 400,
        }}
      >
        Simulation Parameters
      </h2>

      {/* Portfolio Presets */}
      <div className="mb-6">
        <label className="block text-[13px] text-[#757575] mb-2 font-medium">
          Portfolio Preset
        </label>
        <select
          className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px] text-[#010203]"
          onChange={(e) => {
            const preset = PORTFOLIO_PRESETS.find((p) => p.name === e.target.value);
            if (preset) {
              onParamsChange({
                ...params,
                annualReturn: preset.expectedReturn / 100,
                annualVolatility: preset.volatility / 100,
              });
            }
          }}
        >
          <option value="">Select a preset...</option>
          {PORTFOLIO_PRESETS.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name} ({preset.expectedReturn}% / {preset.volatility}%)
            </option>
          ))}
        </select>
      </div>

      {/* Global Parameters */}
      <div className="mb-6 pb-6 border-b border-[#e6e6e6]">
        <h3 className="text-[15px] font-medium text-[#010203] mb-4">
          Global Parameters
        </h3>

        <div className="space-y-4">
          {/* Initial Value */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              Initial Portfolio Value
            </label>
            <input
              type="text"
              value={formatCurrency(params.initialValue)}
              onChange={(e) => {
                const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                updateParam('initialValue', value);
              }}
              className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
            />
          </div>

          {/* Number of Simulations */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              Number of Simulations
            </label>
            <input
              type="number"
              value={params.numSimulations}
              onChange={(e) => updateParam('numSimulations', parseInt(e.target.value) || 1000)}
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
              value={(params.inflationRate * 100).toFixed(1)}
              onChange={(e) => updateParam('inflationRate', parseFloat(e.target.value) / 100 || 0)}
              min={0}
              max={10}
              step={0.1}
              className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
            />
          </div>
        </div>
      </div>

      {/* Return & Risk */}
      <div className="mb-6 pb-6 border-b border-[#e6e6e6]">
        <h3 className="text-[15px] font-medium text-[#010203] mb-4">
          Expected Return & Risk
        </h3>

        <div className="space-y-4">
          {/* Expected Return */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              Expected Annual Return (%)
            </label>
            <input
              type="number"
              value={(params.annualReturn * 100).toFixed(1)}
              onChange={(e) => updateParam('annualReturn', parseFloat(e.target.value) / 100 || 0)}
              min={-20}
              max={30}
              step={0.5}
              className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
            />
            <input
              type="range"
              value={params.annualReturn * 100}
              onChange={(e) => updateParam('annualReturn', parseFloat(e.target.value) / 100)}
              min={-10}
              max={20}
              step={0.5}
              className="w-full mt-2 accent-[#00f0db]"
            />
          </div>

          {/* Volatility */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              Annual Volatility (%)
            </label>
            <input
              type="number"
              value={(params.annualVolatility * 100).toFixed(1)}
              onChange={(e) => updateParam('annualVolatility', parseFloat(e.target.value) / 100 || 0)}
              min={0}
              max={50}
              step={0.5}
              className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
            />
            <input
              type="range"
              value={params.annualVolatility * 100}
              onChange={(e) => updateParam('annualVolatility', parseFloat(e.target.value) / 100)}
              min={0}
              max={30}
              step={0.5}
              className="w-full mt-2 accent-[#00f0db]"
            />
          </div>
        </div>
      </div>

      {/* Spending Parameters */}
      <div className="mb-6 pb-6 border-b border-[#e6e6e6]">
        <h3 className="text-[15px] font-medium text-[#010203] mb-4">
          Spending Rules
        </h3>

        <div className="space-y-4">
          {/* Fixed Spending */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              Quarterly Fixed Spending
            </label>
            <input
              type="text"
              value={formatCurrency(params.quarterlyFixedSpending)}
              onChange={(e) => {
                const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                updateParam('quarterlyFixedSpending', value);
              }}
              className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
            />
          </div>

          {/* Percent Spending */}
          <div>
            <label className="block text-[13px] text-[#757575] mb-2">
              Quarterly % Spending
            </label>
            <input
              type="number"
              value={(params.quarterlyPercentSpending * 100).toFixed(2)}
              onChange={(e) => updateParam('quarterlyPercentSpending', parseFloat(e.target.value) / 100 || 0)}
              min={0}
              max={5}
              step={0.01}
              className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
            />
          </div>
        </div>
      </div>

      {/* Duration */}
      <div className="mb-6">
        <h3 className="text-[15px] font-medium text-[#010203] mb-4">
          Simulation Duration
        </h3>

        <div>
          <label className="block text-[13px] text-[#757575] mb-2">
            Years: {params.durationYears}
          </label>
          <input
            type="range"
            value={params.durationYears}
            onChange={(e) => updateParam('durationYears', parseInt(e.target.value))}
            min={5}
            max={50}
            step={1}
            className="w-full accent-[#00f0db]"
          />
          <div className="flex justify-between text-[11px] text-[#757575] mt-1">
            <span>5 years</span>
            <span>50 years</span>
          </div>
        </div>
      </div>

      {/* Advanced: Regime Changes */}
      <div className="mb-6 pb-6 border-b border-[#e6e6e6]">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center gap-2 text-[15px] font-medium text-[#010203] mb-4 w-full text-left hover:text-[#00B5AD] transition-colors"
        >
          {advancedOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          Advanced: Regime Changes
        </button>

        {advancedOpen && (
          <div className="space-y-4 pl-1">
            {/* Enable Piecewise */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="usePiecewise"
                checked={params.usePiecewise || false}
                onChange={(e) => updateParam('usePiecewise', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#00f0db] focus:ring-[#00f0db]"
              />
              <label htmlFor="usePiecewise" className="text-[13px] text-[#010203]">
                Enable regime changes over time
              </label>
            </div>

            {params.usePiecewise && (
              <>
                <div className="p-3 bg-[#074269]/5 rounded text-[11px] text-[#074269]">
                  Model changing market assumptions: start with initial values, then transition to new return/volatility at specified years.
                </div>

                {/* Period 2 */}
                <div className="border-l-2 border-[#00f0db] pl-3">
                  <p className="text-[12px] font-medium text-[#010203] mb-2">Period 2</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-[#757575] mb-1">
                        Start Year
                      </label>
                      <input
                        type="number"
                        value={params.update1Year || 5}
                        onChange={(e) => updateParam('update1Year', parseInt(e.target.value) || 5)}
                        min={1}
                        max={params.durationYears - 1}
                        className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#757575] mb-1">
                        Return (%)
                      </label>
                      <input
                        type="number"
                        value={((params.returnUpdate1 ?? params.annualReturn) * 100).toFixed(1)}
                        onChange={(e) => updateParam('returnUpdate1', parseFloat(e.target.value) / 100 || 0)}
                        step={0.5}
                        className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#757575] mb-1">
                        Volatility (%)
                      </label>
                      <input
                        type="number"
                        value={((params.volUpdate1 ?? params.annualVolatility) * 100).toFixed(1)}
                        onChange={(e) => updateParam('volUpdate1', parseFloat(e.target.value) / 100 || 0)}
                        step={0.5}
                        className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Period 3 */}
                <div className="border-l-2 border-[#00d6c3] pl-3">
                  <p className="text-[12px] font-medium text-[#010203] mb-2">Period 3 (Optional)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-[#757575] mb-1">
                        Start Year
                      </label>
                      <input
                        type="number"
                        value={params.update2Year || 10}
                        onChange={(e) => updateParam('update2Year', parseInt(e.target.value) || 10)}
                        min={(params.update1Year || 5) + 1}
                        max={params.durationYears}
                        className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#757575] mb-1">
                        Return (%)
                      </label>
                      <input
                        type="number"
                        value={((params.returnUpdate2 ?? params.annualReturn) * 100).toFixed(1)}
                        onChange={(e) => updateParam('returnUpdate2', parseFloat(e.target.value) / 100 || 0)}
                        step={0.5}
                        className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#757575] mb-1">
                        Volatility (%)
                      </label>
                      <input
                        type="number"
                        value={((params.volUpdate2 ?? params.annualVolatility) * 100).toFixed(1)}
                        onChange={(e) => updateParam('volUpdate2', parseFloat(e.target.value) / 100 || 0)}
                        step={0.5}
                        className="w-full p-2 border border-[#e6e6e6] rounded bg-white text-[13px]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Run Button */}
      <button
        onClick={onRunSimulation}
        disabled={isRunning}
        className={`
          w-full py-4 rounded text-[15px] font-medium transition-all duration-200
          ${isRunning
            ? 'bg-[#e6e6e6] text-[#757575] cursor-not-allowed'
            : 'bg-[#00f0db] text-[#010203] hover:bg-[#00d6c3] hover:shadow-md'
          }
        `}
      >
        {isRunning ? 'Running Simulation...' : 'Run Simulation'}
      </button>
    </div>
  );
}
