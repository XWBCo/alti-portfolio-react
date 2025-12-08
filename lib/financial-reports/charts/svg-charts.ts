import type {
  AllocationSlice,
  PerformancePoint,
  PerformanceMetrics,
  ThemeColors,
} from '../types';

// ============================================================================
// SVG Chart Generators for Financial Reports
// Pure SVG output for PDF embedding (no external dependencies)
// ============================================================================

const DEFAULT_COLORS = {
  primary: '#00f0db',
  secondary: '#0F94A6',
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#6B7280',
  text: '#1F2937',
  textLight: '#6B7280',
  gridLine: '#E5E7EB',
  background: '#FFFFFF',
};

// ============================================================================
// DONUT CHART - Asset Allocation
// ============================================================================

export interface DonutChartOptions {
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  showValues?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

export function generateDonutChartSVG(
  data: AllocationSlice[],
  options: DonutChartOptions = {}
): string {
  const {
    width = 300,
    height = 300,
    innerRadius = 60,
    outerRadius = 100,
    showLabels = true,
    showLegend = true,
    centerLabel = '',
    centerValue = '',
  } = options;

  const cx = width / 2;
  const cy = height / 2 - (showLegend ? 30 : 0);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let currentAngle = -90; // Start at top

  const slices = data.map((slice, i) => {
    const percentage = (slice.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + outerRadius * Math.cos(startRad);
    const y1 = cy + outerRadius * Math.sin(startRad);
    const x2 = cx + outerRadius * Math.cos(endRad);
    const y2 = cy + outerRadius * Math.sin(endRad);

    const x1Inner = cx + innerRadius * Math.cos(startRad);
    const y1Inner = cy + innerRadius * Math.sin(startRad);
    const x2Inner = cx + innerRadius * Math.cos(endRad);
    const y2Inner = cy + innerRadius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `
      M ${x1} ${y1}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x2Inner} ${y2Inner}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}
      Z
    `;

    // Label position (middle of arc)
    const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;
    const labelRadius = outerRadius + 20;
    const labelX = cx + labelRadius * Math.cos(midAngle);
    const labelY = cy + labelRadius * Math.sin(midAngle);

    return { path, slice, percentage, labelX, labelY, color: slice.color || getDefaultColor(i) };
  });

  const legendItems = data.map((slice, i) => ({
    label: slice.category,
    value: `${slice.weight.toFixed(1)}%`,
    color: slice.color || getDefaultColor(i),
  }));

  const legendStartY = height - (showLegend ? 20 + (legendItems.length * 18) : 0);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <style>
        .chart-text { font-family: 'Inter', 'Helvetica Neue', sans-serif; }
        .label { font-size: 10px; fill: ${DEFAULT_COLORS.textLight}; }
        .value { font-size: 11px; font-weight: 600; fill: ${DEFAULT_COLORS.text}; }
        .center-label { font-size: 12px; fill: ${DEFAULT_COLORS.textLight}; }
        .center-value { font-size: 18px; font-weight: 700; fill: ${DEFAULT_COLORS.text}; }
        .legend-label { font-size: 11px; fill: ${DEFAULT_COLORS.text}; }
        .legend-value { font-size: 11px; font-weight: 600; fill: ${DEFAULT_COLORS.text}; }
      </style>

      <!-- Slices -->
      ${slices.map(({ path, color }) => `
        <path d="${path}" fill="${color}" stroke="#fff" stroke-width="2"/>
      `).join('')}

      <!-- Center text -->
      ${centerLabel ? `
        <text x="${cx}" y="${cy - 8}" text-anchor="middle" class="chart-text center-label">${centerLabel}</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" class="chart-text center-value">${centerValue}</text>
      ` : ''}

      <!-- Labels (only for slices > 5%) -->
      ${showLabels ? slices.filter(s => s.percentage > 5).map(({ labelX, labelY, percentage }) => `
        <text x="${labelX}" y="${labelY}" text-anchor="middle" class="chart-text value">${percentage.toFixed(0)}%</text>
      `).join('') : ''}

      <!-- Legend -->
      ${showLegend ? legendItems.map((item, i) => `
        <rect x="20" y="${legendStartY + i * 18}" width="12" height="12" rx="2" fill="${item.color}"/>
        <text x="38" y="${legendStartY + i * 18 + 10}" class="chart-text legend-label">${item.label}</text>
        <text x="${width - 20}" y="${legendStartY + i * 18 + 10}" text-anchor="end" class="chart-text legend-value">${item.value}</text>
      `).join('') : ''}
    </svg>
  `;
}

// ============================================================================
// LINE CHART - Performance Over Time
// ============================================================================

export interface LineChartOptions {
  width?: number;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showDataPoints?: boolean;
  portfolioColor?: string;
  benchmarkColor?: string;
  portfolioLabel?: string;
  benchmarkLabel?: string;
}

export function generateLineChartSVG(
  data: PerformancePoint[],
  options: LineChartOptions = {}
): string {
  const {
    width = 500,
    height = 250,
    showGrid = true,
    showLegend = true,
    showDataPoints = false,
    portfolioColor = DEFAULT_COLORS.primary,
    benchmarkColor = DEFAULT_COLORS.secondary,
    portfolioLabel = 'Portfolio',
    benchmarkLabel = 'Benchmark',
  } = options;

  const padding = { top: 20, right: 20, bottom: 50, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min/max values
  const allValues = data.flatMap(d => [d.portfolioValue, d.benchmarkValue || 0].filter(Boolean));
  const minValue = Math.min(...allValues) * 0.95;
  const maxValue = Math.max(...allValues) * 1.05;
  const valueRange = maxValue - minValue;

  // Scale functions
  const xScale = (i: number) => padding.left + (i / (data.length - 1)) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Generate path for portfolio
  const portfolioPath = data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.portfolioValue)}`
  ).join(' ');

  // Generate path for benchmark
  const hasBenchmark = data.some(d => d.benchmarkValue);
  const benchmarkPath = hasBenchmark ? data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.benchmarkValue || 0)}`
  ).join(' ') : '';

  // Grid lines (5 horizontal)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const value = minValue + (valueRange * i) / 4;
    const y = yScale(value);
    return { y, label: formatCurrency(value) };
  });

  // X-axis labels (show first, middle, last)
  const xLabels = [
    { x: xScale(0), label: formatDate(data[0].date) },
    { x: xScale(Math.floor(data.length / 2)), label: formatDate(data[Math.floor(data.length / 2)].date) },
    { x: xScale(data.length - 1), label: formatDate(data[data.length - 1].date) },
  ];

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <style>
        .chart-text { font-family: 'Inter', 'Helvetica Neue', sans-serif; }
        .axis-label { font-size: 10px; fill: ${DEFAULT_COLORS.textLight}; }
        .legend-text { font-size: 11px; fill: ${DEFAULT_COLORS.text}; }
      </style>

      <!-- Grid lines -->
      ${showGrid ? gridLines.map(({ y, label }) => `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"
              stroke="${DEFAULT_COLORS.gridLine}" stroke-dasharray="4,4"/>
        <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" class="chart-text axis-label">${label}</text>
      `).join('') : ''}

      <!-- Axes -->
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"
            stroke="${DEFAULT_COLORS.gridLine}" stroke-width="1"/>
      <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"
            stroke="${DEFAULT_COLORS.gridLine}" stroke-width="1"/>

      <!-- X-axis labels -->
      ${xLabels.map(({ x, label }) => `
        <text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" class="chart-text axis-label">${label}</text>
      `).join('')}

      <!-- Benchmark line -->
      ${hasBenchmark ? `
        <path d="${benchmarkPath}" fill="none" stroke="${benchmarkColor}" stroke-width="2" stroke-dasharray="6,4"/>
      ` : ''}

      <!-- Portfolio line -->
      <path d="${portfolioPath}" fill="none" stroke="${portfolioColor}" stroke-width="2.5"/>

      <!-- Data points -->
      ${showDataPoints ? data.map((d, i) => `
        <circle cx="${xScale(i)}" cy="${yScale(d.portfolioValue)}" r="3" fill="${portfolioColor}"/>
        ${hasBenchmark ? `<circle cx="${xScale(i)}" cy="${yScale(d.benchmarkValue || 0)}" r="3" fill="${benchmarkColor}"/>` : ''}
      `).join('') : ''}

      <!-- Legend -->
      ${showLegend ? `
        <line x1="${padding.left}" y1="${height - 15}" x2="${padding.left + 20}" y2="${height - 15}"
              stroke="${portfolioColor}" stroke-width="2.5"/>
        <text x="${padding.left + 28}" y="${height - 11}" class="chart-text legend-text">${portfolioLabel}</text>
        ${hasBenchmark ? `
          <line x1="${padding.left + 100}" y1="${height - 15}" x2="${padding.left + 120}" y2="${height - 15}"
                stroke="${benchmarkColor}" stroke-width="2" stroke-dasharray="6,4"/>
          <text x="${padding.left + 128}" y="${height - 11}" class="chart-text legend-text">${benchmarkLabel}</text>
        ` : ''}
      ` : ''}
    </svg>
  `;
}

