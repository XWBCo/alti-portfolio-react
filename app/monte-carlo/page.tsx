'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import MultiSlotParameterPanel from '@/components/monte-carlo/MultiSlotParameterPanel';
import SimulationChart from '@/components/monte-carlo/SimulationChart';
import OutcomeProbabilities from '@/components/monte-carlo/OutcomeProbabilities';
import SimulationSummaryTable from '@/components/monte-carlo/SimulationSummaryTable';
import DrawdownAnalysisChart from '@/components/monte-carlo/DrawdownAnalysisChart';
import SpendingScheduleChart from '@/components/monte-carlo/SpendingScheduleChart';
import { runSimulationPiecewise, formatCurrency } from '@/lib/simulation';
import { downloadAllSimulationsCSV } from '@/lib/mcs-export';
import { FileDown } from 'lucide-react';
import {
  DEFAULT_GLOBAL_PARAMS,
  DEFAULT_SLOT_1,
  DEFAULT_SLOT_2,
  DEFAULT_SLOT_3,
  DEFAULT_CHART_SIZING,
} from '@/lib/mock-data';
import type {
  GlobalSimulationParams,
  SimulationSlotParams,
  ChartSizingParams,
  SimulationResult,
  SimulationParams,
  PiecewiseParams,
} from '@/lib/types';

