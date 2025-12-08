'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import ParameterPanel from '@/components/monte-carlo/ParameterPanel';
import SimulationChart from '@/components/monte-carlo/SimulationChart';
import OutcomeProbabilities from '@/components/monte-carlo/OutcomeProbabilities';
import { runSimulation, runSimulationPiecewise, formatCurrency } from '@/lib/simulation';
import { DEFAULT_PARAMS } from '@/lib/mock-data';
import type { SimulationParams, SimulationResult, PiecewiseParams } from '@/lib/types';

export default function MonteCarloPage() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<number | null>(null);

  const handleRunSimulation = useCallback(() => {
    setIsRunning(true);

    // Use setTimeout to allow UI to update before computation
    setTimeout(() => {
      const startTime = performance.now();

      let simulationResult: SimulationResult;

      if (params.usePiecewise) {
        // Build piecewise parameters
        const piecewise: PiecewiseParams = {
          returnInitial: params.annualReturn,
          returnUpdate1: params.returnUpdate1,
          returnUpdate2: params.returnUpdate2,
          volInitial: params.annualVolatility,
          volUpdate1: params.volUpdate1,
          volUpdate2: params.volUpdate2,
          update1Year: params.update1Year || 5,
          update2Year: params.update2Year || 10,
        };
        simulationResult = runSimulationPiecewise(params, piecewise);
      } else {
        simulationResult = runSimulation(params);
      }

      const endTime = performance.now();

      setResult(simulationResult);
      setLastRunTime(endTime - startTime);
      setIsRunning(false);
    }, 50);
  }, [params]);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="flex h-[calc(100vh-122px)]">
        {/* Left Sidebar - Parameter Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ParameterPanel
            params={params}
            onParamsChange={setParams}
            onRunSimulation={handleRunSimulation}
            isRunning={isRunning}
          />
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded border border-[#e6e6e6] p-4 mb-6 flex items-center justify-between"
          >
            <div className="flex gap-8">
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Initial Value</p>
                <p className="text-[18px] font-semibold text-[#010203]">
                  {formatCurrency(params.initialValue)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Expected Return</p>
                <p className="text-[18px] font-semibold text-[#0B6D7B]">
                  {(params.annualReturn * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Volatility</p>
                <p className="text-[18px] font-semibold text-[#074269]">
                  {(params.annualVolatility * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Duration</p>
                <p className="text-[18px] font-semibold text-[#010203]">
                  {params.durationYears} years
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Simulations</p>
                <p className="text-[18px] font-semibold text-[#010203]">
                  {params.numSimulations.toLocaleString()}
                </p>
              </div>
            </div>

            {lastRunTime !== null && (
              <div className="text-right">
                <p className="text-[11px] text-[#757575]">Last run</p>
                <p className="text-[13px] text-[#00f0db] font-medium">
                  {lastRunTime.toFixed(0)}ms
                </p>
              </div>
            )}
          </motion.div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-100px)]">
            {/* Main Chart - 2 columns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="lg:col-span-2 min-h-[400px]"
            >
              <SimulationChart result={result} showPaths={true} numPathsToShow={50} />
            </motion.div>

            {/* Probabilities - 1 column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="min-h-[400px]"
            >
              <OutcomeProbabilities
                probabilities={result?.probabilities ?? null}
              />
            </motion.div>
          </div>

          {/* Final Values Summary */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-6 bg-white rounded border border-[#e6e6e6] p-6"
            >
              <h3
                className="text-[#010203] mb-4"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: '18px',
                  fontWeight: 400,
                }}
              >
                Final Value Distribution (Year {params.durationYears})
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-[#f8f9fa] rounded">
                  <p className="text-[11px] text-[#757575] uppercase mb-1">5th Percentile</p>
                  <p className="text-[20px] font-semibold text-[#EF4444]">
                    {formatCurrency(result.percentile5[result.percentile5.length - 1])}
                  </p>
                </div>
                <div className="text-center p-4 bg-[#f8f9fa] rounded">
                  <p className="text-[11px] text-[#757575] uppercase mb-1">25th Percentile</p>
                  <p className="text-[20px] font-semibold text-[#F59E0B]">
                    {formatCurrency(result.percentile25[result.percentile25.length - 1])}
                  </p>
                </div>
                <div className="text-center p-4 bg-[#E5F5F3] rounded">
                  <p className="text-[11px] text-[#757575] uppercase mb-1">Median</p>
                  <p className="text-[24px] font-semibold text-[#074269]">
                    {formatCurrency(result.median[result.median.length - 1])}
                  </p>
                </div>
                <div className="text-center p-4 bg-[#f8f9fa] rounded">
                  <p className="text-[11px] text-[#757575] uppercase mb-1">75th Percentile</p>
                  <p className="text-[20px] font-semibold text-[#0B6D7B]">
                    {formatCurrency(result.percentile75[result.percentile75.length - 1])}
                  </p>
                </div>
                <div className="text-center p-4 bg-[#f8f9fa] rounded">
                  <p className="text-[11px] text-[#757575] uppercase mb-1">95th Percentile</p>
                  <p className="text-[20px] font-semibold text-[#22C55E]">
                    {formatCurrency(result.percentile95[result.percentile95.length - 1])}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tech Stack Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-6 p-4 bg-[#010203] rounded text-center"
          >
            <p className="text-[#00f0db] text-[13px]">
              <strong>React Advantage:</strong> {params.numSimulations.toLocaleString()} simulations
              running client-side in real-time. No server round-trips required.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
