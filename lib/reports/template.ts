import type { ReportData, ThemeColors, ReportConfig, PortfolioMetrics, BenchmarkMetrics } from './types';
import type { ReportCharts } from './svg-charts';

// ============================================================================
// HTML Template Generator for ESG Impact Report
// 4-page A4 landscape PDF matching Flask reference quality
// ============================================================================

const DEFAULT_THEME: ThemeColors = {
  strongColor: '#A638B5',
  onTrackColor: '#0A598C',
  focusColor: '#DBCB23',
  portfolioColor: '#00E7D7',
  benchmarkColor: '#0F94A6',
};

const DEFAULT_CONFIG: ReportConfig = {
  includeClimate: true,
  includeNaturalCapital: true,
  includeSocial: true,
  includeGovernance: true,
  includeHeatmap: true,
  benchmarkName: 'MSCI ACWI',
  reportYear: new Date().getFullYear(),
};

// AlTi logo as base64 (from Flask template)
const ALTI_LOGO_BASE64 = 'data:image/png;base64,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';

// ============================================================================
// Heatmap Metrics Definition (20 metrics across 5 categories)
// ============================================================================

interface HeatmapMetric {
  name: string;
  category: 'Climate' | 'Environment' | 'Social' | 'Governance' | 'Resources';
  getValue: (m: PortfolioMetrics) => number;
  getBenchmark: (b: BenchmarkMetrics) => number;
  lowerBetter: boolean;
  format: (v: number) => string;
}

// Heatmap metrics arranged exactly as in reference PDF (read column by column, top to bottom)
const HEATMAP_METRICS: HeatmapMetric[] = [
  // Climate (column 1)
  { name: 'Temp Rating Scope 1+2', category: 'Climate', getValue: m => m.climate_performance_temp[0], getBenchmark: b => b.climate_performance_temp[0], lowerBetter: true, format: v => v.toFixed(2) },
  { name: 'Net Zero Target', category: 'Climate', getValue: m => m.climate_performance_env[1], getBenchmark: b => b.climate_performance_env[1], lowerBetter: false, format: v => v.toFixed(1) },
  { name: 'Female Board Members', category: 'Climate', getValue: m => m.social[2], getBenchmark: b => b.social[2], lowerBetter: false, format: v => v.toFixed(0) + '%' },
  { name: 'Anti-Bribery Score', category: 'Climate', getValue: m => m.governance[3], getBenchmark: b => b.governance[3], lowerBetter: false, format: v => v.toFixed(1) },

  // Environment (column 2)
  { name: 'Environmental Score', category: 'Environment', getValue: m => m.climate_performance_env[0], getBenchmark: b => b.climate_performance_env[0], lowerBetter: false, format: v => v.toFixed(1) },
  { name: 'Gender Pay Gap', category: 'Environment', getValue: m => m.social[1], getBenchmark: b => b.social[1], lowerBetter: true, format: v => v.toFixed(1) },
  { name: 'Independent Board', category: 'Environment', getValue: m => m.governance[2], getBenchmark: b => b.governance[2], lowerBetter: false, format: v => v.toFixed(0) + '%' },
  { name: 'Carbon Intensity 1+2', category: 'Environment', getValue: m => m.climate_scope12[1], getBenchmark: b => b.climate_scope12[1], lowerBetter: true, format: v => v.toFixed(1) },

  // Social (column 3)
  { name: 'Social Score', category: 'Social', getValue: m => m.social[0], getBenchmark: b => b.social[0], lowerBetter: false, format: v => v.toFixed(1) },
  { name: 'Non-Executive Board', category: 'Social', getValue: m => m.governance[1], getBenchmark: b => b.governance[1], lowerBetter: false, format: v => v.toFixed(0) + '%' },
  { name: 'Financed Intensity 3', category: 'Social', getValue: m => m.climate_scope3[0], getBenchmark: b => b.climate_scope3[0], lowerBetter: true, format: v => v.toFixed(1) },
  { name: 'Biodiversity Reduction', category: 'Social', getValue: m => m.natural_capital[1], getBenchmark: b => b.natural_capital[1], lowerBetter: false, format: v => v.toFixed(1) },

  // Governance (column 4)
  { name: 'Governance Score', category: 'Governance', getValue: m => m.governance[0], getBenchmark: b => b.governance[0], lowerBetter: false, format: v => v.toFixed(1) },
  { name: 'Financed Intensity 1+2', category: 'Governance', getValue: m => m.climate_scope12[0], getBenchmark: b => b.climate_scope12[0], lowerBetter: true, format: v => v.toFixed(1) },
  { name: 'Land Use & Biodiversity', category: 'Governance', getValue: m => m.natural_capital[0], getBenchmark: b => b.natural_capital[0], lowerBetter: false, format: v => v.toFixed(1) },
  { name: 'Water Recycled Ratio', category: 'Governance', getValue: m => m.water_recycled_ratio, getBenchmark: b => b.water_recycled_ratio, lowerBetter: false, format: v => v.toFixed(0) + '%' },

  // Resources (column 5)
  { name: 'Temp Rating Scope 3', category: 'Resources', getValue: m => m.climate_performance_temp[1], getBenchmark: b => b.climate_performance_temp[1], lowerBetter: true, format: v => v.toFixed(2) },
  { name: 'Carbon Intensity Scope 3', category: 'Resources', getValue: m => m.climate_scope3[1], getBenchmark: b => b.climate_scope3[1], lowerBetter: true, format: v => v.toFixed(1) },
  { name: 'Diversity Targets', category: 'Resources', getValue: m => m.social[3], getBenchmark: b => b.social[3], lowerBetter: false, format: v => v.toFixed(1) },
  { name: 'Waste Recycling Ratio', category: 'Resources', getValue: m => m.waste_recycling_ratio, getBenchmark: b => b.waste_recycling_ratio, lowerBetter: false, format: v => v.toFixed(0) + '%' },
];

