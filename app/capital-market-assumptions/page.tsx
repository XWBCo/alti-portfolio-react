'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import ParameterPanel from '@/components/capital-market-assumptions/ParameterPanel';
import CMATable from '@/components/capital-market-assumptions/CMATable';
import RiskReturnScatter from '@/components/capital-market-assumptions/RiskReturnScatter';
import { CMA_ASSETS, countByPurpose } from '@/lib/cma-mock-data';
import {
  SCENARIO_ADJUSTMENTS,
  CURRENCY_ADJUSTMENTS,
  PURPOSE_COLORS,
} from '@/lib/cma-types';
import type { CMAParams, CMAAsset } from '@/lib/cma-types';

const DEFAULT_PARAMS: CMAParams = {
  currency: 'USD',
  scenario: 'Base Case',
};

export default function CapitalMarketAssumptionsPage() {
  const [params, setParams] = useState<CMAParams>(DEFAULT_PARAMS);

  // Apply currency and scenario adjustments to data
  const adjustedData = useMemo<CMAAsset[]>(() => {
    const currencyAdj = CURRENCY_ADJUSTMENTS[params.currency];
    const scenarioAdj = SCENARIO_ADJUSTMENTS[params.scenario];

    return CMA_ASSETS.map((asset) => ({
      ...asset,
      forecastReturn:
        (asset.forecastReturn + currencyAdj) * scenarioAdj.returnMultiplier,
      forecastVolatility:
        asset.forecastVolatility * scenarioAdj.volatilityMultiplier,
    }));
  }, [params.currency, params.scenario]);

  // Download handlers
  const handleDownloadExcel = useCallback(() => {
    // Create CSV content (Excel-compatible)
    const headers = ['Purpose', 'Group', 'Asset Class', 'Forecast Return (%)', 'Forecast Volatility (%)'];
    const rows = adjustedData.map((a) => [
      a.purpose,
      a.group,
      a.assetClass,
      (a.forecastReturn * 100).toFixed(2),
      (a.forecastVolatility * 100).toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CMA_${params.currency}_${params.scenario.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [adjustedData, params]);

  const handleDownloadCSV = useCallback(() => {
    // Download raw return series (placeholder - same format as CMA for now)
    const headers = ['Asset Class', 'Forecast Return', 'Forecast Volatility'];
    const rows = CMA_ASSETS.map((a) => [
      a.assetClass,
      a.forecastReturn.toFixed(4),
      a.forecastVolatility.toFixed(4),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'return_series.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const counts = countByPurpose();

  // Calculate min/max returns and volatility for stats
  const stats = useMemo(() => {
    const returns = adjustedData.map((a) => a.forecastReturn * 100);
    const vols = adjustedData.map((a) => a.forecastVolatility * 100);
    return {
      minReturn: Math.min(...returns).toFixed(2),
      maxReturn: Math.max(...returns).toFixed(2),
      minVol: Math.min(...vols).toFixed(2),
      maxVol: Math.max(...vols).toFixed(2),
    };
  }, [adjustedData]);

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
            onDownloadExcel={handleDownloadExcel}
            onDownloadCSV={handleDownloadCSV}
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
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Currency</p>
                <p className="text-[18px] font-semibold text-[#074269]">
                  {params.currency}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Scenario</p>
                <p className="text-[18px] font-semibold text-[#010203]">
                  {params.scenario}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Asset Classes</p>
                <p className="text-[18px] font-semibold text-[#0B6D7B]">
                  {adjustedData.length}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Return Range</p>
                <p className="text-[18px] font-semibold text-[#010203]">
                  {stats.minReturn}% – {stats.maxReturn}%
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#757575] uppercase tracking-wide">Vol Range</p>
                <p className="text-[18px] font-semibold text-[#010203]">
                  {stats.minVol}% – {stats.maxVol}%
                </p>
              </div>
            </div>
            {/* Purpose Legend */}
            <div className="flex gap-4">
              {(['Stability', 'Diversified', 'Growth'] as const).map((purpose) => (
                <div key={purpose} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PURPOSE_COLORS[purpose] }}
                  />
                  <span className="text-[12px] text-[#4A4A4A]">
                    {purpose} ({counts[purpose]})
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Info Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mb-4"
          >
            <ul className="text-[14px] text-[#4A4A4A] list-disc list-inside space-y-1">
              <li>Forecasts shown in real terms with 10-year median horizon.</li>
              <li>Scenario and currency options adjust output dynamically.</li>
              <li>Returns shown in %, grouped by investment purpose.</li>
            </ul>
          </motion.div>

          {/* CMA Data Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded border border-[#e6e6e6] p-4 mb-6"
            style={{ height: '380px' }}
          >
            <h3
              className="text-[16px] font-light text-[#010203] mb-3"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Capital Market Assumptions Table
            </h3>
            <div style={{ height: 'calc(100% - 32px)' }}>
              <CMATable data={adjustedData} />
            </div>
          </motion.div>

          {/* Risk vs Return Scatter Plot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white rounded border border-[#e6e6e6] p-4"
            style={{ height: '500px' }}
          >
            <h3
              className="text-[16px] font-light text-[#010203] mb-3"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Risk vs Return Scatter Plot
            </h3>
            <div style={{ height: 'calc(100% - 32px)' }}>
              <RiskReturnScatter data={adjustedData} />
            </div>
          </motion.div>

          {/* Info Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="mt-6 p-4 bg-[#074269]/5 rounded-lg"
          >
            <p className="text-[12px] text-[#074269]">
              <strong>About this tool:</strong> Capital Market Assumptions (CMAs) provide
              long-term forecasts for expected returns and volatilities across asset classes.
              These projections incorporate economic outlook scenarios and currency adjustments
              to support strategic asset allocation decisions. Data is based on AlTi&apos;s
              2025 CMA research with a 10-year investment horizon.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