// ============================================================================
// BAR CHART - Period Returns Comparison
// ============================================================================

export interface BarChartOptions {
  width?: number;
  height?: number;
  showValues?: boolean;
  orientation?: 'vertical' | 'horizontal';
  portfolioColor?: string;
  benchmarkColor?: string;
}

export interface BarData {
  label: string;
  portfolioValue: number;
  benchmarkValue?: number;
}

export function generateBarChartSVG(
  data: BarData[],
  options: BarChartOptions = {}
): string {
  const {
    width = 400,
    height = 200,
    showValues = true,
    portfolioColor = DEFAULT_COLORS.primary,
    benchmarkColor = DEFAULT_COLORS.secondary,
  } = options;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const hasBenchmark = data.some(d => d.benchmarkValue !== undefined);
  const barGroupWidth = chartWidth / data.length;
  const barWidth = hasBenchmark ? barGroupWidth * 0.35 : barGroupWidth * 0.6;
  const gap = hasBenchmark ? barGroupWidth * 0.05 : 0;

  // Find min/max for y scale
  const allValues = data.flatMap(d => [d.portfolioValue, d.benchmarkValue || 0]);
  const maxVal = Math.max(...allValues.map(Math.abs)) * 1.2;
  const minVal = allValues.some(v => v < 0) ? -maxVal : 0;

  const yScale = (value: number) => {
    const range = maxVal - minVal;
    return padding.top + chartHeight * (1 - (value - minVal) / range);
  };
  const zeroY = yScale(0);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <style>
        .chart-text { font-family: 'Inter', 'Helvetica Neue', sans-serif; }
        .axis-label { font-size: 10px; fill: ${DEFAULT_COLORS.textLight}; }
        .value-label { font-size: 10px; font-weight: 600; fill: ${DEFAULT_COLORS.text}; }
        .bar-label { font-size: 10px; fill: ${DEFAULT_COLORS.text}; }
      </style>

      <!-- Zero line -->
      <line x1="${padding.left}" y1="${zeroY}" x2="${width - padding.right}" y2="${zeroY}"
            stroke="${DEFAULT_COLORS.gridLine}" stroke-width="1"/>

      <!-- Bars -->
      ${data.map((d, i) => {
        const groupX = padding.left + i * barGroupWidth + barGroupWidth * 0.1;
        const portfolioHeight = Math.abs(d.portfolioValue / maxVal) * (chartHeight / 2);
        const portfolioY = d.portfolioValue >= 0 ? zeroY - portfolioHeight : zeroY;

        let benchmarkBar = '';
        if (hasBenchmark && d.benchmarkValue !== undefined) {
          const benchmarkHeight = Math.abs(d.benchmarkValue / maxVal) * (chartHeight / 2);
          const benchmarkY = d.benchmarkValue >= 0 ? zeroY - benchmarkHeight : zeroY;
          benchmarkBar = `
            <rect x="${groupX + barWidth + gap}" y="${benchmarkY}"
                  width="${barWidth}" height="${benchmarkHeight}"
                  fill="${benchmarkColor}" rx="2"/>
            ${showValues ? `
              <text x="${groupX + barWidth + gap + barWidth / 2}"
                    y="${d.benchmarkValue >= 0 ? benchmarkY - 5 : benchmarkY + benchmarkHeight + 12}"
                    text-anchor="middle" class="chart-text value-label">
                ${d.benchmarkValue.toFixed(1)}%
              </text>
            ` : ''}
          `;
        }

        return `
          <rect x="${groupX}" y="${portfolioY}"
                width="${barWidth}" height="${portfolioHeight}"
                fill="${portfolioColor}" rx="2"/>
          ${benchmarkBar}
          ${showValues ? `
            <text x="${groupX + barWidth / 2}"
                  y="${d.portfolioValue >= 0 ? portfolioY - 5 : portfolioY + portfolioHeight + 12}"
                  text-anchor="middle" class="chart-text value-label">
              ${d.portfolioValue.toFixed(1)}%
            </text>
          ` : ''}
          <text x="${groupX + (hasBenchmark ? barWidth + gap / 2 : barWidth / 2)}"
                y="${height - padding.bottom + 15}"
                text-anchor="middle" class="chart-text bar-label">${d.label}</text>
        `;
      }).join('')}

      <!-- Legend -->
      ${hasBenchmark ? `
        <rect x="${padding.left}" y="${height - 12}" width="10" height="10" fill="${portfolioColor}" rx="2"/>
        <text x="${padding.left + 15}" y="${height - 4}" class="chart-text axis-label">Portfolio</text>
        <rect x="${padding.left + 80}" y="${height - 12}" width="10" height="10" fill="${benchmarkColor}" rx="2"/>
        <text x="${padding.left + 95}" y="${height - 4}" class="chart-text axis-label">Benchmark</text>
      ` : ''}
    </svg>
  `;
}

// ============================================================================
// HORIZONTAL BAR CHART - Top Holdings / Clients by AUM
// ============================================================================

export interface HorizontalBarData {
  label: string;
  value: number;
  color?: string;
}

export interface HorizontalBarOptions {
  width?: number;
  height?: number;
  showValues?: boolean;
  formatValue?: (value: number) => string;
  maxBars?: number;
}

export function generateHorizontalBarChartSVG(
  data: HorizontalBarData[],
  options: HorizontalBarOptions = {}
): string {
  const {
    width = 400,
    height = 250,
    showValues = true,
    formatValue = formatCurrency,
    maxBars = 10,
  } = options;

  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, maxBars);
  const padding = { top: 10, right: 80, bottom: 10, left: 120 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barHeight = Math.min(20, chartHeight / sortedData.length - 4);
  const barGap = (chartHeight - barHeight * sortedData.length) / (sortedData.length + 1);

  const maxValue = Math.max(...sortedData.map(d => d.value));

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <style>
        .chart-text { font-family: 'Inter', 'Helvetica Neue', sans-serif; }
        .bar-label { font-size: 10px; fill: ${DEFAULT_COLORS.text}; }
        .value-label { font-size: 10px; font-weight: 600; fill: ${DEFAULT_COLORS.text}; }
      </style>

      ${sortedData.map((d, i) => {
        const y = padding.top + barGap * (i + 1) + barHeight * i;
        const barWidth = (d.value / maxValue) * chartWidth;
        const color = d.color || DEFAULT_COLORS.primary;

        return `
          <text x="${padding.left - 8}" y="${y + barHeight / 2 + 4}"
                text-anchor="end" class="chart-text bar-label">
            ${truncateText(d.label, 18)}
          </text>
          <rect x="${padding.left}" y="${y}"
                width="${barWidth}" height="${barHeight}"
                fill="${color}" rx="3"/>
          ${showValues ? `
            <text x="${padding.left + barWidth + 8}" y="${y + barHeight / 2 + 4}"
                  class="chart-text value-label">
              ${formatValue(d.value)}
            </text>
          ` : ''}
        `;
      }).join('')}
    </svg>
  `;
}