export default function MonteCarloPage() {
  // State for global parameters
  const [globalParams, setGlobalParams] = useState<GlobalSimulationParams>(DEFAULT_GLOBAL_PARAMS);

  // State for each simulation slot
  const [slot1, setSlot1] = useState<SimulationSlotParams>(DEFAULT_SLOT_1);
  const [slot2, setSlot2] = useState<SimulationSlotParams>(DEFAULT_SLOT_2);
  const [slot3, setSlot3] = useState<SimulationSlotParams>(DEFAULT_SLOT_3);

  // Chart sizing
  const [chartSizing, setChartSizing] = useState<ChartSizingParams>(DEFAULT_CHART_SIZING);

  // Results for each slot
  const [results, setResults] = useState<{
    slot1: SimulationResult | null;
    slot2: SimulationResult | null;
    slot3: SimulationResult | null;
  }>({
    slot1: null,
    slot2: null,
    slot3: null,
  });

  // Running state for each slot
  const [runningSlots, setRunningSlots] = useState({
    slot1: false,
    slot2: false,
    slot3: false,
  });

  // Last run times
  const [lastRunTimes, setLastRunTimes] = useState<{
    slot1: number | null;
    slot2: number | null;
    slot3: number | null;
  }>({
    slot1: null,
    slot2: null,
    slot3: null,
  });

  // Convert slot params to simulation params
  const slotToSimParams = (slot: SimulationSlotParams): SimulationParams => {
    const durationYears = slot.durationQuarters / 4;
    return {
      initialValue: globalParams.initialValue,
      annualReturn: slot.returnInitial,
      annualVolatility: slot.volInitial,
      quarterlyFixedSpending: 0,
      quarterlyPercentSpending: 0,
      durationYears,
      numSimulations: globalParams.numSimulations,
      inflationRate: globalParams.inflationRate,
      afterTaxRate: globalParams.afterTaxRate,
      customSpending: slot.customSpending,
      usePiecewise: true,
      returnUpdate1: slot.returnUpdate1,
      returnUpdate2: slot.returnUpdate2,
      volUpdate1: slot.volUpdate1,
      volUpdate2: slot.volUpdate2,
      update1Year: slot.update1Year,
      update2Year: slot.update2Year,
    };
  };

  // Run simulation for a specific slot
  const runSlotSimulation = useCallback(
    (slotNumber: 1 | 2 | 3) => {
      const slotKey = `slot${slotNumber}` as 'slot1' | 'slot2' | 'slot3';
      setRunningSlots((prev) => ({ ...prev, [slotKey]: true }));

      setTimeout(() => {
        const startTime = performance.now();

        const slot = slotNumber === 1 ? slot1 : slotNumber === 2 ? slot2 : slot3;
        const simParams = slotToSimParams(slot);

        const piecewise: PiecewiseParams = {
          returnInitial: slot.returnInitial,
          returnUpdate1: slot.returnUpdate1,
          returnUpdate2: slot.returnUpdate2,
          volInitial: slot.volInitial,
          volUpdate1: slot.volUpdate1,
          volUpdate2: slot.volUpdate2,
          update1Year: slot.update1Year,
          update2Year: slot.update2Year,
          startYear: new Date().getFullYear(),
        };

        const result = runSimulationPiecewise(simParams, piecewise);
        const endTime = performance.now();

        setResults((prev) => ({ ...prev, [slotKey]: result }));
        setLastRunTimes((prev) => ({ ...prev, [slotKey]: endTime - startTime }));
        setRunningSlots((prev) => ({ ...prev, [slotKey]: false }));
      }, 50);
    },
    [globalParams, slot1, slot2, slot3]
  );

  const handleRunSlot1 = useCallback(() => runSlotSimulation(1), [runSlotSimulation]);
  const handleRunSlot2 = useCallback(() => runSlotSimulation(2), [runSlotSimulation]);
  const handleRunSlot3 = useCallback(() => runSlotSimulation(3), [runSlotSimulation]);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="flex h-[calc(100vh-122px)]">
        {/* Left Sidebar - Parameter Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MultiSlotParameterPanel
            globalParams={globalParams}
            slot1={slot1}
            slot2={slot2}
            slot3={slot3}
            chartSizing={chartSizing}
            onGlobalParamsChange={setGlobalParams}
            onSlot1Change={setSlot1}
            onSlot2Change={setSlot2}
            onSlot3Change={setSlot3}
            onChartSizingChange={setChartSizing}
            onRunSlot1={handleRunSlot1}
            onRunSlot2={handleRunSlot2}
            onRunSlot3={handleRunSlot3}
            runningSlots={runningSlots}
          />
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Global Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded border border-[#e6e6e6] p-4 mb-6 flex items-center justify-between"
          >
            <div className="flex gap-8">
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">
                  Initial Value
                </p>
                <p className="text-[18px] font-semibold text-[#010203]">
                  {formatCurrency(globalParams.initialValue)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">
                  Scenarios
                </p>
                <p className="text-[18px] font-semibold text-[#0B6D7B]">
                  {globalParams.numSimulations.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">
                  Inflation Rate
                </p>
                <p className="text-[18px] font-semibold text-[#074269]">
                  {(globalParams.inflationRate * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">
                  After-Tax Rate
                </p>
                <p className="text-[18px] font-semibold text-[#010203]">
                  {(globalParams.afterTaxRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            {/* Export Button */}
            {(results.slot1 || results.slot2 || results.slot3) && (
              <button
                onClick={() => downloadAllSimulationsCSV({
                  globalParams,
                  slots: [
                    { params: slot1, result: results.slot1 },
                    { params: slot2, result: results.slot2 },
                    { params: slot3, result: results.slot3 },
                  ],
                })}
                className="flex items-center gap-2 px-4 py-2 bg-[#074269] text-white text-sm font-medium rounded-lg hover:bg-[#053252] transition-colors"
              >
                <FileDown size={16} />
                Export Excel
              </button>
            )}
          </motion.div>

          {/* Simulation 1 */}
          {results.slot1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#621368]" />
                  <h3
                    className="text-[#010203]"
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: '20px',
                      fontWeight: 400,
                    }}
                  >
                    {slot1.name}
                  </h3>
                </div>
                {lastRunTimes.slot1 !== null && (
                  <p className="text-[13px] text-[#00f0db] font-medium">
                    {lastRunTimes.slot1.toFixed(0)}ms
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SimulationChart result={results.slot1} showPaths={true} numPathsToShow={30} />
                </div>
                <div>
                  <OutcomeProbabilities probabilities={results.slot1.probabilities} />
                </div>
              </div>

              {/* Final Values */}
              <div className="mt-4 bg-white rounded border border-[#e6e6e6] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center py-2">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">5th</p>
                    <p className="text-[16px] font-semibold text-[#EF4444]">
                      {formatCurrency(results.slot1.percentile5[results.slot1.percentile5.length - 1])}
                    </p>
                  </div>
                  <div className="flex-1 text-center py-2">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">25th</p>
                    <p className="text-[16px] font-semibold text-[#F59E0B]">
                      {formatCurrency(results.slot1.percentile25[results.slot1.percentile25.length - 1])}
                    </p>
                  </div>
                  <div className="flex-1 text-center bg-[#E5F5F3] rounded py-3 px-4">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">Median</p>
                    <p className="text-[20px] font-semibold text-[#074269]">
                      {formatCurrency(results.slot1.median[results.slot1.median.length - 1])}
                    </p>
                  </div>
                  <div className="flex-1 text-center py-2">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">75th</p>
                    <p className="text-[16px] font-semibold text-[#0B6D7B]">
                      {formatCurrency(results.slot1.percentile75[results.slot1.percentile75.length - 1])}
                    </p>
                  </div>
                  <div className="flex-1 text-center py-2">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">95th</p>
                    <p className="text-[16px] font-semibold text-[#22C55E]">
                      {formatCurrency(results.slot1.percentile95[results.slot1.percentile95.length - 1])}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Simulation 2 */}
          {results.slot2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#074269]" />
                  <h3
                    className="text-[#010203]"
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: '20px',
                      fontWeight: 400,
                    }}
                  >
                    {slot2.name}
                  </h3>
                </div>
                {lastRunTimes.slot2 !== null && (
                  <p className="text-[13px] text-[#00f0db] font-medium">
                    {lastRunTimes.slot2.toFixed(0)}ms
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SimulationChart result={results.slot2} showPaths={true} numPathsToShow={30} />
                </div>
                <div>
                  <OutcomeProbabilities probabilities={results.slot2.probabilities} />
                </div>
              </div>

              <div className="mt-4 bg-white rounded border border-[#e6e6e6] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center py-2">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">5th</p>
                    <p className="text-[16px] font-semibold text-[#EF4444]">
                      {formatCurrency(results.slot2.percentile5[results.slot2.percentile5.length - 1])}
                    </p>
                  </div>
                  <div className="flex-1 text-center py-2">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">25th</p>
                    <p className="text-[16px] font-semibold text-[#F59E0B]">
                      {formatCurrency(results.slot2.percentile25[results.slot2.percentile25.length - 1])}
                    </p>
                  </div>
                  <div className="flex-1 text-center bg-[#E5F5F3] rounded py-3 px-4">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">Median</p>
                    <p className="text-[20px] font-semibold text-[#074269]">
                      {formatCurrency(results.slot2.median[results.slot2.median.length - 1])}
                    </p>
                  </div>
                  <div className="flex-1 text-center py-2">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">75th</p>
                    <p className="text-[16px] font-semibold text-[#0B6D7B]">
                      {formatCurrency(results.slot2.percentile75[results.slot2.percentile75.length - 1])}
                    </p>
                  </div>
                  <div className="flex-1 text-center py-2">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">95th</p>
                    <p className="text-[16px] font-semibold text-[#22C55E]">
                      {formatCurrency(results.slot2.percentile95[results.slot2.percentile95.length - 1])}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Simulation 3 */}
          {results.slot3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#0B6D7B]" />
                  <h3
                    className="text-[#010203]"
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: '20px',
                      fontWeight: 400,
                    }}
                  >
                    {slot3.name}
                  </h3>
                </div>
                {lastRunTimes.slot3 !== null && (
                  <p className="text-[13px] text-[#00f0db] font-medium">
                    {lastRunTimes.slot3.toFixed(0)}ms
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SimulationChart result={results.slot3} showPaths={true} numPathsToShow={30} />
                </div>
                <div>
                  <OutcomeProbabilities probabilities={results.slot3.probabilities} />
                </div>
              </div>

              <div className="mt-4 bg-white rounded border border-[#e6e6e6] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center py-2">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">5th</p>
                    <p className="text-[16px] font-semibold text-[#EF4444]">
                      {formatCurrency(results.slot3.percentile5[results.slot3.percentile5.length - 1])}
                    </p>
                  </div>
                  <div className="flex-1 text-center py-2">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">25th</p>
                    <p className="text-[16px] font-semibold text-[#F59E0B]">
                      {formatCurrency(results.slot3.percentile25[results.slot3.percentile25.length - 1])}
                    </p>
                  </div>
                  <div className="flex-1 text-center bg-[#E5F5F3] rounded py-3 px-4">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">Median</p>
                    <p className="text-[20px] font-semibold text-[#074269]">
                      {formatCurrency(results.slot3.median[results.slot3.median.length - 1])}
                    </p>
                  </div>
                  <div className="flex-1 text-center py-2">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">75th</p>
                    <p className="text-[16px] font-semibold text-[#0B6D7B]">
                      {formatCurrency(results.slot3.percentile75[results.slot3.percentile75.length - 1])}
                    </p>
                  </div>
                  <div className="flex-1 text-center py-2">
                    <p className="text-[11px] text-[#757575] uppercase mb-1">95th</p>
                    <p className="text-[16px] font-semibold text-[#22C55E]">
                      {formatCurrency(results.slot3.percentile95[results.slot3.percentile95.length - 1])}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Summary Comparison Table */}
          {(results.slot1 || results.slot2 || results.slot3) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="mb-8"
            >
              <SimulationSummaryTable
                slot1={slot1}
                slot2={slot2}
                slot3={slot3}
                results={results}
                initialValue={globalParams.initialValue}
              />
            </motion.div>
          )}

          {/* Drawdown Analysis Chart */}
          {(results.slot1 || results.slot2 || results.slot3) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.55 }}
              className="bg-white rounded border border-[#e6e6e6] p-4 mb-8"
              style={{ minHeight: '480px' }}
            >
              <h3
                className="text-[16px] font-light text-[#010203] mb-4"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Drawdown Analysis
              </h3>
              <DrawdownAnalysisChart
                results={[results.slot1, results.slot2, results.slot3]}
                slotNames={[slot1.name, slot2.name, slot3.name]}
                slotColors={['#00f0db', '#0B6D7B', '#074269']}
              />
            </motion.div>
          )}

          {/* Spending Schedule Charts - one per slot with spending */}
          {results.slot1 && (slot1.customSpending && Object.keys(slot1.customSpending).length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="bg-white rounded border border-[#e6e6e6] p-4 mb-8"
              style={{ minHeight: '450px' }}
            >
              <h3
                className="text-[16px] font-light text-[#010203] mb-4"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Spending Schedule - {slot1.name}
              </h3>
              <SpendingScheduleChart
                result={results.slot1}
                slotParams={slot1}
                initialValue={globalParams.initialValue}
                color="#00f0db"
              />
            </motion.div>
          )}

          {results.slot2 && (slot2.customSpending && Object.keys(slot2.customSpending).length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.65 }}
              className="bg-white rounded border border-[#e6e6e6] p-4 mb-8"
              style={{ minHeight: '450px' }}
            >
              <h3
                className="text-[16px] font-light text-[#010203] mb-4"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Spending Schedule - {slot2.name}
              </h3>
              <SpendingScheduleChart
                result={results.slot2}
                slotParams={slot2}
                initialValue={globalParams.initialValue}
                color="#0B6D7B"
              />
            </motion.div>
          )}

          {results.slot3 && (slot3.customSpending && Object.keys(slot3.customSpending).length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              className="bg-white rounded border border-[#e6e6e6] p-4 mb-8"
              style={{ minHeight: '450px' }}
            >
              <h3
                className="text-[16px] font-light text-[#010203] mb-4"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Spending Schedule - {slot3.name}
              </h3>
              <SpendingScheduleChart
                result={results.slot3}
                slotParams={slot3}
                initialValue={globalParams.initialValue}
                color="#074269"
              />
            </motion.div>
          )}

          {/* Empty State */}
          {!results.slot1 && !results.slot2 && !results.slot3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex items-center justify-center h-[500px]"
            >
              <div className="text-center">
                <p className="text-[18px] text-[#757575] mb-2">
                  Configure parameters and run simulations
                </p>
                <p className="text-[13px] text-[#757575]">
                  Click the play button on any simulation slot to begin
                </p>
              </div>
            </motion.div>
          )}

          {/* Tech Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-6 p-4 bg-[#010203] rounded text-center"
          >
            <p className="text-[#00f0db] text-[13px]">
              <strong>Multi-Slot Monte Carlo:</strong> Run up to 3 independent simulations with
              piecewise return/volatility schedules. Client-side computation, zero server latency.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
