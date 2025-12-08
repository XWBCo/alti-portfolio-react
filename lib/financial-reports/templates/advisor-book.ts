import type { AdvisorReportData, ClientSummary } from '../types';
import { ALTI_BRAND, ALTI_LOGO_BASE64, ALTI_LOGO_WIDTH, ALTI_LOGO_HEIGHT } from '../branding';
import { STATUS_COLORS } from '../types';

// ============================================================================
// Advisor Book Report Template
// ============================================================================

function formatCurrency(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusColor(status: string): string {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6B7280';
}

function getStatusLabel(status: string): string {
  return status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Generate SVG bar chart for client AUM distribution
function generateClientAUMChart(clients: ClientSummary[]): string {
  const sortedClients = [...clients].sort((a, b) => b.aum - a.aum).slice(0, 10);
  const maxAUM = sortedClients[0]?.aum || 1;
  const barHeight = 28;
  const chartHeight = sortedClients.length * (barHeight + 8) + 20;
  const chartWidth = 500;
  const labelWidth = 120;
  const valueWidth = 80;
  const barWidth = chartWidth - labelWidth - valueWidth - 20;

  const bars = sortedClients.map((client, i) => {
    const y = i * (barHeight + 8) + 10;
    const width = (client.aum / maxAUM) * barWidth;
    const truncatedName = client.household.length > 15
      ? client.household.substring(0, 15) + '...'
      : client.household;

    return `
      <g transform="translate(0, ${y})">
        <text x="0" y="${barHeight / 2 + 4}" font-size="11" fill="#374151">${truncatedName}</text>
        <rect x="${labelWidth}" y="0" width="${width}" height="${barHeight}" fill="${ALTI_BRAND.colors.primary}" rx="4"/>
        <text x="${labelWidth + barWidth + 10}" y="${barHeight / 2 + 4}" font-size="11" fill="#374151" font-weight="600">${formatCurrency(client.aum)}</text>
      </g>
    `;
  }).join('');

  return `
    <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
      ${bars}
    </svg>
  `;
}

// Generate SVG donut chart for client status distribution
function generateStatusDonut(data: { onTrack: number; needsAttention: number; atRisk: number }): string {
  const total = data.onTrack + data.needsAttention + data.atRisk;
  if (total === 0) return '<div class="no-data">No client data</div>';

  const segments = [
    { label: 'On Track', count: data.onTrack, color: STATUS_COLORS['on-track'] },
    { label: 'Needs Attention', count: data.needsAttention, color: STATUS_COLORS['needs-attention'] },
    { label: 'At Risk', count: data.atRisk, color: STATUS_COLORS['at-risk'] },
  ].filter(s => s.count > 0);

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 60;
  const innerR = 40;

  let currentAngle = -90;
  const paths = segments.map(segment => {
    const angle = (segment.count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const start1 = { x: cx + r * Math.cos(startAngle * Math.PI / 180), y: cy + r * Math.sin(startAngle * Math.PI / 180) };
    const end1 = { x: cx + r * Math.cos(endAngle * Math.PI / 180), y: cy + r * Math.sin(endAngle * Math.PI / 180) };
    const start2 = { x: cx + innerR * Math.cos(endAngle * Math.PI / 180), y: cy + innerR * Math.sin(endAngle * Math.PI / 180) };
    const end2 = { x: cx + innerR * Math.cos(startAngle * Math.PI / 180), y: cy + innerR * Math.sin(startAngle * Math.PI / 180) };

    const largeArc = angle > 180 ? 1 : 0;

    return `<path d="M ${start1.x} ${start1.y} A ${r} ${r} 0 ${largeArc} 1 ${end1.x} ${end1.y} L ${start2.x} ${start2.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${end2.x} ${end2.y} Z" fill="${segment.color}"/>`;
  }).join('');

  const legend = segments.map((s, i) => `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
      <div style="width: 12px; height: 12px; background: ${s.color}; border-radius: 2px;"></div>
      <span style="font-size: 12px; color: #374151;">${s.label}: ${s.count}</span>
    </div>
  `).join('');

  return `
    <div style="display: flex; align-items: center; gap: 20px;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${paths}
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="20" font-weight="700" fill="#1F2937">${total}</text>
        <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="10" fill="#6B7280">clients</text>
      </svg>
      <div>${legend}</div>
    </div>
  `;
}

export function generateAdvisorBookHTML(data: AdvisorReportData): string {
  const colors = ALTI_BRAND.colors;

  const clientRows = [...data.clients]
    .sort((a, b) => b.aum - a.aum)
    .map(client => `
      <tr>
        <td>
          <div class="client-name">${client.household}</div>
          <div class="client-sub">${client.clientName}</div>
        </td>
        <td class="text-right">${formatCurrency(client.aum)}</td>
        <td class="text-right ${client.ytdReturn >= 0 ? 'positive' : 'negative'}">${formatPercent(client.ytdReturn)}</td>
        <td>
          <span class="status-badge" style="background: ${getStatusColor(client.status)}20; color: ${getStatusColor(client.status)};">
            ${getStatusLabel(client.status)}
          </span>
        </td>
        <td class="text-center">${client.lastMeeting ? formatDate(client.lastMeeting) : '-'}</td>
        <td class="text-center">${client.nextMeeting ? formatDate(client.nextMeeting) : '-'}</td>
      </tr>
    `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Advisor Book Report - ${data.advisorName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1F2937;
          background: #F9FAFB;
          font-size: 14px;
          line-height: 1.5;
        }

        .page {
          width: 8.5in;
          min-height: 11in;
          margin: 0 auto;
          background: white;
          padding: 0.6in;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          page-break-after: always;
        }

        .page:last-child { page-break-after: avoid; }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid ${colors.primary};
        }

        .header-left h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 4px;
        }

        .header-left .subtitle {
          font-size: 14px;
          color: #6B7280;
        }

        .header-right {
          text-align: right;
        }

        .header-right img {
          max-width: 140px;
          height: auto;
          margin-bottom: 4px;
        }

        .header-right .report-date {
          font-size: 11px;
          color: #6B7280;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: #F9FAFB;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #E5E7EB;
        }

        .metric-label {
          font-size: 11px;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #1F2937;
        }

        .metric-value.positive { color: ${colors.positive}; }
        .metric-value.negative { color: ${colors.negative}; }

        .metric-sub {
          font-size: 11px;
          color: #9CA3AF;
          margin-top: 2px;
        }

        .section {
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1F2937;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #E5E7EB;
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 12px;
          background: #F9FAFB;
          border-bottom: 1px solid #E5E7EB;
        }

        td {
          padding: 10px 12px;
          border-bottom: 1px solid #F3F4F6;
          font-size: 13px;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .positive { color: ${colors.positive}; }
        .negative { color: ${colors.negative}; }

        .client-name {
          font-weight: 600;
          color: #1F2937;
        }

        .client-sub {
          font-size: 11px;
          color: #9CA3AF;
        }

        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .footer {
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px solid #E5E7EB;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #9CA3AF;
        }

        .disclaimer {
          max-width: 80%;
        }

        @media print {
          body { background: white; }
          .page { box-shadow: none; margin: 0; }
        }
      </style>
    </head>
    <body>
      <!-- Page 1: Summary & Client Status -->
      <div class="page">
        <div class="header">
          <div class="header-left">
            <h1>Advisor Book Report</h1>
            <div class="subtitle">${data.advisorName}${data.team ? ` | ${data.team}` : ''}${data.role ? ` | ${data.role}` : ''}</div>
            <div class="subtitle">Period: ${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}</div>
          </div>
          <div class="header-right">
            <img src="${ALTI_LOGO_BASE64}" alt="${ALTI_BRAND.firmName}" width="${ALTI_LOGO_WIDTH}" height="${ALTI_LOGO_HEIGHT}" />
            <div class="report-date">Generated: ${formatDate(data.reportDate)}</div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total AUM</div>
            <div class="metric-value">${formatCurrency(data.totalAUM)}</div>
            <div class="metric-sub">${data.totalClients} clients</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">YTD Return</div>
            <div class="metric-value ${(data.bookYTDReturn || 0) >= 0 ? 'positive' : 'negative'}">${formatPercent(data.bookYTDReturn || 0)}</div>
            <div class="metric-sub">Book performance</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">YTD Net Flows</div>
            <div class="metric-value ${(data.ytdNetFlows || 0) >= 0 ? 'positive' : 'negative'}">${formatCurrency(data.ytdNetFlows || 0)}</div>
            <div class="metric-sub">${(data.ytdNetFlows || 0) >= 0 ? 'Inflows' : 'Outflows'}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Avg Client AUM</div>
            <div class="metric-value">${formatCurrency(data.avgClientAUM)}</div>
            <div class="metric-sub">Median: ${formatCurrency(data.medianClientAUM || data.avgClientAUM)}</div>
          </div>
        </div>

        <div class="two-col">
          <div class="section">
            <div class="section-title">Client Status Distribution</div>
            ${generateStatusDonut(data.clientsByStatus)}
          </div>
          <div class="section">
            <div class="section-title">Top Clients by AUM</div>
            ${generateClientAUMChart(data.clients)}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Revenue Summary</div>
          <div class="metrics-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="metric-card">
              <div class="metric-label">Est. Annual Revenue</div>
              <div class="metric-value">${formatCurrency(data.annualRevenue || data.totalAUM * 0.0075)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Avg Fee Rate</div>
              <div class="metric-value">${data.avgFeeRate || 75} bps</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Revenue per Client</div>
              <div class="metric-value">${formatCurrency((data.annualRevenue || data.totalAUM * 0.0075) / data.totalClients)}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="disclaimer">This report is confidential and intended for advisor use only. Past performance is not indicative of future results.</div>
          <div>${ALTI_BRAND.firmName} | Page 1 of 2</div>
        </div>
      </div>

      <!-- Page 2: Client List -->
      <div class="page">
        <div class="header">
          <div class="header-left">
            <h1>Client Book Details</h1>
            <div class="subtitle">${data.advisorName} | ${data.totalClients} Clients | ${formatCurrency(data.totalAUM)} AUM</div>
          </div>
          <div class="header-right">
            <img src="${ALTI_LOGO_BASE64}" alt="${ALTI_BRAND.firmName}" width="${ALTI_LOGO_WIDTH}" height="${ALTI_LOGO_HEIGHT}" />
            <div class="report-date">Generated: ${formatDate(data.reportDate)}</div>
          </div>
        </div>

        <div class="section">
          <table>
            <thead>
              <tr>
                <th>Client / Household</th>
                <th class="text-right">AUM</th>
                <th class="text-right">YTD Return</th>
                <th>Status</th>
                <th class="text-center">Last Meeting</th>
                <th class="text-center">Next Meeting</th>
              </tr>
            </thead>
            <tbody>
              ${clientRows}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div class="disclaimer">This report is confidential and intended for advisor use only. Past performance is not indicative of future results.</div>
          <div>${ALTI_BRAND.firmName} | Page 2 of 2</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
