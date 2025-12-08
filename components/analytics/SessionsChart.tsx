'use client';

import { useMemo } from 'react';

interface DailyMetric {
  date: string;
  displayDate: string;
  activeUsers: number;
  sessions: number;
}

interface SessionsChartProps {
  data: DailyMetric[];
  dateRangeLabel?: string;
}

export function SessionsChart({ data, dateRangeLabel = 'Sep - Dec 2025' }: SessionsChartProps) {
  const maxSessions = useMemo(() => Math.max(...data.map(m => m.sessions), 1), [data]);

  // Get evenly spaced x-axis labels
  const xAxisLabels = useMemo(() => {
    if (data.length === 0) return [];
    const step = Math.ceil(data.length / 6);
    return data.filter((_, i) => i % step === 0);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-medium text-gray-700">Daily Sessions</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            {dateRangeLabel}
          </span>
        </div>
        <div className="h-48 flex items-center justify-center text-gray-400">
          No data available for selected period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-gray-700">Daily Sessions</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
          {dateRangeLabel}
        </span>
      </div>

      {/* Bar chart with axes */}
      <div className="flex" role="img" aria-label={`Bar chart showing daily sessions from ${dateRangeLabel}`}>
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between h-48 pr-3 text-right" aria-hidden="true">
          <span className="text-xs text-gray-400">{maxSessions}</span>
          <span className="text-xs text-gray-400">{Math.round(maxSessions * 0.75)}</span>
          <span className="text-xs text-gray-400">{Math.round(maxSessions * 0.5)}</span>
          <span className="text-xs text-gray-400">{Math.round(maxSessions * 0.25)}</span>
          <span className="text-xs text-gray-400">0</span>
        </div>

        {/* Chart area */}
        <div className="flex-1">
          {/* Grid lines + bars */}
          <div className="relative h-48 border-l border-b border-gray-200">
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-gray-100 w-full" />
              ))}
            </div>

            {/* Bars */}
            <div className="absolute inset-0 flex items-end gap-[2px] px-1">
              {data.map((metric, i) => {
                const barHeightPx = Math.max((metric.sessions / maxSessions) * 192, 4);
                return (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-[#00f0db] to-[#00d6c3] rounded-t hover:opacity-80 cursor-pointer transition-opacity focus:outline-none focus:ring-2 focus:ring-[#00f0db]"
                    style={{ height: `${barHeightPx}px` }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${metric.displayDate}: ${metric.sessions} sessions, ${metric.activeUsers} users`}
                    title={`${metric.displayDate}: ${metric.sessions} sessions, ${metric.activeUsers} users`}
                  />
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between mt-2 px-1" aria-hidden="true">
            {xAxisLabels.map((metric, i) => (
              <span key={i} className="text-xs text-gray-400">{metric.displayDate}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-[#00f0db] to-[#00d6c3] rounded" aria-hidden="true" />
          <span>Sessions</span>
        </div>
      </div>
    </div>
  );
}

// Skeleton version for loading state
export function SessionsChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-5 w-24 bg-gray-200 rounded" />
      </div>
      <div className="flex">
        <div className="flex flex-col justify-between h-48 pr-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 w-6 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="flex-1">
          <div className="h-48 bg-gray-100 rounded" />
          <div className="flex justify-between mt-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3 w-10 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