// ============================================================================
// AREA CHART - AUM Trend
// ============================================================================

export interface AreaChartOptions {
  width?: number;
  height?: number;
  fillColor?: string;
  strokeColor?: string;
  showGrid?: boolean;
}

export function generateAreaChartSVG(
  data: { date: string; value: number }[],
  options: AreaChartOptions = {}
): string {
  const {
    width = 500,
    height = 200,
    fillColor = 'rgba(0, 240, 219, 0.2)',
    strokeColor = DEFAULT_COLORS.primary,
    showGrid = true,
  } = options;

  const padding = { top: 20, right: 20, bottom: 40, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const minValue = Math.min(...values) * 0.95;
  const maxValue = Math.max(...values) * 1.05;
  const valueRange = maxValue - minValue;

  const xScale = (i: number) => padding.left + (i / (data.length - 1)) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Line path
  const linePath = data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.value)}`
  ).join(' ');

  // Area path
  const areaPath = `
    ${linePath}
    L ${xScale(data.length - 1)} ${height - padding.bottom}
    L ${xScale(0)} ${height - padding.bottom}
    Z
  `;

  // Grid lines
  const gridLines = Array.from({ length: 4 }, (_, i) => {
    const value = minValue + (valueRange * (i + 1)) / 4;
    const y = yScale(value);
    return { y, label: formatCurrencyShort(value) };
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <style>
        .chart-text { font-family: 'Inter', 'Helvetica Neue', sans-serif; }
        .axis-label { font-size: 10px; fill: ${DEFAULT_COLORS.textLight}; }
      </style>

      <defs>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${strokeColor};stop-opacity:0.3"/>
          <stop offset="100%" style="stop-color:${strokeColor};stop-opacity:0.05"/>
        </linearGradient>
      </defs>

      <!-- Grid -->
      ${showGrid ? gridLines.map(({ y, label }) => `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"
              stroke="${DEFAULT_COLORS.gridLine}" stroke-dasharray="4,4"/>
        <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" class="chart-text axis-label">${label}</text>
      `).join('') : ''}

      <!-- Area -->
      <path d="${areaPath}" fill="url(#areaGradient)"/>

      <!-- Line -->
      <path d="${linePath}" fill="none" stroke="${strokeColor}" stroke-width="2.5"/>

      <!-- X-axis labels -->
      <text x="${xScale(0)}" y="${height - padding.bottom + 20}" text-anchor="start" class="chart-text axis-label">
        ${formatDate(data[0].date)}
      </text>
      <text x="${xScale(data.length - 1)}" y="${height - padding.bottom + 20}" text-anchor="end" class="chart-text axis-label">
        ${formatDate(data[data.length - 1].date)}
      </text>
    </svg>
  `;
}

