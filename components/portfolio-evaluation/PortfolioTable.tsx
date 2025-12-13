'use client';

import { Fragment, useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { PortfolioWithMetrics, AssetClass, RiskAllocation, FrontierPoint } from '@/lib/portfolio-types';
import { formatPercent } from '@/lib/optimization';

interface PortfolioTableProps {
  portfolios: PortfolioWithMetrics[];
  assets: AssetClass[];
  frontier?: FrontierPoint[];
  inefficiencyThreshold?: number; // Default 0.03 (3%)
}

const BUCKET_ORDER: RiskAllocation[] = ['STABILITY', 'DIVERSIFIED', 'GROWTH'];

const BUCKET_COLORS: Record<RiskAllocation, string> = {
  STABILITY: '#10B981',
  DIVERSIFIED: '#F59E0B',
  GROWTH: '#EF4444',
};

// Find closest frontier point by risk level
function findClosestFrontierPoint(
  risk: number,
  frontier: FrontierPoint[]
): FrontierPoint | null {
  if (frontier.length === 0) return null;
  let closest = frontier[0];
  let minDiff = Math.abs(frontier[0].risk - risk);
  for (const point of frontier) {
    const diff = Math.abs(point.risk - risk);
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }
  return closest;
}

// Inefficiency detection result
interface InefficiencyFlag {
  type: 'overweight' | 'underweight' | 'suboptimal';
  delta: number;
  message: string;
}

export default function PortfolioTable({
  portfolios,
  assets,
  frontier = [],
  inefficiencyThreshold = 0.03,
}: PortfolioTableProps) {
  // Calculate inefficiency flags for each portfolio/asset combination
  const inefficiencyFlags = useMemo(() => {
    const flags: Record<string, Record<string, InefficiencyFlag | null>> = {};

    portfolios.forEach(portfolio => {
      flags[portfolio.name] = {};

      // Find closest frontier point to this portfolio's risk level
      const closestOptimal = findClosestFrontierPoint(portfolio.metrics.risk, frontier);

      assets.forEach(asset => {
        const currentWeight = portfolio.allocations[asset.name] || 0;
        const optimalWeight = closestOptimal?.allocations[asset.name] || 0;
        const delta = currentWeight - optimalWeight;

        // Only flag if there's a significant difference and the portfolio has this asset
        if (Math.abs(delta) >= inefficiencyThreshold && (currentWeight > 0.001 || optimalWeight > 0.001)) {
          if (delta > 0) {
            flags[portfolio.name][asset.name] = {
              type: 'overweight',
              delta,
              message: `Overweight by ${formatPercent(delta)} vs optimal`,
            };
          } else {
            flags[portfolio.name][asset.name] = {
              type: 'underweight',
              delta,
              message: `Underweight by ${formatPercent(Math.abs(delta))} vs optimal`,
            };
          }
        } else {
          flags[portfolio.name][asset.name] = null;
        }
      });
    });

    return flags;
  }, [portfolios, assets, frontier, inefficiencyThreshold]);

  // Count total flags per portfolio
  const flagCounts = useMemo(() => {
    const counts: Record<string, { overweight: number; underweight: number }> = {};
    portfolios.forEach(p => {
      counts[p.name] = { overweight: 0, underweight: 0 };
      Object.values(inefficiencyFlags[p.name] || {}).forEach(flag => {
        if (flag?.type === 'overweight') counts[p.name].overweight++;
        if (flag?.type === 'underweight') counts[p.name].underweight++;
      });
    });
    return counts;
  }, [portfolios, inefficiencyFlags]);

  if (portfolios.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-400">Upload portfolios to see holdings breakdown</p>
      </div>
    );
  }

  // Group assets by risk allocation
  const assetsByBucket = BUCKET_ORDER.map(bucket => ({
    bucket,
    assets: assets.filter(a => a.riskAllocation === bucket),
  }));

  // Calculate totals for each portfolio and bucket
  const getBucketTotal = (portfolio: PortfolioWithMetrics, bucket: RiskAllocation) => {
    return assets
      .filter(a => a.riskAllocation === bucket)
      .reduce((sum, a) => sum + (portfolio.allocations[a.name] || 0), 0);
  };

  const getPortfolioTotal = (portfolio: PortfolioWithMetrics) => {
    return Object.values(portfolio.allocations).reduce((sum, v) => sum + v, 0);
  };

  const hasFrontier = frontier.length > 0;

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="text-left p-2 font-medium text-gray-600 border-b">Asset Class</th>
            {portfolios.map((p, idx) => (
              <th key={`header-${idx}`} className="text-right p-2 font-medium text-gray-600 border-b min-w-[80px]">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assetsByBucket.map(({ bucket, assets: bucketAssets }) => (
            <Fragment key={bucket}>
              {/* Bucket Header */}
              <tr className="bg-gray-100">
                <td
                  colSpan={portfolios.length + 1}
                  className="p-2 font-semibold text-xs uppercase tracking-wider"
                  style={{ color: BUCKET_COLORS[bucket] }}
                >
                  {bucket}
                </td>
              </tr>

              {/* Asset Rows */}
              {bucketAssets.map(asset => (
                <tr key={`${bucket}-${asset.name}`} className="hover:bg-gray-50 border-b border-gray-100">
                  <td className="p-2 text-gray-700">{asset.name}</td>
                  {portfolios.map((p, pIdx) => {
                    const weight = p.allocations[asset.name] || 0;
                    const flag = hasFrontier ? inefficiencyFlags[p.name]?.[asset.name] : null;
                    return (
                      <td
                        key={`${asset.name}-${pIdx}`}
                        className={`text-right p-2 font-mono relative group ${
                          flag?.type === 'overweight'
                            ? 'text-red-600 bg-red-50'
                            : flag?.type === 'underweight'
                            ? 'text-amber-600 bg-amber-50'
                            : 'text-gray-600'
                        }`}
                      >
                        <span className="flex items-center justify-end gap-1">
                          {weight > 0.001 ? formatPercent(weight) : '-'}
                          {flag && (
                            <span className="inline-flex">
                              {flag.type === 'overweight' ? (
                                <TrendingUp size={12} className="text-red-500" />
                              ) : (
                                <TrendingDown size={12} className="text-amber-500" />
                              )}
                            </span>
                          )}
                        </span>
                        {/* Tooltip */}
                        {flag && (
                          <div className="absolute z-10 hidden group-hover:block right-0 top-full mt-1 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap">
                            {flag.message}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Bucket Subtotal */}
              <tr className="border-b border-gray-200">
                <td className="p-2 text-gray-500 italic text-xs">{bucket} Total</td>
                {portfolios.map((p, pIdx) => (
                  <td key={`subtotal-${bucket}-${pIdx}`} className="text-right p-2 font-mono text-gray-500 text-xs">
                    {formatPercent(getBucketTotal(p, bucket))}
                  </td>
                ))}
              </tr>
            </Fragment>
          ))}

          {/* Grand Total */}
          <tr className="bg-gray-50 font-semibold">
            <td className="p-2 text-gray-800">TOTAL</td>
            {portfolios.map((p, pIdx) => (
              <td key={`total-${pIdx}`} className="text-right p-2 font-mono text-gray-800">
                {formatPercent(getPortfolioTotal(p))}
              </td>
            ))}
          </tr>

          {/* Inefficiency Summary Row - only show if frontier available */}
          {hasFrontier && (
            <tr className="bg-gray-100 border-t-2 border-gray-300">
              <td className="p-2 text-gray-600 text-xs flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-500" />
                Inefficiency Flags
              </td>
              {portfolios.map((p, pIdx) => {
                const counts = flagCounts[p.name];
                const total = counts.overweight + counts.underweight;
                return (
                  <td key={`flags-${pIdx}`} className="text-right p-2 text-xs">
                    {total > 0 ? (
                      <span className="flex items-center justify-end gap-2">
                        {counts.overweight > 0 && (
                          <span className="flex items-center gap-0.5 text-red-600">
                            <TrendingUp size={10} />
                            {counts.overweight}
                          </span>
                        )}
                        {counts.underweight > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-600">
                            <TrendingDown size={10} />
                            {counts.underweight}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-green-600">✓</span>
                    )}
                  </td>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
