'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import ParameterPanel from '@/components/portfolio-evaluation/ParameterPanel';
import EfficientFrontierChart from '@/components/portfolio-evaluation/EfficientFrontierChart';
import PortfolioTable from '@/components/portfolio-evaluation/PortfolioTable';
import MetricsSummary from '@/components/portfolio-evaluation/MetricsSummary';
import AdvancedOptimizationPanel from '@/components/portfolio-evaluation/AdvancedOptimizationPanel';
import BenchmarkComparison from '@/components/portfolio-evaluation/BenchmarkComparison';
import OptimizationResults from '@/components/portfolio-evaluation/OptimizationResults';
import IbbotsonConeChart from '@/components/portfolio-evaluation/IbbotsonConeChart';
import HistoricalMetricsPanel from '@/components/portfolio-evaluation/HistoricalMetricsPanel';
import GrowthProjectionChart from '@/components/portfolio-evaluation/GrowthProjectionChart';
import CorrelationMatrixHeatmap from '@/components/shared/CorrelationMatrixHeatmap';
import {
  generateEfficientFrontier,
  generateResampledPortfolios,
  calculatePortfoliosWithMetrics,
  ExtendedOptimizationParams,
} from '@/lib/optimization';
import { ASSET_CLASSES, CORRELATION_MATRIX, getAssetsByMode } from '@/lib/cma-data';
import { downloadPortfolioExcel } from '@/lib/exports';
import type {
  FrontierPoint,
  PortfolioHoldings,
  PortfolioWithMetrics,
} from '@/lib/portfolio-types';
import type { OptimalPortfolioResponse, FrontierResponse } from '@/lib/optimization-api-types';

const DEFAULT_PARAMS: ExtendedOptimizationParams = {
  mode: 'core',
  capsTemplate: 'standard',
  numPoints: 30,
  customAssets: undefined,
  enableBucketConstraints: false,
  bucketConstraints: undefined,
};

