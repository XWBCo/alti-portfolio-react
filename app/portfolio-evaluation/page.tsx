'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import ParameterPanel from '@/components/portfolio-evaluation/ParameterPanel';
import EfficientFrontierChart from '@/components/portfolio-evaluation/EfficientFrontierChart';
import PortfolioTable from '@/components/portfolio-evaluation/PortfolioTable';
import MetricsSummary from '@/components/portfolio-evaluation/MetricsSummary';
import {
  generateEfficientFrontier,
  calculatePortfoliosWithMetrics,
  formatPercent,
} from '@/lib/optimization';
import { ASSET_CLASSES, CORRELATION_MATRIX, getAssetsByMode } from '@/lib/cma-data';
import type {
  OptimizationParams,
  FrontierPoint,
  PortfolioHoldings,
  PortfolioWithMetrics,
} from '@/lib/portfolio-types';

const DEFAULT_PARAMS: OptimizationParams = {
  mode: 'core',
  capsTemplate: 'standard',
  numPoints: 30,
};

export default function PortfolioEvaluationPage() {
  const [params, setParams] = useState<OptimizationParams>(DEFAULT_PARAMS);
  const [frontier, setFrontier] = useState<FrontierPoint[]>([]);
  const [uploadedPortfolios, setUploadedPortfolios] = useState<PortfolioHoldings[]>([]);
  const [portfoliosWithMetrics, setPortfoliosWithMetrics] = useState<PortfolioWithMetrics[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<number | null>(null);

  const handleRunOptimization = useCallback(() => {
    setIsRunning(true);

    // Use setTimeout to allow UI to update before computation
    setTimeout(() => {
      const startTime = performance.now();

      // Generate efficient frontier
      const result = generateEfficientFrontier(params);
      setFrontier(result.frontier);

      // Calculate metrics for uploaded portfolios
      if (uploadedPortfolios.length > 0) {
        const assets = getAssetsByMode(params.mode);
        const withMetrics = calculatePortfoliosWithMetrics(
          uploadedPortfolios,
          assets,
          CORRELATION_MATRIX
        );
        setPortfoliosWithMetrics(withMetrics);
      }

      const endTime = performance.now();
      setLastRunTime(endTime - startTime);
      setIsRunning(false);
    }, 50);
  }, [params, uploadedPortfolios]);

  const handlePortfoliosLoaded = useCallback((portfolios: PortfolioHoldings[]) => {
    setUploadedPortfolios(portfolios);

    // If frontier exists, calculate metrics immediately
    if (frontier.length > 0) {
      const assets = getAssetsByMode(params.mode);
      const withMetrics = calculatePortfoliosWithMetrics(
        portfolios,
        assets,
        CORRELATION_MATRIX
      );
      setPortfoliosWithMetrics(withMetrics);
    }
  }, [frontier.length, params.mode]);

  const currentAssets = getAssetsByMode(params.mode);

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
            onRunOptimization={handleRunOptimization}
            onPortfoliosLoaded={handlePortfoliosLoaded}
            isRunning={isRunning}
            uploadedPortfolios={uploadedPortfolios}
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
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Asset Universe</p>
                <p className="text-[18px] font-semibold text-[#010203]">
                  {params.mode === 'core' ? 'Core' : params.mode === 'core_private' ? 'Core + Private' : 'Unconstrained'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Assets</p>
                <p className="text-[18px] font-semibold text-[#0B6D7B]">
                  {currentAssets.length}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Constraints</p>
                <p className="text-[18px] font-semibold text-[#074269]">
                  {params.capsTemplate.charAt(0).toUpperCase() + params.capsTemplate.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Frontier Points</p>
                <p className="text-[18px] font-semibold text-[#010203]">
                  {frontier.length || params.numPoints}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Portfolios</p>
                <p className="text-[18px] font-semibold text-[#00E7D7]">
                  {portfoliosWithMetrics.length}
                </p>
              </div>
            </div>
            {lastRunTime !== null && (
              <p className="text-[11px] text-[#757575]">
                Computed in {lastRunTime.toFixed(0)}ms
              </p>
            )}
          </motion.div>

          {/* Main Chart - Efficient Frontier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded border border-[#e6e6e6] p-4 mb-6"
            style={{ height: '400px' }}
          >
            <h3
              className="text-[16px] font-light text-[#010203] mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Efficient Frontier
            </h3>
            <div style={{ height: 'calc(100% - 40px)' }}>
              <EfficientFrontierChart
                frontier={frontier}
                portfolios={portfoliosWithMetrics}
              />
            </div>
          </motion.div>

          {/* Bottom Grid - Tables */}
          <div className="grid grid-cols-2 gap-6">
            {/* Portfolio Holdings Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white rounded border border-[#e6e6e6] p-4"
              style={{ height: '350px' }}
            >
              <h3
                className="text-[16px] font-light text-[#010203] mb-4"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Portfolio Holdings
              </h3>
              <div style={{ height: 'calc(100% - 40px)' }}>
                <PortfolioTable
                  portfolios={portfoliosWithMetrics}
                  assets={ASSET_CLASSES}
                />
              </div>
            </motion.div>

            {/* Metrics Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="bg-white rounded border border-[#e6e6e6] p-4"
              style={{ height: '350px' }}
            >
              <h3
                className="text-[16px] font-light text-[#010203] mb-4"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Risk & Return Metrics
              </h3>
              <div style={{ height: 'calc(100% - 40px)' }}>
                <MetricsSummary portfolios={portfoliosWithMetrics} />
              </div>
            </motion.div>
          </div>

          {/* Info Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-6 p-4 bg-[#074269]/5 rounded-lg"
          >
            <p className="text-[12px] text-[#074269]">
              <strong>About this tool:</strong> The efficient frontier represents the set of optimal portfolios
              that offer the highest expected return for a given level of risk. Portfolios below the frontier
              are suboptimal as they don&apos;t provide enough return for their level of risk. Upload your
              portfolios via CSV to see how they compare to the theoretical optimal.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
