'use client';

interface ToolUsage {
  tool: string;
  count: number;
  percentage: number;
  lastUsed: string;
}

interface ToolUsageChartProps {
  data: ToolUsage[];
}

export function ToolUsageChart({ data }: ToolUsageChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-medium text-gray-700">Tool Usage Distribution</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            Non-Home Visits
          </span>
        </div>
        <div className="h-32 flex items-center justify-center text-gray-400">
          No tool usage data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-gray-700">Tool Usage Distribution</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
          Non-Home Visits
        </span>
      </div>

      <div className="space-y-4" role="list" aria-label="Tool usage statistics">
        {data.map((tool, i) => (
          <div key={i} role="listitem">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{tool.tool}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">{tool.lastUsed}</span>
                <span className="text-sm font-medium text-gray-900 w-20 text-right">
                  {tool.count.toLocaleString()}{' '}
                  <span className="text-xs text-gray-400">({tool.percentage}%)</span>
                </span>
              </div>
            </div>
            <div
              className="h-2 bg-gray-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={tool.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${tool.tool}: ${tool.percentage}%`}
            >
              <div
                className="h-full bg-gradient-to-r from-[#00f0db] to-[#00d6c3] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(tool.percentage * 3, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton version for loading state
export function ToolUsageChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="h-5 w-24 bg-gray-200 rounded" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="flex items-center gap-4">
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div
                className="h-full bg-gray-200 rounded-full"
                style={{ width: `${Math.max(80 - i * 15, 10)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
