import { NextResponse } from 'next/server';

// Sample advisors - matches SAMPLE_ADVISORS in mock-data.ts
const SAMPLE_ADVISORS = [
  { id: 'adv-001', name: 'Kimberly Evans', team: 'Private Wealth', role: 'Senior Advisor', clientCount: 3, aum: 11338099615 },
  { id: 'adv-002', name: 'Craig Smith', team: 'Family Office', role: 'Managing Director', clientCount: 2, aum: 1845000000 },
  { id: 'adv-003', name: 'Jennifer Walsh', team: 'Private Wealth', role: 'Partner', clientCount: 1, aum: 1300000000 },
  { id: 'adv-004', name: 'Michael Chen', team: 'Private Wealth', role: 'Senior Advisor', clientCount: 2, aum: 1220000000 },
  { id: 'adv-005', name: 'Sarah Johnson', team: 'Family Office', role: 'Partner', clientCount: 2, aum: 1005000000 },
];

function formatAUM(aum: number): string {
  if (aum >= 1e9) return `$${(aum / 1e9).toFixed(2)}B`;
  if (aum >= 1e6) return `$${(aum / 1e6).toFixed(1)}M`;
  return `$${(aum / 1e3).toFixed(0)}K`;
}

export async function GET() {
  const advisors = SAMPLE_ADVISORS.map((a, index) => ({
    ...a,
    index,
    aumFormatted: formatAUM(a.aum),
  }));

  return NextResponse.json({
    success: true,
    advisors,
  });
}
