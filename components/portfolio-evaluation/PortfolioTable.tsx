'use client';

import { Fragment } from 'react';
import { PortfolioWithMetrics, AssetClass, RiskAllocation } from '@/lib/portfolio-types';
import { formatPercent } from '@/lib/optimization';

interface PortfolioTableProps {
  portfolios: PortfolioWithMetrics[];
  assets: AssetClass[];
}

const BUCKET_ORDER: RiskAllocation[] = ['STABILITY', 'DIVERSIFIED', 'GROWTH'];

const BUCKET_COLORS: Record<RiskAllocation, string> = {
  STABILITY: '#10B981',
  DIVERSIFIED: '#F59E0B',
  GROWTH: '#EF4444',
};

export default function PortfolioTable({ portfolios, assets }: PortfolioTableProps) {
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
                    return (
                      <td key={`${asset.name}-${pIdx}`} className="text-right p-2 font-mono text-gray-600">
                        {weight > 0.001 ? formatPercent(weight) : '-'}
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
        </tbody>
      </table>
    </div>
  );
}
