'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  Activity,
  TrendingUp,
  Users,
  UserX,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  StatCard,
  StatCardSkeleton,
  SessionsChart,
  SessionsChartSkeleton,
  ToolUsageChart,
  ToolUsageChartSkeleton,
  UserTable,
  UserTableSkeleton,
  DataSummary,
  DataSummarySkeleton,
} from '@/components/analytics';

// Types matching API response
interface UserActivity {
  email: string;
  name: string;
  sessions: number;
  pageViews: number;
  primaryTool: string;
  lastActive: string;
}

interface ToolUsage {
  tool: string;
  count: number;
  percentage: number;
  lastUsed: string;
}

interface DailyMetric {
  date: string;
  displayDate: string;
  activeUsers: number;
  sessions: number;
}

interface AnalyticsData {
  users: UserActivity[];
  toolUsage: ToolUsage[];
  dailyMetrics: DailyMetric[];
  summary: {
    totalUsers: number;
    totalSessions: number;
    totalPageViews: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  devEmails: string[];
}

type TimePeriod = 7 | 30 | 90 | 'all' | 'custom';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [excludeDevs, setExcludeDevs] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (excludeDevs) params.set('excludeDevs', 'true');

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const result: AnalyticsData = await response.json();
      setData(result);

      // Initialize custom date range from data
      if (!customStartDate && result.summary.dateRange.start) {
        setCustomStartDate(result.summary.dateRange.start);
      }
      if (!customEndDate && result.summary.dateRange.end) {
        setCustomEndDate(result.summary.dateRange.end);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [excludeDevs, customStartDate, customEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter daily metrics by selected time period
  const filteredMetrics = useMemo(() => {
    if (!data) return [];

    if (timePeriod === 'all') {
      return data.dailyMetrics;
    }

    if (timePeriod === 'custom') {
      if (!customStartDate || !customEndDate) return data.dailyMetrics;
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      return data.dailyMetrics.filter(m => {
        const date = new Date(m.date);
        return date >= start && date <= end;
      });
    }

    // Filter based on actual data range, not current date
    // Use the last date in the data as reference point
    const lastDataDate = data.dailyMetrics.length > 0
      ? new Date(data.dailyMetrics[data.dailyMetrics.length - 1].date)
      : new Date();

    const cutoff = new Date(lastDataDate);
    cutoff.setDate(cutoff.getDate() - timePeriod);

    return data.dailyMetrics.filter(m => new Date(m.date) >= cutoff);
  }, [data, timePeriod, customStartDate, customEndDate]);

  // Calculate peak day from filtered metrics
  const peakDay = useMemo(() => {
    if (filteredMetrics.length === 0) return { displayDate: 'N/A', sessions: 0 };
    return filteredMetrics.reduce((max, m) => m.sessions > max.sessions ? m : max, filteredMetrics[0]);
  }, [filteredMetrics]);

  // Calculate stats from filtered data
  const stats = useMemo(() => {
    if (!data) return { totalUsers: 0, totalSessions: 0, totalPageViews: 0, avgPagesPerSession: '0' };

    const totalPageViews = data.summary.totalPageViews;
    const totalSessions = data.summary.totalSessions;
    const avgPagesPerSession = totalSessions > 0
      ? (totalPageViews / totalSessions).toFixed(1)
      : '0';

    return {
      totalUsers: data.summary.totalUsers,
      totalSessions,
      totalPageViews,
      avgPagesPerSession,
    };
  }, [data]);

  // Date range label for charts
  const dateRangeLabel = useMemo(() => {
    if (!data) return '';
    const { start, end } = data.summary.dateRange;
    if (!start || !end) return '';

    const startDate = new Date(start);
    const endDate = new Date(end);
    const startMonth = startDate.toLocaleString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    return `${startMonth} - ${endMonth}`;
  }, [data]);

  // CSV export handler
  const handleExportCSV = useCallback(() => {
    if (!data) return;

    const headers = ['Name', 'Email', 'Sessions', 'Page Views', 'Pages/Session', 'Primary Tool', 'Last Active'];
    const rows = data.users.map(user => [
      user.name,
      user.email,
      user.sessions.toString(),
      user.pageViews.toString(),
      (user.pageViews / user.sessions).toFixed(1),
      user.primaryTool,
      user.lastActive,
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <main className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Failed to Load Analytics</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1
              className="text-4xl text-gray-900"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Platform Analytics
            </h1>
            <span className="px-2 py-0.5 text-xs font-medium bg-[#E5F5F3] text-[#0F94A6] rounded">
              DEV
            </span>
          </div>
          <p className="text-gray-500">
            Real usage data from login_access.log (Jul - Dec 2025) &bull; {stats.totalUsers} users &bull; {stats.totalSessions.toLocaleString()} sessions
            {excludeDevs && <span className="text-amber-600 ml-2">(excluding devs)</span>}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-gray-500">Time Period:</span>
            <div className="flex gap-2">
              {([7, 30, 90, 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    timePeriod === period
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {period === 'all' ? 'All Time' : `Last ${period} Days`}
                </button>
              ))}
              <button
                onClick={() => setTimePeriod('custom')}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                  timePeriod === 'custom'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Custom
              </button>
            </div>

            {/* Custom date inputs */}
            {timePeriod === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00f0db]"
                  aria-label="Start date"
                />
                <span className="text-gray-400">→</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00f0db]"
                  aria-label="End date"
                />
              </div>
            )}
          </div>

          {/* Exclude Devs Toggle */}
          <button
            onClick={() => setExcludeDevs(!excludeDevs)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              excludeDevs
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <UserX className="w-4 h-4" />
            {excludeDevs ? 'Devs Excluded' : 'Exclude Devs'}
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                subtitle={`${data?.users.length || 0} tracked in table`}
                icon={<Users className="w-5 h-5 text-[#00f0db]" />}
                accent
              />
              <StatCard
                title="Total Sessions"
                value={stats.totalSessions}
                subtitle={`${stats.totalPageViews.toLocaleString()} page views`}
                icon={<BarChart3 className="w-5 h-5 text-gray-600" />}
              />
              <StatCard
                title="Avg Pages/Session"
                value={stats.avgPagesPerSession}
                subtitle="Calculated from logs"
                icon={<Activity className="w-5 h-5 text-gray-600" />}
              />
              <StatCard
                title="Peak Activity"
                value={peakDay.displayDate}
                subtitle={`${peakDay.sessions} sessions`}
                icon={<TrendingUp className="w-5 h-5 text-gray-600" />}
              />
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="mb-10">
          <div className="mb-6">
            <h2 className="text-xl font-medium text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              Usage Trends
            </h2>
            <p className="text-sm text-gray-500">Daily active users and session activity over the selected period</p>
          </div>

          <div className="space-y-6">
            {loading ? (
              <>
                <SessionsChartSkeleton />
                <ToolUsageChartSkeleton />
              </>
            ) : (
              <>
                <SessionsChart data={filteredMetrics} dateRangeLabel={dateRangeLabel} />
                <ToolUsageChart data={data?.toolUsage || []} />
              </>
            )}
          </div>
        </div>

        {/* User Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {loading ? (
            <>
              <UserTableSkeleton />
              <DataSummarySkeleton />
            </>
          ) : (
            <>
              <UserTable
                users={data?.users || []}
                excludeDevsLabel={excludeDevs}
                onExportCSV={handleExportCSV}
              />
              <DataSummary
                dateRange={dateRangeLabel}
                daysWithActivity={filteredMetrics.length}
                topTool={data?.toolUsage[0]?.tool.split(' ')[0] || 'N/A'}
                topUser={data?.users[0]?.name.split(' ')[0] || 'N/A'}
              />
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-400">
            Data refreshes automatically every 6 hours
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Environment: Development | Version: 0.1.0 | Build: {new Date().toISOString().split('T')[0]}
          </p>
        </div>
      </main>
    </div>
  );
}
