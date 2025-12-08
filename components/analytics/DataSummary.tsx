'use client';

import { Activity } from 'lucide-react';

interface DataSummaryProps {
  dateRange: string;
  daysWithActivity: number;
  topTool: string;
  topUser: string;
}

export function DataSummary({ dateRange, daysWithActivity, topTool, topUser }: DataSummaryProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" aria-hidden="true" />
        Data Summary
      </h3>
      <div className="space-y-4" role="list" aria-label="Analytics summary">
        <div className="flex items-center justify-between" role="listitem">
          <span className="text-sm text-gray-600">Date Range</span>
          <span className="text-sm font-medium text-gray-900">{dateRange}</span>
        </div>
        <div className="flex items-center justify-between" role="listitem">
          <span className="text-sm text-gray-600">Days with Activity</span>
          <span className="text-sm font-medium text-gray-900">{daysWithActivity}</span>
        </div>
        <div className="flex items-center justify-between" role="listitem">
          <span className="text-sm text-gray-600">Top Tool</span>
          <span className="text-sm font-medium text-gray-900">{topTool}</span>
        </div>
        <div className="flex items-center justify-between" role="listitem">
          <span className="text-sm text-gray-600">Top User</span>
          <span className="text-sm font-medium text-gray-900">{topUser}</span>
        </div>
      </div>
    </div>
  );
}

// Skeleton version for loading state
export function DataSummarySkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit animate-pulse">
      <div className="h-4 w-28 bg-gray-200 rounded mb-4" />
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
