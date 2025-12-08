import { NextResponse } from 'next/server';

// Sample clients data - matches mock-data.ts SAMPLE_CLIENTS
const SAMPLE_CLIENTS = [
  { id: 0, name: 'Lauren, Ralph Relationship', household: 'Lauren Family', aum: 10038099615, advisor: 'Kimberly Evans', status: 'on-track' as const },
  { id: 1, name: 'Tuftin, Leslie and Dean Relationship', household: 'Tuftin Family', aum: 1800000000, advisor: 'Craig Smith', status: 'on-track' as const },
  { id: 2, name: 'Waibel, Julie and Brad Relationship', household: 'Waibel Family', aum: 1300000000, advisor: 'Jennifer Walsh', status: 'needs-attention' as const },
  { id: 3, name: 'Effron, Blair and Cheryl Relationship', household: 'Effron Family', aum: 1200000000, advisor: 'Michael Chen', status: 'on-track' as const },
  { id: 4, name: 'Chantecaille Relationship', household: 'Chantecaille Family', aum: 980000000, advisor: 'Sarah Johnson', status: 'on-track' as const },
  { id: 5, name: 'Morrison, David and Linda', household: 'Morrison Family', aum: 45000000, advisor: 'Craig Smith', status: 'on-track' as const },
  { id: 6, name: 'Chen, Michael and Sarah', household: 'Chen Family', aum: 18500000, advisor: 'Jennifer Walsh', status: 'on-track' as const },
  { id: 7, name: 'Martinez, Roberto and Elena', household: 'Martinez Family', aum: 42000000, advisor: 'Kimberly Evans', status: 'needs-attention' as const },
  { id: 8, name: 'Thompson, Eleanor', household: 'Thompson Family', aum: 68000000, advisor: 'Michael Chen', status: 'on-track' as const },
  { id: 9, name: 'Williams, James and Patricia', household: 'Williams Family', aum: 125000000, advisor: 'Sarah Johnson', status: 'at-risk' as const },
];

function formatAUM(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${(value / 1_000).toFixed(0)}K`;
}

export async function GET() {
  const clients = SAMPLE_CLIENTS.map(client => ({
    ...client,
    aumFormatted: formatAUM(client.aum),
  }));

  return NextResponse.json({
    success: true,
    clients,
    total: clients.length,
  });
}
