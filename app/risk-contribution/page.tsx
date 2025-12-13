'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { FileDown } from 'lucide-react';
import ParameterPanel from '@/components/risk-contribution/ParameterPanel';
import RiskContributionChart from '@/components/risk-contribution/RiskContributionChart';
import MetricsCards from '@/components/risk-contribution/MetricsCards';
import StressScenariosTable from '@/components/risk-contribution/StressScenariosTable';
import ReportBuilder from '@/components/risk-contribution/ReportBuilder';
import FactorExposureChart from '@/components/risk-contribution/FactorExposureChart';
import SegmentTrackingError from '@/components/risk-contribution/SegmentTrackingError';
import SecurityRiskChart from '@/components/risk-contribution/SecurityRiskChart';
import ActiveFactorExposureChart from '@/components/risk-contribution/ActiveFactorExposureChart';
import FactorBetaHeatmap from '@/components/risk-contribution/FactorBetaHeatmap';
import {
  PortfolioWeights,
  RiskContributionsResponse,
  DiversificationResponse,
  PerformanceStats,
  TrackingErrorResponse,
  FactorDecompositionResponse,
  StressScenarioResult,
  SAMPLE_RISK_PORTFOLIOS,
  STRESS_SCENARIOS,
} from '@/lib/risk-types';