export default function PortfolioEvaluationPage() {
  const [params, setParams] = useState<ExtendedOptimizationParams>(DEFAULT_PARAMS);
  const [frontier, setFrontier] = useState<FrontierPoint[]>([]);
  const [resampledPortfolios, setResampledPortfolios] = useState<Array<{ risk: number; return: number }>>([]);
  const [uploadedPortfolios, setUploadedPortfolios] = useState<PortfolioHoldings[]>([]);
  const [portfoliosWithMetrics, setPortfoliosWithMetrics] = useState<PortfolioWithMetrics[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isResampling, setIsResampling] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<number | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimalPortfolioResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'frontier' | 'optimize'>('frontier');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [efficientFrontierData, _setEfficientFrontierData] = useState<FrontierResponse | null>(null);
  const [selectedPortfolioForCone, setSelectedPortfolioForCone] = useState<string>('');
  const [initialInvestment, setInitialInvestment] = useState<number>(100000);
  const [showBenchmarkCone, setShowBenchmarkCone] = useState<boolean>(false);

  const handleRunOptimization = useCallback(() => {
    setIsRunning(true);
    setResampledPortfolios([]); // Clear resampled when re-running

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

  const handleResample = useCallback(() => {
    if (frontier.length === 0) return;

    setIsResampling(true);

    setTimeout(() => {
      const resampled = generateResampledPortfolios(params, 50, 0.015);
      setResampledPortfolios(resampled);
      setIsResampling(false);
    }, 50);
  }, [params, frontier.length]);

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
            onResample={handleResample}
            onPortfoliosLoaded={handlePortfoliosLoaded}
            isRunning={isRunning}
            isResampling={isResampling}
            hasFrontier={frontier.length > 0}
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
            className="bg-white rounded border border-[#e6e6e6] p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-8">
                <div>
                  <p className="text-[11px] text-[#757575] uppercase tracking-wide">Asset Universe</p>
                  <p className="text-[18px] font-semibold text-[#010203]">
                    {params.customAssets && params.customAssets.length >= 2
                      ? 'Custom'
                      : params.mode === 'core'
                      ? 'Core'
                      : params.mode === 'core_private'
                      ? 'Core + Private'
                      : 'Unconstrained'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#757575] uppercase tracking-wide">Assets</p>
                  <p className="text-[18px] font-semibold text-[#0B6D7B]">
                    {params.customAssets && params.customAssets.length >= 2
                      ? params.customAssets.length
                      : currentAssets.length}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#757575] uppercase tracking-wide">Constraints</p>
                  <p className="text-[18px] font-semibold text-[#074269]">
                    {params.enableBucketConstraints
                      ? 'Bucket'
                      : params.capsTemplate.charAt(0).toUpperCase() + params.capsTemplate.slice(1)}
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
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-t border-gray-200 pt-3">
              <button
                onClick={() => setActiveTab('frontier')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'frontier'
                    ? 'bg-[#00f0db] text-[#010203]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Efficient Frontier
              </button>
              <button
                onClick={() => setActiveTab('optimize')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'optimize'
                    ? 'bg-[#00f0db] text-[#010203]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Python API Optimization
              </button>
            </div>
          </motion.div>

          {/* Content Tabs */}
          {activeTab === 'frontier' && (
            <>
              {/* Main Chart - Efficient Frontier */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white rounded border border-[#e6e6e6] p-4 mb-6"
                style={{ height: '500px' }}
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
                    resampledPortfolios={resampledPortfolios}
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
                      frontier={frontier}
                      inefficiencyThreshold={0.03}
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

              {/* Growth Projection Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.45 }}
                className="bg-white rounded border border-[#e6e6e6] p-4 mt-6"
                style={{ height: '500px' }}
              >
                <h3
                  className="text-[16px] font-light text-[#010203] mb-4"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Cumulative Growth Projection
                </h3>
                <div style={{ height: 'calc(100% - 40px)' }}>
                  <GrowthProjectionChart
                    portfolios={portfoliosWithMetrics}
                    initialInvestment={initialInvestment}
                    years={30}
                  />
                </div>
              </motion.div>

              {/* Historical Metrics Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.48 }}
                className="bg-white rounded border border-[#e6e6e6] p-4 mt-6"
                style={{ minHeight: '300px' }}
              >
                <h3
                  className="text-[16px] font-light text-[#010203] mb-4"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Historical Performance Metrics
                </h3>
                <HistoricalMetricsPanel portfolios={portfoliosWithMetrics} />
              </motion.div>

              {/* Correlation Matrix Heatmap */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.49 }}
                className="bg-white rounded border border-[#e6e6e6] p-4 mt-6"
                style={{ minHeight: '400px' }}
              >
                <h3
                  className="text-[16px] font-light text-[#010203] mb-4"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Asset Correlation Matrix
                </h3>
                <CorrelationMatrixHeatmap
                  correlationMatrix={CORRELATION_MATRIX}
                  assetNames={currentAssets.map(a => a.name)}
                  compactMode={currentAssets.length > 10}
                />
              </motion.div>

              {/* Ibbotson Cone Projection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="bg-white rounded border border-[#e6e6e6] p-4 mt-6"
                style={{ height: '500px' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-[16px] font-light text-[#010203]"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    Ibbotson Cone Projection
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Initial Investment:</label>
                      <input
                        type="number"
                        value={initialInvestment}
                        onChange={(e) => setInitialInvestment(Number(e.target.value))}
                        className="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                        min={1000}
                        step={1000}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Portfolio:</label>
                      <select
                        value={selectedPortfolioForCone}
                        onChange={(e) => setSelectedPortfolioForCone(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm bg-white"
                      >
                        <option value="">Select portfolio...</option>
                        {portfoliosWithMetrics.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showBenchmarkCone}
                        onChange={(e) => setShowBenchmarkCone(e.target.checked)}
                        className="rounded"
                      />
                      Include Benchmark Cone
                    </label>
                  </div>
                </div>
                <div style={{ height: 'calc(100% - 60px)' }}>
                  <IbbotsonConeChart
                    selectedPortfolio={portfoliosWithMetrics.find(p => p.name === selectedPortfolioForCone)}
                    benchmarkReturn={0.07}
                    benchmarkRisk={0.12}
                    initialInvestment={initialInvestment}
                    showBenchmarkCone={showBenchmarkCone}
                  />
                </div>
              </motion.div>
            </>
          )}

          {activeTab === 'optimize' && (
            <>
              {/* Python API Optimization Layout */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Advanced Optimization Panel */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-white rounded border border-[#e6e6e6] p-4"
                  style={{ height: '500px' }}
                >
                  <AdvancedOptimizationPanel
                    mode={params.mode}
                    capsTemplate={params.capsTemplate}
                    onResultsReady={setOptimizationResult}
                  />
                </motion.div>

                {/* Benchmark Comparison */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-white rounded border border-[#e6e6e6] p-4"
                  style={{ height: '500px' }}
                >
                  <h3
                    className="text-[16px] font-light text-[#010203] mb-4"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    Benchmark Comparison
                  </h3>
                  <div style={{ height: 'calc(100% - 40px)' }}>
                    <BenchmarkComparison
                      portfolioRisk={optimizationResult?.risk}
                      portfolioReturn={optimizationResult?.expected_return}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Optimization Results */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-white rounded border border-[#e6e6e6] p-4"
                style={{ height: '400px' }}
              >
                <h3
                  className="text-[16px] font-light text-[#010203] mb-4"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Optimization Results
                </h3>
                <div style={{ height: 'calc(100% - 40px)' }}>
                  <OptimizationResults
                    result={optimizationResult}
                    currentWeights={portfoliosWithMetrics[0]?.allocations}
                    onExport={() => {
                      if (optimizationResult) {
                        downloadPortfolioExcel(
                          {
                            optimizationResult,
                            currentWeights: portfoliosWithMetrics[0]?.allocations,
                            efficientFrontier: efficientFrontierData || undefined,
                            reportDate: new Date().toLocaleDateString('en-US'),
                            mode: params.mode,
                            capsTemplate: params.capsTemplate,
                          },
                          `portfolio-optimization-${new Date().toISOString().split('T')[0]}.xlsx`
                        );
                      }
                    }}
                  />
                </div>
              </motion.div>
            </>
          )}

          {/* Info Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-6 p-4 bg-[#074269]/5 rounded-lg"
          >
            {activeTab === 'frontier' ? (
              <p className="text-[12px] text-[#074269]">
                <strong>About this tool:</strong> The efficient frontier represents the set of optimal portfolios
                that offer the highest expected return for a given level of risk. Portfolios below the frontier
                are suboptimal as they don&apos;t provide enough return for their level of risk. The Ibbotson Cone
                shows projected portfolio value ranges using log-normal growth model with confidence bands at
                5th-95th (outer) and 25th-75th (inner) percentiles over multiple time horizons.
              </p>
            ) : (
              <p className="text-[12px] text-[#074269]">
                <strong>Python API Optimization:</strong> Uses the FastAPI optimization service (port 8001) for
                advanced portfolio optimization with quadratic programming. Set target return or risk constraints,
                or optimize for maximum Sharpe ratio. Compare results against blended benchmarks and export
                optimal allocations.
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
