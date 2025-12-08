/**
 * Analytics API Route
 * Serves platform usage analytics data
 * In production, this would parse actual login_access.log files
 */

import { NextRequest, NextResponse } from 'next/server';

// Types
export interface UserActivity {
  email: string;
  name: string;
  sessions: number;
  pageViews: number;
  primaryTool: string;
  lastActive: string;
}

export interface ToolUsage {
  tool: string;
  count: number;
  percentage: number;
  lastUsed: string;
}

export interface DailyMetric {
  date: string;
  displayDate: string;
  activeUsers: number;
  sessions: number;
}

export interface AnalyticsData {
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

// Dev users that can be excluded from metrics
const DEV_EMAILS = [
  'xavier.court@alti-global.com',
  'joao.abrantes@alti-global.com',
  'alex.hokanson@alti-global.com',
];

// Real user data from login_access.log (Jul-Dec 2025)
const USERS: UserActivity[] = [
  { email: 'joao.abrantes@alti-global.com', name: 'Joao Abrantes', sessions: 265, pageViews: 1670, primaryTool: 'Risk Contribution', lastActive: '2025-12-03' },
  { email: 'matt.silbermann@alti-global.com', name: 'Matt Silbermann', sessions: 16, pageViews: 212, primaryTool: 'Portfolio Evaluation', lastActive: '2025-12-01' },
  { email: 'massimo.fusco@alti-global.com', name: 'Massimo Fusco', sessions: 27, pageViews: 190, primaryTool: 'Portfolio Evaluation', lastActive: '2025-11-26' },
  { email: 'alex.hokanson@alti-global.com', name: 'Alex Hokanson', sessions: 31, pageViews: 167, primaryTool: 'Portfolio Evaluation', lastActive: '2025-12-03' },
  { email: 'xavier.court@alti-global.com', name: 'Xavier Court', sessions: 11, pageViews: 127, primaryTool: 'Monte Carlo', lastActive: '2025-12-03' },
  { email: 'alice.farmer@alti-global.com', name: 'Alice Farmer', sessions: 14, pageViews: 118, primaryTool: 'Risk Contribution', lastActive: '2025-11-30' },
  { email: 'aurora.vorobets@alti-global.com', name: 'Aurora Vorobets', sessions: 15, pageViews: 84, primaryTool: 'Risk Contribution', lastActive: '2025-11-26' },
  { email: 'kendall.hufford@alti-global.com', name: 'Kendall Hufford', sessions: 16, pageViews: 79, primaryTool: 'Monte Carlo', lastActive: '2025-11-19' },
  { email: 'ermanno.molteni@alti-global.com', name: 'Ermanno Molteni', sessions: 6, pageViews: 51, primaryTool: 'Portfolio Evaluation', lastActive: '2025-11-26' },
  { email: 'jordan.paine@alti-global.com', name: 'Jordan Paine', sessions: 11, pageViews: 41, primaryTool: 'Monte Carlo', lastActive: '2025-11-19' },
  { email: 'david.geng@alti-global.com', name: 'David Geng', sessions: 8, pageViews: 38, primaryTool: 'Portfolio Evaluation', lastActive: '2025-12-03' },
  { email: 'alex.heppell@alti-global.com', name: 'Alex Heppell', sessions: 7, pageViews: 27, primaryTool: 'Impact Analytics', lastActive: '2025-11-26' },
];

// Real tool usage from login_access.log (Jul-Dec 2025)
const TOOL_USAGE: ToolUsage[] = [
  { tool: 'Portfolio Evaluation', count: 454, percentage: 31.4, lastUsed: '2025-12-03' },
  { tool: 'Risk Contribution', count: 396, percentage: 27.4, lastUsed: '2025-12-03' },
  { tool: 'Monte Carlo Simulation', count: 287, percentage: 19.9, lastUsed: '2025-12-03' },
  { tool: 'Capital Market Assumptions', count: 151, percentage: 10.4, lastUsed: '2025-12-03' },
  { tool: 'Impact Analytics', count: 79, percentage: 5.5, lastUsed: '2025-12-03' },
  { tool: 'Client Assessment', count: 21, percentage: 1.5, lastUsed: '2025-11-19' },
];

// Real daily metrics from login_access.log (Jul-Dec 2025)
const DAILY_METRICS: DailyMetric[] = [
  { date: '2025-09-11', displayDate: 'Sep 11', activeUsers: 5, sessions: 25 },
  { date: '2025-09-12', displayDate: 'Sep 12', activeUsers: 4, sessions: 12 },
  { date: '2025-09-22', displayDate: 'Sep 22', activeUsers: 3, sessions: 14 },
  { date: '2025-09-25', displayDate: 'Sep 25', activeUsers: 5, sessions: 11 },
  { date: '2025-09-26', displayDate: 'Sep 26', activeUsers: 10, sessions: 11 },
  { date: '2025-09-29', displayDate: 'Sep 29', activeUsers: 14, sessions: 17 },
  { date: '2025-10-02', displayDate: 'Oct 2', activeUsers: 6, sessions: 11 },
  { date: '2025-10-13', displayDate: 'Oct 13', activeUsers: 6, sessions: 7 },
  { date: '2025-10-14', displayDate: 'Oct 14', activeUsers: 7, sessions: 9 },
  { date: '2025-10-15', displayDate: 'Oct 15', activeUsers: 7, sessions: 8 },
  { date: '2025-10-16', displayDate: 'Oct 16', activeUsers: 7, sessions: 8 },
  { date: '2025-10-17', displayDate: 'Oct 17', activeUsers: 13, sessions: 20 },
  { date: '2025-10-20', displayDate: 'Oct 20', activeUsers: 4, sessions: 11 },
  { date: '2025-10-22', displayDate: 'Oct 22', activeUsers: 4, sessions: 11 },
  { date: '2025-10-23', displayDate: 'Oct 23', activeUsers: 5, sessions: 10 },
  { date: '2025-10-29', displayDate: 'Oct 29', activeUsers: 6, sessions: 13 },
  { date: '2025-10-31', displayDate: 'Oct 31', activeUsers: 7, sessions: 11 },
  { date: '2025-11-03', displayDate: 'Nov 3', activeUsers: 6, sessions: 6 },
  { date: '2025-11-04', displayDate: 'Nov 4', activeUsers: 5, sessions: 5 },
  { date: '2025-11-06', displayDate: 'Nov 6', activeUsers: 4, sessions: 7 },
  { date: '2025-11-07', displayDate: 'Nov 7', activeUsers: 10, sessions: 12 },
  { date: '2025-11-10', displayDate: 'Nov 10', activeUsers: 6, sessions: 5 },
  { date: '2025-11-11', displayDate: 'Nov 11', activeUsers: 10, sessions: 9 },
  { date: '2025-11-12', displayDate: 'Nov 12', activeUsers: 9, sessions: 7 },
  { date: '2025-11-13', displayDate: 'Nov 13', activeUsers: 5, sessions: 3 },
  { date: '2025-11-14', displayDate: 'Nov 14', activeUsers: 4, sessions: 3 },
  { date: '2025-11-19', displayDate: 'Nov 19', activeUsers: 6, sessions: 8 },
  { date: '2025-11-20', displayDate: 'Nov 20', activeUsers: 7, sessions: 6 },
  { date: '2025-11-21', displayDate: 'Nov 21', activeUsers: 4, sessions: 2 },
  { date: '2025-11-24', displayDate: 'Nov 24', activeUsers: 5, sessions: 4 },
  { date: '2025-12-02', displayDate: 'Dec 2', activeUsers: 6, sessions: 5 },
  { date: '2025-12-03', displayDate: 'Dec 3', activeUsers: 6, sessions: 3 },
];

// Helper to format relative dates
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const excludeDevs = searchParams.get('excludeDevs') === 'true';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    // Filter users if excluding devs
    let users = USERS.map(user => ({
      ...user,
      lastActive: formatRelativeDate(user.lastActive),
    }));

    if (excludeDevs) {
      users = users.filter(user => !DEV_EMAILS.includes(user.email));
    }

    // Filter daily metrics by date range
    let dailyMetrics = DAILY_METRICS;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      dailyMetrics = DAILY_METRICS.filter(m => {
        const date = new Date(m.date);
        return date >= start && date <= end;
      });
    }

    // Calculate summary stats
    const totalPageViews = users.reduce((sum, u) => sum + u.pageViews, 0);
    const totalSessions = users.reduce((sum, u) => sum + u.sessions, 0);

    // Tool usage with relative dates
    const toolUsage = TOOL_USAGE.map(tool => ({
      ...tool,
      lastUsed: formatRelativeDate(tool.lastUsed),
    }));

    const response: AnalyticsData = {
      users,
      toolUsage,
      dailyMetrics,
      summary: {
        totalUsers: excludeDevs ? 52 : 55,
        totalSessions: excludeDevs ? 324 : totalSessions,
        totalPageViews: excludeDevs ? totalPageViews : 5113,
        dateRange: {
          start: DAILY_METRICS[0]?.date || '',
          end: DAILY_METRICS[DAILY_METRICS.length - 1]?.date || '',
        },
      },
      devEmails: DEV_EMAILS,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