function getStyles(colors: ThemeColors): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: white;
      color: #333;
      line-height: 1.4;
      font-size: 12px;
    }

    @media print {
      body {
        margin: 0;
        background: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .page {
        page-break-after: always;
        page-break-inside: avoid;
        width: 297mm;
        height: 210mm;
        max-height: 210mm;
        padding: 12mm;
        margin: 0;
        box-sizing: border-box;
        overflow: hidden;
      }

      .page:last-child {
        page-break-after: avoid;
      }

      .chart-container {
        break-inside: avoid;
      }
    }

    @page {
      size: A4 landscape;
      margin: 0;
    }

    .page {
      position: relative;
      background: white;
      height: 210mm;
      max-height: 210mm;
      padding: 12mm;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e9ecef;
    }

    .header-logo {
      height: 30px;
      width: auto;
      margin-left: 20px;
    }

    .client-info {
      display: flex;
      flex-direction: column;
    }

    .client-name {
      font-size: 15px;
      font-weight: 600;
      color: #005793;
      margin-bottom: 6px;
      letter-spacing: -0.01em;
    }

    .report-date {
      font-size: 11px;
      color: #6c757d;
      font-weight: 400;
    }

    .page-title {
      font-size: 22px;
      font-weight: 600;
      color: #005793;
      text-align: center;
      flex-grow: 1;
      margin: 0 40px;
      letter-spacing: -0.02em;
    }

    .category-description {
      background: #fafbfc;
      padding: 12px 18px;
      border-radius: 8px;
      margin-bottom: 12px;
      border-left: 3px solid ${colors.portfolioColor};
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }

    .category-description h3 {
      color: #005793;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .category-description p {
      color: #6c757d;
      font-size: 10px;
      line-height: 1.5;
      max-width: 100%;
    }

    .climate-charts-wrapper {
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
      margin-top: 25px;
      margin-bottom: 40px;
    }

    .chart-row {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }

    .chart-row:last-child {
      margin-bottom: 0;
    }

    .chart-half {
      flex: 1;
    }

    .chart-container {
      background: white;
      border-radius: 6px;
      padding: 8px;
      border: 1px solid #e9ecef;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      text-align: center;
    }

    .chart-container img {
      width: 100%;
      height: auto;
    }

    .donut-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 0;
    }

    .metric-card {
      background: white;
      border-radius: 6px;
      padding: 10px;
      border: 1px solid #e9ecef;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      text-align: center;
    }

    .metric-title {
      font-size: 12px;
      font-weight: 600;
      color: #005793;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: -0.01em;
    }

    .metric-unit {
      font-size: 10px;
      color: #6c757d;
      margin-left: 4px;
      font-weight: 400;
    }

    .donut-chart-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 130px;
    }

    .donut-chart-container img {
      width: 100%;
      height: auto;
      max-width: 320px;
    }

    .page-footer {
      position: absolute;
      bottom: 12mm;
      left: 12mm;
      right: 12mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #e9ecef;
      font-size: 10px;
      color: #6c757d;
    }

    .page-legend {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .portfolio-dot { background: ${colors.portfolioColor}; }
    .benchmark-dot { background: ${colors.benchmarkColor}; }

    .performance-legend {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .performance-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .performance-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }

    .performance-dot.strong { background: ${colors.strongColor}; }
    .performance-dot.on-track { background: ${colors.onTrackColor}; }
    .performance-dot.focus { background: ${colors.focusColor}; }

    .description-row {
      display: flex;
      gap: 15px;
      margin-bottom: 12px;
    }

    .category-description.half-width {
      flex: 1;
      margin-bottom: 0;
    }

    /* Heatmap styles */
    .heatmap-container {
      margin: 50px 0 30px 0;
    }

    .heatmap-headers {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      margin-bottom: 15px;
    }

    .heatmap-header {
      font-weight: bold;
      font-size: 12px;
      color: #0F94A6;
      text-align: center;
      padding: 5px;
    }

    .heatmap-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 12px;
      height: 220px;
    }

    .heatmap-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      padding: 10px 8px;
      color: white;
      text-align: center;
    }

    .heatmap-metric {
      font-size: 9px;
      font-weight: normal;
      margin-bottom: 4px;
      line-height: 1.2;
    }

    .heatmap-value {
      font-size: 16px;
      font-weight: bold;
    }

    .heatmap-cell.strong { background-color: ${colors.strongColor}; }
    .heatmap-cell.on-track { background-color: ${colors.onTrackColor}; }
    .heatmap-cell.focus { background-color: ${colors.focusColor}; }

    .summary-boxes {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 57px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .summary-box {
      padding: 10px 15px;
      border-radius: 6px;
      color: white;
    }

    .summary-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .summary-title {
      font-size: 11px;
      font-weight: 600;
    }

    .summary-count {
      font-size: 22px;
      font-weight: bold;
    }

    .summary-box.strong { background-color: ${colors.strongColor}; }
    .summary-box.on-track { background-color: ${colors.onTrackColor}; }
    .summary-box.focus { background-color: ${colors.focusColor}; }
  `;
}

function renderPageHeader(clientName: string, pageTitle: string, reportYear: number): string {
  return `
    <div class="page-header">
      <div class="client-info">
        <div class="client-name">${clientName}</div>
        <div class="report-date">${reportYear} Annual Impact Report</div>
      </div>
      <h1 class="page-title">${pageTitle}</h1>
      <img src="${ALTI_LOGO_BASE64}" alt="AlTi Logo" class="header-logo">
    </div>
  `;
}

function renderPageFooter(benchmarkName: string, colors: ThemeColors, heatmapPage: boolean = false): string {
  if (heatmapPage) {
    return `
      <div class="page-footer" style="justify-content: center;">
        <div class="performance-legend">
          <div class="performance-item">
            <div class="performance-dot strong"></div>
            <span>Better than or at benchmark</span>
          </div>
          <div class="performance-item">
            <div class="performance-dot on-track"></div>
            <span>Within range of benchmark</span>
          </div>
          <div class="performance-item">
            <div class="performance-dot focus"></div>
            <span>Materially below benchmark</span>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="page-footer">
      <div class="page-legend">
        <div class="legend-item">
          <div class="legend-dot portfolio-dot"></div>
          Portfolio
        </div>
        <div class="legend-item">
          <div class="legend-dot benchmark-dot"></div>
          ${benchmarkName}
        </div>
      </div>
      <div class="performance-legend">
        <div class="performance-item">
          <div class="performance-dot strong"></div>
          <span>Better than benchmark</span>
        </div>
        <div class="performance-item">
          <div class="performance-dot on-track"></div>
          <span>Within range</span>
        </div>
        <div class="performance-item">
          <div class="performance-dot focus"></div>
          <span>Below benchmark</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// Page 1: Climate Impact & Performance
// ============================================================================

function renderClimatePage(
  data: ReportData,
  charts: ReportCharts,
  config: ReportConfig,
  colors: ThemeColors
): string {
  return `
    <div class="page">
      ${renderPageHeader(data.client_name, 'Climate Impact & Performance', config.reportYear)}

      <div class="category-description" style="margin-top: 15px;">
        <h3>Decarbonization & Temperature Alignment</h3>
        <p>This section evaluates your portfolio's climate impact through temperature alignment and financed emissions metrics. Temperature ratings assess how closely your investments align with Paris Agreement goals, while financed intensity metrics measure direct and indirect emissions per investment dollar, helping you understand your portfolio's carbon footprint and climate risk exposure.</p>
      </div>

      <div class="climate-charts-wrapper">
        <div class="chart-row">
          <div class="chart-half">
            <div class="chart-container">
              <img src="${charts.climateScope12}" alt="Climate Scope 1+2 Chart">
            </div>
          </div>
          <div class="chart-half">
            <div class="chart-container">
              <img src="${charts.climateScope3}" alt="Climate Scope 3 Chart">
            </div>
          </div>
        </div>

        <div class="chart-row">
          <div class="chart-half">
            <div class="chart-container">
              <img src="${charts.climatePerformanceEnv}" alt="Environmental Performance Chart">
            </div>
          </div>
          <div class="chart-half">
            <div class="chart-container">
              <img src="${charts.climatePerformanceTemp}" alt="Temperature Alignment Chart">
            </div>
          </div>
        </div>
      </div>

      ${renderPageFooter(config.benchmarkName, colors)}
    </div>
  `;
}

// ============================================================================
// Page 2: Natural Capital & Biodiversity
// ============================================================================

function renderNaturalCapitalPage(
  data: ReportData,
  charts: ReportCharts,
  config: ReportConfig,
  colors: ThemeColors
): string {
  return `
    <div class="page">
      ${renderPageHeader(data.client_name, 'Natural Capital & Biodiversity', config.reportYear)}

      <div class="category-description" style="margin-top: 15px;">
        <h3>Ecosystem Impact</h3>
        <p>This section evaluates your portfolio's impact on natural resources and biodiversity. Land use and biodiversity metrics assess exposure to deforestation and habitat risks, while water and waste recycling ratios measure resource efficiency and circular economy practices.</p>
      </div>

      <div class="chart-container" style="margin-top: 25px; margin-bottom: 20px; max-height: 200px;">
        <img src="${charts.naturalCapital}" alt="Natural Capital Chart" style="max-height: 190px;">
      </div>

      <div class="donut-section" style="margin-top: 35px;">
        <div class="metric-card">
          <div class="metric-title">
            Water Recycled Ratio
            <span class="metric-unit">%</span>
          </div>
          <div class="donut-chart-container">
            <img src="${charts.waterRecycled}" alt="Water Recycled Chart">
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-title">
            Waste Recycling Ratio
            <span class="metric-unit">%</span>
          </div>
          <div class="donut-chart-container">
            <img src="${charts.wasteRecycled}" alt="Waste Recycled Chart">
          </div>
        </div>
      </div>

      ${renderPageFooter(config.benchmarkName, colors)}
    </div>
  `;
}

// ============================================================================
// Page 3: Social Impact & Governance
// ============================================================================

function renderSocialGovernancePage(
  data: ReportData,
  charts: ReportCharts,
  config: ReportConfig,
  colors: ThemeColors
): string {
  return `
    <div class="page">
      ${renderPageHeader(data.client_name, 'Social Impact & Governance', config.reportYear)}

      <div class="description-row" style="margin-top: 15px;">
        <div class="category-description half-width">
          <h3>Human Capital</h3>
          <p>This section measures your portfolio's social performance including labor rights, human rights, and community relations. Gender pay gap and board diversity metrics assess equity and inclusion practices, while diversity targets evaluate forward-looking inclusion commitments.</p>
        </div>
        <div class="category-description half-width">
          <h3>Business Ethics</h3>
          <p>This section evaluates governance quality through board independence, transparency, and anti-corruption measures. Board composition metrics assess oversight effectiveness and independence, while anti-bribery scores evaluate corruption risk management.</p>
        </div>
      </div>

      <div class="chart-row" style="margin-top: 35px;">
        <div class="chart-half">
          <div class="chart-container">
            <img src="${charts.humanCapital}" alt="Human Capital Chart">
          </div>
        </div>
        <div class="chart-half">
          <div class="chart-container">
            <img src="${charts.businessEthics}" alt="Business Ethics Chart">
          </div>
        </div>
      </div>

      ${renderPageFooter(config.benchmarkName, colors)}
    </div>
  `;
}

// ============================================================================
// Page 4: Cumulative Impact Performance (5x4 Heatmap Matrix)
// ============================================================================

function renderHeatmapPage(
  data: ReportData,
  config: ReportConfig,
  colors: ThemeColors
): string {
  const m = data.metrics;
  const b = data.benchmark;

  // Calculate performance for each metric
  const getPerformanceClass = (value: number, benchmark: number, lowerBetter: boolean): string => {
    if (lowerBetter) {
      if (value <= benchmark) return 'strong';
      if (value <= benchmark * 1.15) return 'on-track';
      return 'focus';
    } else {
      if (value >= benchmark) return 'strong';
      if (value >= benchmark * 0.85) return 'on-track';
      return 'focus';
    }
  };

  // Group metrics by category (columns) and row (4 per column)
  const categories = ['Climate', 'Environment', 'Social', 'Governance', 'Resources'] as const;
  const metricsByCategory: Record<string, HeatmapMetric[]> = {};

  categories.forEach(cat => {
    metricsByCategory[cat] = HEATMAP_METRICS.filter(metric => metric.category === cat);
  });

  // Build heatmap cells (row by row, 5 columns each)
  let heatmapCells = '';
  let strongCount = 0;
  let onTrackCount = 0;
  let focusCount = 0;

  for (let row = 0; row < 4; row++) {
    for (const cat of categories) {
      const metric = metricsByCategory[cat][row];
      if (metric) {
        const value = metric.getValue(m);
        const benchmark = metric.getBenchmark(b);
        const perfClass = getPerformanceClass(value, benchmark, metric.lowerBetter);

        if (perfClass === 'strong') strongCount++;
        else if (perfClass === 'on-track') onTrackCount++;
        else focusCount++;

        heatmapCells += `
          <div class="heatmap-cell ${perfClass}">
            <div class="heatmap-metric">${metric.name}</div>
            <div class="heatmap-value">${metric.format(value)}</div>
          </div>
        `;
      } else {
        heatmapCells += `<div class="heatmap-cell" style="background: #f0f0f0;"></div>`;
      }
    }
  }

  return `
    <div class="page">
      ${renderPageHeader(data.client_name, 'Cumulative Impact Performance', config.reportYear)}

      <div class="category-description" style="margin-top: 15px;">
        <h3>Materiality Assessment Matrix</h3>
        <p>This comprehensive overview visualizes your portfolio's performance across all 20 key ESG metrics, organized by category. Each metric is color-coded to show performance relative to benchmarks, providing an at-a-glance assessment of strengths and opportunities.</p>
      </div>

      <div class="heatmap-container">
        <div class="heatmap-headers">
          <div class="heatmap-header">Climate</div>
          <div class="heatmap-header">Environment</div>
          <div class="heatmap-header">Social</div>
          <div class="heatmap-header">Governance</div>
          <div class="heatmap-header">Resources</div>
        </div>
        <div class="heatmap-grid">
          ${heatmapCells}
        </div>
      </div>

      <div class="summary-boxes">
        <div class="summary-box strong">
          <div class="summary-content">
            <div class="summary-title">Outperforming</div>
            <div class="summary-count">${strongCount}</div>
          </div>
        </div>
        <div class="summary-box on-track">
          <div class="summary-content">
            <div class="summary-title">Aligned</div>
            <div class="summary-count">${onTrackCount}</div>
          </div>
        </div>
        <div class="summary-box focus">
          <div class="summary-content">
            <div class="summary-title">Underperforming</div>
            <div class="summary-count">${focusCount}</div>
          </div>
        </div>
      </div>

      ${renderPageFooter(config.benchmarkName, colors, true)}
    </div>
  `;
}

// ============================================================================
// Main Template Generator
// ============================================================================

export function generateReportHTML(
  data: ReportData,
  charts: ReportCharts
): string {
  const colors = { ...DEFAULT_THEME, ...data.theme_colors };
  const config = { ...DEFAULT_CONFIG, ...data.config };

  const pages: string[] = [];

  if (config.includeClimate) {
    pages.push(renderClimatePage(data, charts, config, colors));
  }

  if (config.includeNaturalCapital) {
    pages.push(renderNaturalCapitalPage(data, charts, config, colors));
  }

  if (config.includeSocial || config.includeGovernance) {
    pages.push(renderSocialGovernancePage(data, charts, config, colors));
  }

  if (config.includeHeatmap) {
    pages.push(renderHeatmapPage(data, config, colors));
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ESG Impact Report - ${data.client_name}</title>
      <style>${getStyles(colors)}</style>
    </head>
    <body>
      <div class="container">
        ${pages.join('\n')}
      </div>
    </body>
    </html>
  `;
}
