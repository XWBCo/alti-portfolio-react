'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { PortfolioWithMetrics } from '@/lib/portfolio-types';
import {
  calculateHistoricalMetrics,
  generateSimulatedReturns,
  HistoricalMetrics,
} from '@/lib/historical-metrics';
import { formatPercent } from '@/lib/optimization';

interface HistoricalMetricsPanelProps {
  portfolios: PortfolioWithMetrics[];
}

function MetricCard({
  label,
  value,
  format = 'percent',
  goodDirection = 'up',
  benchmark,
}: {
  label: string;
  value: number | null;
  format?: 'percent' | 'ratio';
  goodDirection?: 'up' | 'down';
  benchmark?: number;
}) {
  if (value === null) {
    return (
      <div className="p-3 bg-gray-50 rounded">
        <p className="text-[11px] text-gray-500 mb-1">{label}</p>
        <p className="text-[14px] text-gray-400">N/A</p>
      </div>
    );
  }

  const formattedValue = format === 'percent' ? formatPercent(value) : value.toFixed(2);
  const isGood = goodDirection === 'up' ? value > 0 : value < (benchmark || 0);

  return (
    <div className="p-3 bg-gray-50 rounded">
      <p className="text-[11px] text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-1">
        <p className={`text-[14px] font-semibold ${isGood ? 'text-emerald-600' : 'text-gray-800'}`}>
          {formattedValue}
        </p>
        {benchmark !== undefined && (
          <span className="text-[10px] text-gray-400">
            (vs {format === 'percent' ? formatPercent(benchmark) : benchmark.toFixed(2)})
          </span>
        )}
      </div>
    </div>
  );
}

export default function HistoricalMetricsPanel({ portfolios }: HistoricalMetricsPanelProps) {
  // Calculate historical metrics for each portfolio
  const portfolioMetrics = useMemo(() => {
    return portfolios.map((portfolio) => {
      // Generate simulated returns based on portfolio's expected return/risk
      // In production, this would use actual historical return series
      const simulatedReturns = generateSimulatedReturns(
        portfolio.metrics.expectedReturn,
        portfolio.metrics.risk,
        60 // 5 years of monthly data
      );

      // Generate benchmark returns (60/40 proxy)
      const benchmarkReturns = generateSimulatedReturns(0.06, 0.10, 60);

      const metrics = calculateHistoricalMetrics(simulatedReturns, benchmarkReturns);

      return {
        name: portfolio.name,
        metrics,
      };
    });
  }, [portfolios]);

  if (portfolios.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <Info size={24} className="mb-2" />
        <p className="text-sm">Load portfolios to view historical metrics</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {/* Info Banner */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-amber-700">
          Metrics are based on simulated returns using portfolio expected return and risk.
          In production, actual historical return series would be used.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-4">
        {portfolioMetrics.map(({ name, metrics }) => (
          <div key={name} className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-[13px] font-semibold text-gray-800 mb-3">{name}</h4>
            <div className="grid grid-cols-3 gap-2">
              <MetricCard
                label="Ann. Return"
                value={metrics.annualizedReturn}
                format="percent"
                goodDirection="up"
              />
              <MetricCard
                label="Ann. Volatility"
                value={metrics.annualizedVolatility}
                format="percent"
                goodDirection="down"
              />
              <MetricCard
                label="Sharpe Ratio"
                value={metrics.sharpeRatio}
                format="ratio"
                goodDirection="up"
              />
              <MetricCard
                label="Max Drawdown"
                value={metrics.maxDrawdown}
                format="percent"
                goodDirection="down"
              />
              <MetricCard
                label="Calmar Ratio"
                value={metrics.calmarRatio}
                format="ratio"
                goodDirection="up"
              />
              <MetricCard
                label="Sortino Ratio"
                value={metrics.sortinoRatio}
                format="ratio"
                goodDirection="up"
              />
              <MetricCard
                label="Info Ratio"
                value={metrics.informationRatio}
                format="ratio"
                goodDirection="up"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
