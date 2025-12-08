'use client';

export interface MetricItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface MetricsData {
  title: string;
  badge?: string;
  metrics: MetricItem[];
}

interface MetricsCardProps {
  data: MetricsData;
}

export function MetricsCard({ data }: MetricsCardProps) {
  return (
    <div className="my-6 bg-white border border-emerald-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 bg-emerald-600 flex items-center justify-between">
        <span className="font-serif text-lg font-medium text-white">
          {data.title}
        </span>
        {data.badge && (
          <span className="px-3.5 py-1.5 bg-white/20 rounded-full text-xs text-white font-medium tracking-wide">
            {data.badge}
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 border-t border-emerald-200">
        {data.metrics.map((metric, index) => (
          <div
            key={index}
            className={`py-6 px-5 text-center ${
              index < data.metrics.length - 1 ? 'border-r border-emerald-200' : ''
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2.5">
              {metric.label}
            </div>
            <div
              className={`font-serif text-3xl font-medium ${
                metric.highlight ? 'text-teal-500' : 'text-emerald-600'
              }`}
            >
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
