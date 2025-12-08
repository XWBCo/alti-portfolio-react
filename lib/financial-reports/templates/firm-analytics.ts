import type { FirmReportData, AdvisorSummary, ClientSegment, AUMHistoryPoint } from '../types';
import { ALTI_BRAND, ALTI_LOGO_BASE64, ALTI_LOGO_WIDTH, ALTI_LOGO_HEIGHT } from '../branding';

// ============================================================================
// Firm Analytics Report Template
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

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// Generate SVG area chart for AUM history
function generateAUMTrendChart(history: AUMHistoryPoint[]): string {
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = history.map(h => h.aum);
  const minVal = Math.min(...values) * 0.95;
  const maxVal = Math.max(...values) * 1.05;
  const range = maxVal - minVal;

  const points = history.map((h, i) => {
    const x = padding.left + (i / (history.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((h.aum - minVal) / range) * chartHeight;
    return { x, y, data: h };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const value = minVal + range * pct;
    const y = padding.top + chartHeight - pct * chartHeight;
    return `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#6B7280">${formatCurrency(value)}</text>`;
  }).join('');

  // X-axis labels (every 3 months)
  const xLabels = history.filter((_, i) => i % 3 === 0).map((h, i) => {
    const idx = i * 3;
    const x = padding.left + (idx / (history.length - 1)) * chartWidth;
    return `<text x="${x}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#6B7280">${formatMonth(h.date)}</text>`;
  }).join('');

  // Grid lines
  const gridLines = [0.25, 0.5, 0.75].map(pct => {
    const y = padding.top + chartHeight - pct * chartHeight;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#E5E7EB" stroke-dasharray="4"/>`;
  }).join('');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${gridLines}
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${ALTI_BRAND.colors.primary}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${ALTI_BRAND.colors.primary}" stop-opacity="0.05"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#areaGradient)"/>
      <path d="${linePath}" fill="none" stroke="${ALTI_BRAND.colors.primary}" stroke-width="2.5"/>
      ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${ALTI_BRAND.colors.primary}"/>`).join('')}
      ${yLabels}
      ${xLabels}
    </svg>
  `;
}

// Generate horizontal bar chart for advisor leaderboard
function generateAdvisorLeaderboard(advisors: AdvisorSummary[]): string {
  const top5 = advisors.slice(0, 5);
  const maxAUM = top5[0]?.totalAUM || 1;
  const barHeight = 32;
  const chartHeight = top5.length * (barHeight + 12) + 20;
  const chartWidth = 550;
  const labelWidth = 140;
  const valueWidth = 100;
  const barWidth = chartWidth - labelWidth - valueWidth - 30;

  const bars = top5.map((advisor, i) => {
    const y = i * (barHeight + 12) + 10;
    const width = (advisor.totalAUM / maxAUM) * barWidth;
    const rank = i + 1;
    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#6B7280', '#6B7280'];

    return `
      <g transform="translate(0, ${y})">
        <circle cx="12" cy="${barHeight / 2}" r="10" fill="${rankColors[i]}"/>
        <text x="12" y="${barHeight / 2 + 4}" text-anchor="middle" font-size="10" font-weight="600" fill="white">${rank}</text>
        <text x="30" y="${barHeight / 2 + 4}" font-size="12" fill="#374151" font-weight="500">${advisor.advisorName}</text>
        <text x="30" y="${barHeight / 2 + 16}" font-size="10" fill="#9CA3AF">${advisor.clientCount} clients</text>
        <rect x="${labelWidth}" y="4" width="${width}" height="${barHeight - 8}" fill="${ALTI_BRAND.colors.primary}" rx="4"/>
        <text x="${labelWidth + barWidth + 10}" y="${barHeight / 2 + 4}" font-size="12" fill="#374151" font-weight="600">${formatCurrency(advisor.totalAUM)}</text>
      </g>
    `;
  }).join('');

  return `
    <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
      ${bars}
    </svg>
  `;
}

// Generate donut chart for client segmentation
function generateSegmentationDonut(segments: ClientSegment[]): string {
  const total = segments.reduce((sum, s) => sum + s.totalAUM, 0);
  const colors = ['#00E7D7', '#0F94A6', '#A638B5'];
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;
  const innerR = 45;

  let currentAngle = -90;
  const paths = segments.map((segment, i) => {
    const angle = (segment.totalAUM / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const start1 = { x: cx + r * Math.cos(startAngle * Math.PI / 180), y: cy + r * Math.sin(startAngle * Math.PI / 180) };
    const end1 = { x: cx + r * Math.cos(endAngle * Math.PI / 180), y: cy + r * Math.sin(endAngle * Math.PI / 180) };
    const start2 = { x: cx + innerR * Math.cos(endAngle * Math.PI / 180), y: cy + innerR * Math.sin(endAngle * Math.PI / 180) };
    const end2 = { x: cx + innerR * Math.cos(startAngle * Math.PI / 180), y: cy + innerR * Math.sin(startAngle * Math.PI / 180) };

    const largeArc = angle > 180 ? 1 : 0;

    return `<path d="M ${start1.x} ${start1.y} A ${r} ${r} 0 ${largeArc} 1 ${end1.x} ${end1.y} L ${start2.x} ${start2.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${end2.x} ${end2.y} Z" fill="${colors[i]}"/>`;
  }).join('');

  const legend = segments.map((s, i) => `
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
      <div style="width: 14px; height: 14px; background: ${colors[i]}; border-radius: 3px;"></div>
      <div>
        <div style="font-size: 12px; font-weight: 500; color: #374151;">${s.segment}</div>
        <div style="font-size: 11px; color: #6B7280;">${s.clientCount} clients | ${formatCurrency(s.totalAUM)}</div>
      </div>
    </div>
  `).join('');

  return `
    <div style="display: flex; align-items: center; gap: 30px;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${paths}
        <text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="18" font-weight="700" fill="#1F2937">${formatCurrency(total)}</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="10" fill="#6B7280">Total AUM</text>
      </svg>
      <div>${legend}</div>
    </div>
  `;
}

export function generateFirmAnalyticsHTML(data: FirmReportData): string {
  const colors = ALTI_BRAND.colors;

  const advisorRows = data.aumByAdvisor.map((advisor, i) => `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td>
        <div class="advisor-name">${advisor.advisorName}</div>
        <div class="advisor-sub">${advisor.team}</div>
      </td>
      <td class="text-right">${formatCurrency(advisor.totalAUM)}</td>
      <td class="text-center">${advisor.clientCount}</td>
      <td class="text-right ${(advisor.ytdPerformance || 0) >= 0 ? 'positive' : 'negative'}">${formatPercent(advisor.ytdPerformance || 0)}</td>
      <td class="text-right ${(advisor.ytdNetFlows || 0) >= 0 ? 'positive' : 'negative'}">${formatCurrency(advisor.ytdNetFlows || 0)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Firm Analytics Report - ${data.firmName}</title>
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
          padding: 0.5in;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          page-break-after: always;
        }

        .page:last-child { page-break-after: avoid; }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid ${colors.primary};
        }

        .header-left h1 {
          font-size: 22px;
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 2px;
        }

        .header-left .subtitle {
          font-size: 13px;
          color: #6B7280;
        }

        .header-right {
          text-align: right;
        }

        .header-right img {
          max-width: 130px;
          height: auto;
          margin-bottom: 4px;
        }

        .header-right .report-date {
          font-size: 10px;
          color: #6B7280;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .metric-card {
          background: #F9FAFB;
          border-radius: 8px;
          padding: 14px;
          border: 1px solid #E5E7EB;
        }

        .metric-label {
          font-size: 10px;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 22px;
          font-weight: 700;
          color: #1F2937;
        }

        .metric-value.positive { color: ${colors.positive}; }
        .metric-value.negative { color: ${colors.negative}; }

        .metric-sub {
          font-size: 10px;
          color: #9CA3AF;
          margin-top: 2px;
        }

        .section {
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #1F2937;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid #E5E7EB;
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          font-size: 10px;
          font-weight: 600;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 10px;
          background: #F9FAFB;
          border-bottom: 1px solid #E5E7EB;
        }

        td {
          padding: 10px;
          border-bottom: 1px solid #F3F4F6;
          font-size: 12px;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .positive { color: ${colors.positive}; }
        .negative { color: ${colors.negative}; }

        .advisor-name {
          font-weight: 600;
          color: #1F2937;
        }

        .advisor-sub {
          font-size: 10px;
          color: #9CA3AF;
        }

        .footer {
          margin-top: 16px;
          padding-top: 10px;
          border-top: 1px solid #E5E7EB;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #9CA3AF;
        }

        .disclaimer {
          max-width: 75%;
        }

        .highlight-box {
          background: linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}10);
          border: 1px solid ${colors.primary}30;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .highlight-title {
          font-size: 12px;
          font-weight: 600;
          color: ${colors.secondary};
          margin-bottom: 8px;
        }

        .highlight-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .highlight-item {
          text-align: center;
        }

        .highlight-value {
          font-size: 20px;
          font-weight: 700;
          color: #1F2937;
        }

        .highlight-label {
          font-size: 10px;
          color: #6B7280;
        }

        @media print {
          body { background: white; }
          .page { box-shadow: none; margin: 0; }
        }
      </style>
    </head>
    <body>
      <!-- Page 1: Firm Summary -->
      <div class="page">
        <div class="header">
          <div class="header-left">
            <h1>Firm Analytics Report</h1>
            <div class="subtitle">${data.firmName}</div>
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
            <div class="metric-sub">${data.totalHouseholds || data.totalClients} households</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Firm YTD Return</div>
            <div class="metric-value ${data.firmYTDReturn >= 0 ? 'positive' : 'negative'}">${formatPercent(data.firmYTDReturn)}</div>
            <div class="metric-sub">MTD: ${formatPercent(data.firmMTDReturn)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">YTD Net Flows</div>
            <div class="metric-value ${data.ytdNetFlows >= 0 ? 'positive' : 'negative'}">${formatCurrency(data.ytdNetFlows)}</div>
            <div class="metric-sub">${data.ytdNetFlows >= 0 ? 'Inflows' : 'Outflows'}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Clients</div>
            <div class="metric-value">${data.totalClients}</div>
            <div class="metric-sub">${data.totalAdvisors} advisors</div>
          </div>
        </div>

        <div class="highlight-box">
          <div class="highlight-title">Key Performance Indicators</div>
          <div class="highlight-grid">
            <div class="highlight-item">
              <div class="highlight-value">${formatCurrency(data.avgClientAUM)}</div>
              <div class="highlight-label">Avg Client AUM</div>
            </div>
            <div class="highlight-item">
              <div class="highlight-value">${data.ytdNewClients || 0}</div>
              <div class="highlight-label">New Clients YTD</div>
            </div>
            <div class="highlight-item">
              <div class="highlight-value">${formatCurrency(data.totalAUM / data.totalAdvisors)}</div>
              <div class="highlight-label">AUM per Advisor</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">AUM Trend (12 Months)</div>
          ${generateAUMTrendChart(data.aumHistory)}
        </div>

        <div class="two-col">
          <div class="section">
            <div class="section-title">Top Advisors by AUM</div>
            ${generateAdvisorLeaderboard(data.aumByAdvisor)}
          </div>
          <div class="section">
            <div class="section-title">Client Segmentation</div>
            ${data.aumBySegment ? generateSegmentationDonut(data.aumBySegment) : '<div>No segmentation data</div>'}
          </div>
        </div>

        <div class="footer">
          <div class="disclaimer">This report is confidential and intended for internal use only. Past performance is not indicative of future results.</div>
          <div>${ALTI_BRAND.firmName} | Page 1 of 2</div>
        </div>
      </div>

      <!-- Page 2: Advisor Details -->
      <div class="page">
        <div class="header">
          <div class="header-left">
            <h1>Advisor Performance Details</h1>
            <div class="subtitle">${data.totalAdvisors} Advisors | ${data.totalClients} Clients | ${formatCurrency(data.totalAUM)} AUM</div>
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
                <th class="text-center">Rank</th>
                <th>Advisor</th>
                <th class="text-right">AUM</th>
                <th class="text-center">Clients</th>
                <th class="text-right">YTD Return</th>
                <th class="text-right">YTD Flows</th>
              </tr>
            </thead>
            <tbody>
              ${advisorRows}
            </tbody>
          </table>
        </div>

        <div class="highlight-box" style="margin-top: 24px;">
          <div class="highlight-title">Firm Summary Statistics</div>
          <div class="highlight-grid">
            <div class="highlight-item">
              <div class="highlight-value">${formatCurrency(data.medianClientAUM || data.avgClientAUM)}</div>
              <div class="highlight-label">Median Client AUM</div>
            </div>
            <div class="highlight-item">
              <div class="highlight-value">${formatCurrency(data.mtdNetFlows)}</div>
              <div class="highlight-label">MTD Net Flows</div>
            </div>
            <div class="highlight-item">
              <div class="highlight-value">${formatPercent(data.firmQTDReturn || 0)}</div>
              <div class="highlight-label">QTD Return</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="disclaimer">This report is confidential and intended for internal use only. Past performance is not indicative of future results.</div>
          <div>${ALTI_BRAND.firmName} | Page 2 of 2</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