export default function RiskContributionPage() {
  // State
  const [portfolio, setPortfolio] = useState<PortfolioWeights>(
    SAMPLE_RISK_PORTFOLIOS[0].weights
  );
  const [benchmark, setBenchmark] = useState<PortfolioWeights | null>(null);
  const [useEwma, setUseEwma] = useState(true);
  const [runStressScenarios, setRunStressScenarios] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRunTime, setLastRunTime] = useState<number | null>(null);

  // Results
  const [contributions, setContributions] = useState<RiskContributionsResponse | null>(null);
  const [diversification, setDiversification] = useState<DiversificationResponse | null>(null);
  const [perfStats, setPerfStats] = useState<PerformanceStats | null>(null);
  const [trackingError, setTrackingError] = useState<TrackingErrorResponse | null>(null);
  const [factorDecomp, setFactorDecomp] = useState<FactorDecompositionResponse | null>(null);
  const [segmentTE, setSegmentTE] = useState<{
    growth_te: number;
    stability_te: number;
    total_te: number;
    growth_contribution: number;
    stability_contribution: number;
    growth_allocation: number;
    stability_allocation: number;
  } | null>(null);
  const [stressResults, setStressResults] = useState<StressScenarioResult[]>([]);

  // Report modal
  const [isReportOpen, setIsReportOpen] = useState(false);

  const runAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      // Call full analysis endpoint
      const response = await fetch('/api/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'full-analysis',
          portfolio,
          use_ewma: useEwma,
          ewma_decay: 0.94,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      setContributions(result.data.contributions);
      setDiversification(result.data.diversification);
      setPerfStats(result.data.performance);

      // Fetch factor decomposition
      try {
        const factorResponse = await fetch('/api/risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: 'factor-decomposition',
            portfolio,
          }),
        });
        const factorResult = await factorResponse.json();
        if (factorResult.success) {
          setFactorDecomp(factorResult.data);
        }
      } catch {
        // Factor decomposition service unavailable - non-critical
      }

      // Fetch segment tracking error
      try {
        const segmentResponse = await fetch('/api/risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: 'segment-tracking-error',
            portfolio,
            growth_allocation: 0.60,
            stability_allocation: 0.40,
          }),
        });
        const segmentResult = await segmentResponse.json();
        if (segmentResult.success) {
          setSegmentTE(segmentResult.data);
        }
      } catch {
        // Segment TE service unavailable - non-critical
      }

      // If benchmark is set, calculate tracking error
      if (benchmark) {
        const teResponse = await fetch('/api/risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: 'tracking-error',
            portfolio,
            benchmark,
            use_ewma: useEwma,
          }),
        });

        const teResult = await teResponse.json();
        if (teResult.success) {
          setTrackingError(teResult.data);
        }
      } else {
        setTrackingError(null);
      }

      // Run stress scenarios if enabled
      if (runStressScenarios) {
        const scenariosPayload = STRESS_SCENARIOS.map(s => ({
          name: s.name,
          start: s.start,
          end: s.end,
        }));

        const stressResponse = await fetch('/api/stress?endpoint=apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portfolio,
            benchmark: benchmark || undefined,
            scenarios: scenariosPayload,
          }),
        });

        const stressResult = await stressResponse.json();
        if (stressResult.success && stressResult.data?.scenarios) {
          setStressResults(stressResult.data.scenarios);
        }
      } else {
        setStressResults([]);
      }

      const endTime = performance.now();
      setLastRunTime(endTime - startTime);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  }, [portfolio, benchmark, useEwma, runStressScenarios]);

  const assetCount = Object.keys(portfolio).length;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="flex h-[calc(100vh-122px)]">
        {/* Left Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ParameterPanel
            portfolio={portfolio}
            benchmark={benchmark}
            onPortfolioChange={setPortfolio}
            onBenchmarkChange={setBenchmark}
            onRunAnalysis={runAnalysis}
            isLoading={isLoading}
            useEwma={useEwma}
            onUseEwmaChange={setUseEwma}
            runStressScenarios={runStressScenarios}
            onRunStressScenariosChange={setRunStressScenarios}
          />
        </motion.div>

        {/* Main Content */}
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
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Assets</p>
                <p className="text-[18px] font-semibold text-[#010203]">{assetCount}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Covariance</p>
                <p className="text-[18px] font-semibold text-[#0B6D7B]">
                  {useEwma ? 'EWMA' : 'Historical'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Benchmark</p>
                <p className="text-[18px] font-semibold text-[#074269]">
                  {benchmark ? 'Yes' : 'None'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Status</p>
                <p className={`text-[18px] font-semibold ${contributions ? 'text-green-600' : 'text-gray-400'}`}>
                  {contributions ? 'Analyzed' : 'Pending'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {lastRunTime !== null && (
                <p className="text-[11px] text-[#757575]">
                  Computed in {lastRunTime.toFixed(0)}ms
                </p>
              )}
              {contributions && (
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#074269] text-white text-sm font-medium rounded-lg hover:bg-[#053252] transition-colors"
                >
                  <FileDown size={14} />
                  Export Report
                </button>
              )}
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6"
            >
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2 text-red-500">
                Make sure the Python API service is running on port 8001.
              </p>
            </motion.div>
          )}

          {/* Metrics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mb-6"
          >
            <MetricsCards
              contributions={contributions}
              diversification={diversification}
              performance={perfStats}
              trackingError={trackingError}
            />
          </motion.div>

          {/* Risk Contribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white rounded border border-[#e6e6e6] p-4 mb-6"
            style={{ height: '400px' }}
          >
            <h3
              className="text-[16px] font-light text-[#010203] mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Risk Contribution vs Weight
            </h3>
            <div style={{ height: 'calc(100% - 40px)' }}>
              <RiskContributionChart
                contributions={contributions}
                portfolio={portfolio}
              />
            </div>
          </motion.div>

          {/* Security Risk Contribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="bg-white rounded border border-[#e6e6e6] p-4 mb-6"
            style={{ height: '450px' }}
          >
            <h3
              className="text-[16px] font-light text-[#010203] mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Security Risk Contribution
            </h3>
            <div style={{ height: 'calc(100% - 40px)' }}>
              <SecurityRiskChart
                contributions={contributions}
                portfolio={portfolio}
                topN={15}
              />
            </div>
          </motion.div>

          {/* Factor Exposure & Segment TE Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Factor Decomposition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="bg-white rounded border border-[#e6e6e6] p-4"
              style={{ minHeight: '380px' }}
            >
              <h3
                className="text-[16px] font-light text-[#010203] mb-4"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Factor Decomposition
              </h3>
              <FactorExposureChart data={factorDecomp} isLoading={isLoading && !factorDecomp} />
            </motion.div>

            {/* Active Factor Exposures */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="bg-white rounded border border-[#e6e6e6] p-4"
              style={{ minHeight: '380px' }}
            >
              <h3
                className="text-[16px] font-light text-[#010203] mb-4"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Active Factor Exposures
              </h3>
              <ActiveFactorExposureChart data={factorDecomp} />
            </motion.div>
          </div>

          {/* Factor Beta Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.45 }}
            className="bg-white rounded border border-[#e6e6e6] p-4 mb-6"
            style={{ minHeight: '280px' }}
          >
            <h3
              className="text-[16px] font-light text-[#010203] mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Factor Beta Heatmap
            </h3>
            <FactorBetaHeatmap data={factorDecomp} isLoading={isLoading && !factorDecomp} />
          </motion.div>

          {/* Segment TE Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="bg-white rounded border border-[#e6e6e6] p-4 mb-6"
            style={{ minHeight: '320px' }}
          >
            <h3
              className="text-[16px] font-light text-[#010203] mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Segment Tracking Error
            </h3>
            <SegmentTrackingError data={segmentTE} isLoading={isLoading && !segmentTE} />
          </motion.div>

          {/* Stress Scenarios Table */}
          {runStressScenarios && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mb-6"
            >
              <StressScenariosTable
                results={stressResults}
                isLoading={isLoading && stressResults.length === 0}
              />
            </motion.div>
          )}

          {/* Info Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="p-4 bg-[#074269]/5 rounded-lg"
          >
            <p className="text-[12px] text-[#074269]">
              <strong>About Risk Contribution:</strong> PCTR (Percentage Contribution to Risk) shows how much
              each asset contributes to total portfolio risk. An asset with high PCTR relative to its weight
              is a risk concentrator. The diversification ratio measures how much risk is reduced through
              diversification - values above 1.0 indicate benefit from combining assets.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Report Builder Modal */}
      <ReportBuilder
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        contributions={contributions}
        diversification={diversification}
        performance={perfStats}
        stressResults={stressResults}
        portfolioName="Balanced"
      />
    </div>
  );
}
