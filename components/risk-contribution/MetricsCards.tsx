'use client';

import {
  RiskContributionsResponse,
  DiversificationResponse,
  PerformanceStats,
  TrackingErrorResponse,
} from '@/lib/risk-types';

interface MetricsCardsProps {
  contributions: RiskContributionsResponse | null;
  diversification: DiversificationResponse | null;
  performance: PerformanceStats | null;
  trackingError: TrackingErrorResponse | null;
}

function MetricCard({
  label,
  value,
  subtitle,
  color = '#074269',
}: {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function MetricsCards({
  contributions,
  diversification,
  performance,
  trackingError,
}: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Portfolio Volatility */}
      <MetricCard
        label="Portfolio Volatility"
        value={contributions ? `${(contributions.portfolio_vol_annualized * 100).toFixed(1)}%` : '—'}
        subtitle="Annualized"
        color="#074269"
      />

      {/* Diversification Ratio */}
      <MetricCard
        label="Diversification Ratio"
        value={diversification ? diversification.diversification_ratio.toFixed(2) : '—'}
        subtitle={diversification ? `${diversification.diversification_benefit_pct.toFixed(0)}% benefit` : undefined}
        color="#0B6D7B"
      />

      {/* Sharpe Ratio */}
      <MetricCard
        label="Sharpe Ratio"
        value={performance ? performance.sharpe.toFixed(2) : '—'}
        subtitle="Risk-adjusted return"
        color="#00E7D7"
      />

      {/* Tracking Error */}
      <MetricCard
        label="Tracking Error"
        value={trackingError ? `${(trackingError.tracking_error * 100).toFixed(1)}%` : '—'}
        subtitle="vs Benchmark (Ann.)"
        color="#821A8B"
      />

      {/* CAGR */}
      <MetricCard
        label="CAGR"
        value={performance ? `${(performance.cagr * 100).toFixed(1)}%` : '—'}
        subtitle="Compound Annual Growth"
      />

      {/* Max Drawdown */}
      <MetricCard
        label="Max Drawdown"
        value={performance ? `${(performance.max_drawdown * 100).toFixed(1)}%` : '—'}
        subtitle="Peak to trough"
        color="#EF4444"
      />

      {/* Avg Correlation */}
      <MetricCard
        label="Avg Correlation"
        value={diversification ? diversification.weighted_avg_correlation.toFixed(2) : '—'}
        subtitle="Weighted pairwise"
      />

      {/* Total Return */}
      <MetricCard
        label="Total Return"
        value={performance ? `${(performance.total_return * 100).toFixed(1)}%` : '—'}
        subtitle="Cumulative"
        color={performance && performance.total_return >= 0 ? '#10B981' : '#EF4444'}
      />
    </div>
  );
}
