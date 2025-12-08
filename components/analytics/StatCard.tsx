'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent?: boolean;
}

export function StatCard({ title, value, subtitle, icon, accent = false }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border p-6 ${accent ? 'border-[#00f0db]' : 'border-gray-200'}`}
      role="article"
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-2 rounded-lg ${accent ? 'bg-[#E5F5F3]' : 'bg-gray-100'}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className="text-3xl font-light text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// Skeleton version for loading state
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
      <div className="h-8 w-16 bg-gray-200 rounded mb-1" />
      <div className="h-4 w-24 bg-gray-200 rounded" />
    </div>
  );
}
