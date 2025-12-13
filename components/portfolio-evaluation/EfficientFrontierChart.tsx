'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { FrontierPoint, PortfolioWithMetrics } from '@/lib/portfolio-types';
import { formatPercent } from '@/lib/optimization';

interface ResampledPoint {
  risk: number;
  return: number;
}

interface EfficientFrontierChartProps {
  frontier: FrontierPoint[];
  portfolios: PortfolioWithMetrics[];
  resampledPortfolios?: ResampledPoint[];
}

const CHART_COLORS = {
  frontier: '#074269',
  portfolio1: '#00E7D7',
  portfolio2: '#0F94A6',
  portfolio3: '#0A598C',
  portfolio4: '#8EFFF7',
  portfolio5: '#86E7F4',
  portfolio6: '#78C4F5',
};

const PORTFOLIO_COLORS = [
  CHART_COLORS.portfolio1,
  CHART_COLORS.portfolio2,
  CHART_COLORS.portfolio3,
  CHART_COLORS.portfolio4,
  CHART_COLORS.portfolio5,
  CHART_COLORS.portfolio6,
];

interface TooltipPayload {
  payload: {
    risk: number;
    return: number;
    name?: string;
    allocations?: Record<string, number>;
  };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const isPortfolio = !!data.name;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
      {isPortfolio && (
        <p className="font-semibold text-gray-800 mb-1">{data.name}</p>
      )}
      <div className="text-sm space-y-1">
        <p className="text-gray-600">
          Risk: <span className="font-medium text-gray-800">{formatPercent(data.risk)}</span>
        </p>
        <p className="text-gray-600">
          Return: <span className="font-medium text-gray-800">{formatPercent(data.return)}</span>
        </p>
      </div>
      {data.allocations && Object.keys(data.allocations).length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">Top Holdings:</p>
          <div className="text-xs text-gray-600 space-y-0.5">
            {Object.entries(data.allocations)
              .filter(([_, v]) => v > 0.01)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([asset, weight]) => (
                <div key={asset} className="flex justify-between">
                  <span className="truncate mr-2">{asset}</span>
                  <span className="font-medium">{formatPercent(weight)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EfficientFrontierChart({
  frontier,
  portfolios,
  resampledPortfolios = [],
}: EfficientFrontierChartProps) {
  // Prepare frontier data
  const frontierData = frontier.map(point => ({
    risk: point.risk,
    return: point.return,
    allocations: point.allocations,
  }));

  // Prepare portfolio data with colors
  const portfolioData = portfolios.map((p, i) => ({
    risk: p.metrics.risk,
    return: p.metrics.expectedReturn,
    name: p.name,
    allocations: p.allocations,
    color: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length],
  }));

  // Prepare resampled data
  const resampledData = resampledPortfolios.map(p => ({
    risk: p.risk,
    return: p.return,
  }));

  // Calculate axis domains
  const allRisks = [
    ...frontierData.map(d => d.risk),
    ...portfolioData.map(d => d.risk),
    ...resampledData.map(d => d.risk),
  ];
  const allReturns = [
    ...frontierData.map(d => d.return),
    ...portfolioData.map(d => d.return),
    ...resampledData.map(d => d.return),
  ];

  const minRisk = Math.max(0, Math.min(...allRisks) - 0.01);
  const maxRisk = Math.max(...allRisks) + 0.01;
  const minReturn = Math.max(0, Math.min(...allReturns) - 0.005);
  const maxReturn = Math.max(...allReturns) + 0.005;

  if (frontier.length === 0 && portfolios.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-400">Run optimization to see the efficient frontier</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          type="number"
          dataKey="risk"
          domain={[minRisk, maxRisk]}
          tickFormatter={(v) => formatPercent(v)}
          label={{ value: 'Risk (Std Dev)', position: 'insideBottom', offset: -5 }}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="return"
          domain={[minReturn, maxReturn]}
          tickFormatter={(v) => formatPercent(v)}
          label={{ value: 'Expected Return', angle: -90, position: 'insideLeft', offset: 10 }}
          tick={{ fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
        />

        {/* Resampled Portfolios (render first so they appear behind) */}
        {resampledData.length > 0 && (
          <Scatter
            name="Resampled"
            data={resampledData}
            fill="#D351DE"
            fillOpacity={0.3}
            shape="circle"
            legendType="circle"
          />
        )}

        {/* Efficient Frontier Line */}
        {frontierData.length > 0 && (
          <Line
            data={frontierData}
            type="monotone"
            dataKey="return"
            stroke={CHART_COLORS.frontier}
            strokeWidth={2}
            dot={{ r: 3, fill: CHART_COLORS.frontier }}
            name="Efficient Frontier"
            isAnimationActive={false}
          />
        )}

        {/* Portfolio Points */}
        {portfolioData.map((portfolio) => (
          <Scatter
            key={portfolio.name}
            name={portfolio.name}
            data={[portfolio]}
            fill={portfolio.color}
            shape="circle"
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