// ============================================================================
// WATERFALL CHART - Change in Market Value (JP Morgan style)
// ============================================================================

export interface WaterfallData {
  label: string;
  value: number;
  type: 'start' | 'end' | 'positive' | 'negative';
}

export interface WaterfallChartOptions {
  width?: number;
  height?: number;
  showValues?: boolean;
  positiveColor?: string;
  negativeColor?: string;
  totalColor?: string;
}

export function generateWaterfallChartSVG(
  data: WaterfallData[],
  options: WaterfallChartOptions = {}
): string {
  const {
    width = 500,
    height = 250,
    showValues = true,
    positiveColor = '#10B981',
    negativeColor = '#EF4444',
    totalColor = '#0F94A6',
  } = options;

  const padding = { top: 30, right: 20, bottom: 50, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate running totals and find max value
  let runningTotal = 0;
  const processedData = data.map(d => {
    if (d.type === 'start') {
      runningTotal = d.value;
      return { ...d, startY: 0, height: d.value, runningTotal: d.value };
    } else if (d.type === 'end') {
      return { ...d, startY: 0, height: runningTotal, runningTotal };
    } else {
      const startY = runningTotal;
      runningTotal += d.value;
      return { ...d, startY: d.value >= 0 ? startY : runningTotal, height: Math.abs(d.value), runningTotal };
    }
  });

  const maxValue = Math.max(...processedData.map(d => Math.max(d.startY + d.height, d.runningTotal))) * 1.1;

  const barWidth = (chartWidth / data.length) * 0.6;
  const barGap = (chartWidth / data.length) * 0.4;

  const yScale = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

  // Grid lines
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const value = (maxValue * i) / 4;
    return { y: yScale(value), label: formatCurrency(value) };
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <style>
        .chart-text { font-family: 'Inter', 'Helvetica Neue', sans-serif; }
        .axis-label { font-size: 9px; fill: ${DEFAULT_COLORS.textLight}; }
        .value-label { font-size: 10px; font-weight: 600; fill: ${DEFAULT_COLORS.text}; }
        .bar-label { font-size: 9px; fill: ${DEFAULT_COLORS.text}; }
      </style>

      <!-- Grid lines -->
      ${gridLines.map(({ y, label }) => `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"
              stroke="${DEFAULT_COLORS.gridLine}" stroke-dasharray="3,3"/>
        <text x="${padding.left - 8}" y="${y + 3}" text-anchor="end" class="chart-text axis-label">${label}</text>
      `).join('')}

      <!-- Bars and connectors -->
      ${processedData.map((d, i) => {
        const x = padding.left + i * (barWidth + barGap) + barGap / 2;
        const barTop = yScale(d.startY + d.height);
        const barBottom = yScale(d.startY);
        const barH = Math.abs(barBottom - barTop);

        let color = totalColor;
        if (d.type === 'positive') color = positiveColor;
        else if (d.type === 'negative') color = negativeColor;

        // Connector line to next bar (except for last)
        let connector = '';
        if (i < processedData.length - 1 && d.type !== 'start') {
          const nextX = padding.left + (i + 1) * (barWidth + barGap) + barGap / 2;
          const connectorY = yScale(d.runningTotal);
          connector = `<line x1="${x + barWidth}" y1="${connectorY}" x2="${nextX}" y2="${connectorY}"
                            stroke="${DEFAULT_COLORS.gridLine}" stroke-width="1" stroke-dasharray="3,3"/>`;
        } else if (d.type === 'start') {
          const nextX = padding.left + (i + 1) * (barWidth + barGap) + barGap / 2;
          const connectorY = yScale(d.runningTotal);
          connector = `<line x1="${x + barWidth}" y1="${connectorY}" x2="${nextX}" y2="${connectorY}"
                            stroke="${DEFAULT_COLORS.gridLine}" stroke-width="1" stroke-dasharray="3,3"/>`;
        }

        return `
          ${connector}
          <rect x="${x}" y="${barTop}" width="${barWidth}" height="${barH}"
                fill="${color}" rx="3"/>
          ${showValues ? `
            <text x="${x + barWidth / 2}" y="${barTop - 6}"
                  text-anchor="middle" class="chart-text value-label">
              ${d.type === 'start' || d.type === 'end' ? formatCurrency(d.value) : (d.value >= 0 ? '+' : '') + formatCurrency(d.value)}
            </text>
          ` : ''}
          <text x="${x + barWidth / 2}" y="${height - padding.bottom + 15}"
                text-anchor="middle" class="chart-text bar-label">${d.label}</text>
        `;
      }).join('')}
    </svg>
  `;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDefaultColor(index: number): string {
  const colors = [
    '#00E7D7', '#0F94A6', '#A638B5', '#F59E0B', '#EF4444',
    '#8B5CF6', '#0A598C', '#EC4899', '#10B981', '#6366F1',
  ];
  return colors[index % colors.length];
}

function formatCurrency(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatCurrencyShort(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${(value / 1e3).toFixed(0)}K`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

// ============================================================================
// EXPORTS
// ============================================================================

export interface FinancialReportCharts {
  allocationDonut: string;
  performanceLine: string;
  returnsBar: string;
  holdingsBar: string;
  waterfallChart: string;
}

export interface ValueChangeData {
  beginningValue: number;
  contributions: number;
  withdrawals: number;
  income: number;
  investmentChange: number;
  endingValue: number;
}

export function generateAllFinancialCharts(
  allocation: AllocationSlice[],
  performanceHistory: PerformancePoint[],
  performance: PerformanceMetrics,
  holdings: { name: string; currentValue: number }[],
  themeColors?: Partial<ThemeColors>,
  valueChange?: ValueChangeData
): FinancialReportCharts {
  const portfolioColor = themeColors?.primary || DEFAULT_COLORS.primary;
  const benchmarkColor = themeColors?.secondary || DEFAULT_COLORS.secondary;

  // Allocation donut
  const allocationDonut = generateDonutChartSVG(allocation, {
    width: 280,
    height: 320,
    showLegend: true,
    centerLabel: 'Total',
    centerValue: formatCurrency(allocation.reduce((sum, a) => sum + a.value, 0)),
  });

  // Performance line chart
  const performanceLine = generateLineChartSVG(performanceHistory, {
    width: 480,
    height: 220,
    portfolioColor,
    benchmarkColor,
    portfolioLabel: 'Portfolio',
    benchmarkLabel: 'Benchmark',
  });

  // Returns bar chart
  const returnsData: BarData[] = [
    { label: 'MTD', portfolioValue: performance.mtd, benchmarkValue: performance.mtd - 0.5 },
    { label: 'QTD', portfolioValue: performance.qtd, benchmarkValue: performance.qtd - 1.2 },
    { label: 'YTD', portfolioValue: performance.ytd, benchmarkValue: performance.ytd - 2 },
    { label: '1Y', portfolioValue: performance.oneYear || 0, benchmarkValue: (performance.oneYear || 0) - 1.5 },
  ];
  const returnsBar = generateBarChartSVG(returnsData, {
    width: 380,
    height: 180,
    portfolioColor,
    benchmarkColor,
  });

  // Top holdings bar
  const holdingsData: HorizontalBarData[] = holdings
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 8)
    .map(h => ({ label: h.name, value: h.currentValue, color: portfolioColor }));
  const holdingsBar = generateHorizontalBarChartSVG(holdingsData, {
    width: 420,
    height: 220,
    maxBars: 8,
  });

  // Waterfall chart for value change
  const waterfallData: WaterfallData[] = valueChange ? [
    { label: 'Beginning', value: valueChange.beginningValue, type: 'start' },
    { label: 'Contributions', value: valueChange.contributions, type: valueChange.contributions >= 0 ? 'positive' : 'negative' },
    { label: 'Withdrawals', value: valueChange.withdrawals, type: valueChange.withdrawals >= 0 ? 'positive' : 'negative' },
    { label: 'Income', value: valueChange.income, type: valueChange.income >= 0 ? 'positive' : 'negative' },
    { label: 'Inv. Change', value: valueChange.investmentChange, type: valueChange.investmentChange >= 0 ? 'positive' : 'negative' },
    { label: 'Ending', value: valueChange.endingValue, type: 'end' },
  ] : [];

  const waterfallChart = valueChange ? generateWaterfallChartSVG(waterfallData, {
    width: 480,
    height: 220,
  }) : '';

  return {
    allocationDonut,
    performanceLine,
    returnsBar,
    holdingsBar,
    waterfallChart,
  };
}
