import type { ThemeColors, PortfolioMetrics, BenchmarkMetrics } from './types';

// ============================================================================
// SVG Chart Generation - No external dependencies
// Pure SVG charts for server-side rendering matching Chart.js styling
// ============================================================================

const SVG_WIDTH = 420;
const SVG_HEIGHT = 155;
const PADDING_LEFT = 25;
const PADDING_RIGHT = 5;
const PADDING_TOP = 8;
const PADDING_BOTTOM = 38;

// ============================================================================
// Utility Functions
// ============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Determine performance color based on metric comparison
function getPerformanceColor(
  portfolioValue: number,
  benchmarkValue: number,
  isLowerBetter: boolean,
  colors: ThemeColors
): string {
  if (isLowerBetter) {
    // For metrics where lower is better (e.g., emissions, temperature)
    if (portfolioValue <= benchmarkValue) {
      return colors.strongColor; // Purple - better than benchmark
    } else if (portfolioValue <= benchmarkValue * 1.15) {
      return colors.onTrackColor; // Blue - within 15%
    } else {
      return colors.focusColor; // Yellow - above 15%
    }
  } else {
    // For metrics where higher is better (e.g., scores)
    if (portfolioValue >= benchmarkValue) {
      return colors.strongColor; // Purple - better than benchmark
    } else if (portfolioValue >= benchmarkValue * 0.85) {
      return colors.onTrackColor; // Blue - within 15%
    } else {
      return colors.focusColor; // Yellow - below 15%
    }
  }
}

// Check if metric name indicates lower is better
function isLowerBetterMetric(metricName: string): boolean {
  const lowerName = metricName.toLowerCase();
  return lowerName.includes('scope') ||
         lowerName.includes('temp') ||
         lowerName.includes('intensity') ||
         lowerName.includes('gap') ||
         lowerName.includes('carbon') ||
         lowerName.includes('financed');
}

// Unit map for metric labels
function getMetricUnit(metricName: string): string {
  const unitMap: Record<string, string> = {
    'Temp Rating Scope 1+2': '/3°C',
    'Temp Rating Scope 3': '/3°C',
    'Temp 1+2': '/3°C',
    'Temp 3': '/3°C',
    'Financed Intensity Scope 1+2': 'tCO2e/$M',
    'Financed Intensity Scope 3': 'tCO2e/$M',
    'Financed Int.': 'tCO2e/$M',
    'Carbon Intensity Scope 1+2': 'tCO2e/$M',
    'Carbon Intensity Scope 3': 'tCO2e/$M',
    'Carbon Int.': 'tCO2e/$M',
    'Environmental Score': '/100',
    'Env Score': '/100',
    'Social Score': '/100',
    'Governance Score': '/100',
    'Net Zero Target': '/100',
    'Gender Pay Gap': '%',
    'Female Board Members': '%',
    'Female Board %': '%',
    'Diversity Targets': '/100',
    'Non-Executive Board': '%',
    'Non-Exec %': '%',
    'Independent Board': '%',
    'Independent %': '%',
    'Anti-Bribery Score': '/100',
    'Anti-Bribery': '/100',
    'Land Use & Biodiversity': '/100',
    'Land Use & Bio': '/100',
    'Biodiversity Reduction': '/100',
    'Biodiversity Red.': '/100',
    'Water Recycled Ratio': '%',
    'Waste Recycling Ratio': '%'
  };
  return unitMap[metricName] || '';
}

// Calculate dynamic Y-axis scale with nice round numbers
function calculateDynamicScale(values: number[]): { max: number; stepSize: number } {
  const maxValue = Math.max(...values);
  const maxWithBuffer = maxValue * 1.15;

  let axisMax: number;
  let stepSize: number;

  if (maxWithBuffer <= 5) {
    axisMax = Math.ceil(maxWithBuffer);
    stepSize = 1;
  } else if (maxWithBuffer <= 10) {
    axisMax = Math.ceil(maxWithBuffer / 2) * 2;
    stepSize = 2;
  } else if (maxWithBuffer <= 50) {
    axisMax = Math.ceil(maxWithBuffer / 10) * 10;
    stepSize = 10;
  } else if (maxWithBuffer <= 100) {
    axisMax = Math.ceil(maxWithBuffer / 20) * 20;
    stepSize = 20;
  } else if (maxWithBuffer <= 200) {
    axisMax = Math.ceil(maxWithBuffer / 40) * 40;
    stepSize = 40;
  } else if (maxWithBuffer <= 500) {
    axisMax = Math.ceil(maxWithBuffer / 100) * 100;
    stepSize = 100;
  } else if (maxWithBuffer <= 1000) {
    axisMax = Math.ceil(maxWithBuffer / 200) * 200;
    stepSize = 200;
  } else if (maxWithBuffer <= 2000) {
    axisMax = Math.ceil(maxWithBuffer / 400) * 400;
    stepSize = 400;
  } else {
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxWithBuffer)));
    axisMax = Math.ceil(maxWithBuffer / magnitude) * magnitude;
    stepSize = axisMax / 5;
  }

  return { max: axisMax, stepSize };
}

// ============================================================================
// Vertical Bar Chart Generator (Chart.js style)
// ============================================================================

interface BarChartOptions {
  title: string;
  labels: string[];
  portfolioData: number[];
  benchmarkData: number[];
  colors: ThemeColors;
  unit?: string;
  metricNames?: string[]; // For determining if lower is better and units
  yAxisMax?: number;
  yAxisStep?: number;
  svgWidth?: number; // Custom SVG width for wider charts
}

export function generateBarChartSVG(options: BarChartOptions): string {
  const { title, labels, portfolioData, benchmarkData, colors, unit = '', metricNames, yAxisMax, yAxisStep, svgWidth } = options;

  const width = svgWidth || SVG_WIDTH;
  const chartLeft = PADDING_LEFT;
  const chartRight = width - PADDING_RIGHT;
  const chartTop = PADDING_TOP + 5;
  const chartBottom = SVG_HEIGHT - PADDING_BOTTOM;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Calculate Y-axis scale
  const allValues = [...portfolioData, ...benchmarkData];
  let maxValue: number;
  let stepSize: number;

  if (yAxisMax !== undefined && yAxisStep !== undefined) {
    maxValue = yAxisMax;
    stepSize = yAxisStep;
  } else {
    const scale = calculateDynamicScale(allValues);
    maxValue = scale.max;
    stepSize = scale.stepSize;
  }

  const barGroupWidth = chartWidth / labels.length;
  const barWidth = barGroupWidth * 0.28;
  const barGap = barGroupWidth * 0.08;
  const groupPadding = barGroupWidth * 0.18;

  let bars = '';
  let valueLabels = '';
  let axisLabels = '';

  labels.forEach((label, i) => {
    const groupX = chartLeft + i * barGroupWidth + groupPadding;
    const isLower = metricNames ? isLowerBetterMetric(metricNames[i]) : isLowerBetterMetric(label);
    const metricUnit = metricNames ? getMetricUnit(metricNames[i]) : getMetricUnit(label);

    // Portfolio bar
    const pHeight = Math.max(3, (portfolioData[i] / maxValue) * chartHeight);
    const pY = chartBottom - pHeight;
    bars += `<rect x="${groupX}" y="${pY}" width="${barWidth}" height="${pHeight}" fill="${colors.portfolioColor}" rx="2" ry="2"/>`;

    // Benchmark bar
    const bHeight = Math.max(3, (benchmarkData[i] / maxValue) * chartHeight);
    const bY = chartBottom - bHeight;
    const bX = groupX + barWidth + barGap;
    bars += `<rect x="${bX}" y="${bY}" width="${barWidth}" height="${bHeight}" fill="${colors.benchmarkColor}" rx="2" ry="2"/>`;

    // Value labels above bars with performance coloring
    const portfolioColor = getPerformanceColor(portfolioData[i], benchmarkData[i], isLower, colors);
    const displayValue = unit === '°C' ? portfolioData[i].toFixed(2) : portfolioData[i].toFixed(1);
    const benchDisplayValue = unit === '°C' ? benchmarkData[i].toFixed(2) : benchmarkData[i].toFixed(1);

    valueLabels += `<text x="${groupX + barWidth / 2}" y="${pY - 5}" font-size="9" font-weight="bold" fill="${portfolioColor}" text-anchor="middle">${displayValue}</text>`;
    valueLabels += `<text x="${bX + barWidth / 2}" y="${bY - 5}" font-size="9" font-weight="bold" fill="#333" text-anchor="middle">${benchDisplayValue}</text>`;

    // X-axis labels with units
    const centerX = groupX + barWidth + barGap / 2;
    const labelWithUnit = metricUnit ? `${escapeHtml(label)}\n(${metricUnit})` : escapeHtml(label);
    const labelLines = labelWithUnit.split('\n');
    // Use smaller font for longer labels
    const mainFontSize = label.length > 20 ? '7' : '8';
    const unitFontSize = '7';

    if (labelLines.length > 1) {
      axisLabels += `<text x="${centerX}" y="${chartBottom + 14}" font-size="${mainFontSize}" fill="#333" text-anchor="middle">${labelLines[0]}</text>`;
      axisLabels += `<text x="${centerX}" y="${chartBottom + 24}" font-size="${unitFontSize}" fill="#666" text-anchor="middle">${labelLines[1]}</text>`;
    } else {
      axisLabels += `<text x="${centerX}" y="${chartBottom + 16}" font-size="${mainFontSize}" fill="#333" text-anchor="middle">${labelLines[0]}</text>`;
    }
  });

  // Grid lines and Y-axis labels
  let gridLines = '';
  const numGridLines = Math.round(maxValue / stepSize);
  for (let i = 0; i <= numGridLines; i++) {
    const y = chartBottom - (chartHeight * i) / numGridLines;
    gridLines += `<line x1="${chartLeft}" y1="${y}" x2="${chartRight}" y2="${y}" stroke="#e9ecef" stroke-width="1"/>`;
    const val = (stepSize * i);
    gridLines += `<text x="${chartLeft - 8}" y="${y + 3}" font-size="9" fill="#666" text-anchor="end">${val}</text>`;
  }

  // Chart border (bottom and left)
  const borders = `
    <line x1="${chartLeft}" y1="${chartTop}" x2="${chartLeft}" y2="${chartBottom}" stroke="#dee2e6" stroke-width="1"/>
    <line x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}" stroke="#dee2e6" stroke-width="1"/>
  `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${SVG_HEIGHT}" width="${width}" height="${SVG_HEIGHT}">
      <rect width="100%" height="100%" fill="white"/>
      ${gridLines}
      ${borders}
      ${bars}
      ${valueLabels}
      ${axisLabels}
    </svg>
  `;
}

// ============================================================================
// Horizontal Bar Chart Generator (for Social/Governance)
// ============================================================================

interface HorizontalBarChartOptions {
  title: string;
  labels: string[];
  portfolioData: number[];
  benchmarkData: number[];
  colors: ThemeColors;
  maxValue?: number;
  metricNames?: string[];
}

export function generateHorizontalBarChartSVG(options: HorizontalBarChartOptions): string {
  const { title, labels, portfolioData, benchmarkData, colors, maxValue: customMax, metricNames } = options;

  const svgHeight = 320;
  const labelWidth = 115;
  const chartLeft = labelWidth + 10;
  const chartRight = SVG_WIDTH - 15;
  const chartTop = 15;
  const chartBottom = svgHeight - 25;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Calculate scale
  const allValues = [...portfolioData, ...benchmarkData];
  const scale = customMax ? { max: customMax, stepSize: customMax / 4 } : calculateDynamicScale(allValues);
  const maxValue = scale.max;

  const barGroupHeight = chartHeight / labels.length;
  const barHeight = barGroupHeight * 0.30;
  const barGap = 4;

  let bars = '';
  let labelText = '';
  let valueLabels = '';

  labels.forEach((label, i) => {
    const groupY = chartTop + i * barGroupHeight + barGroupHeight * 0.15;
    const isLower = metricNames ? isLowerBetterMetric(metricNames[i]) : isLowerBetterMetric(label);
    const metricUnit = metricNames ? getMetricUnit(metricNames[i]) : getMetricUnit(label);

    // Portfolio bar
    const pWidth = Math.max(3, (portfolioData[i] / maxValue) * chartWidth);
    bars += `<rect x="${chartLeft}" y="${groupY}" width="${pWidth}" height="${barHeight}" fill="${colors.portfolioColor}" rx="2"/>`;

    // Value label with performance coloring
    const portfolioColor = getPerformanceColor(portfolioData[i], benchmarkData[i], isLower, colors);
    const portfolioDisplay = metricUnit === '%' ? `${portfolioData[i].toFixed(1)}%` : portfolioData[i].toFixed(1);
    valueLabels += `<text x="${chartLeft + pWidth + 6}" y="${groupY + barHeight - 2}" font-size="9" font-weight="bold" fill="${portfolioColor}">${portfolioDisplay}</text>`;

    // Benchmark bar
    const bWidth = Math.max(3, (benchmarkData[i] / maxValue) * chartWidth);
    const bY = groupY + barHeight + barGap;
    bars += `<rect x="${chartLeft}" y="${bY}" width="${bWidth}" height="${barHeight}" fill="${colors.benchmarkColor}" rx="2"/>`;
    const benchDisplay = metricUnit === '%' ? `${benchmarkData[i].toFixed(1)}%` : benchmarkData[i].toFixed(1);
    valueLabels += `<text x="${chartLeft + bWidth + 6}" y="${bY + barHeight - 2}" font-size="9" font-weight="bold" fill="#333">${benchDisplay}</text>`;

    // Y-axis labels with units
    const labelY = groupY + barGroupHeight / 2 - 2;
    const displayLabel = escapeHtml(label);
    const unitLabel = metricUnit ? `(${metricUnit})` : '';

    labelText += `<text x="${labelWidth}" y="${labelY - 4}" font-size="9" fill="#333" text-anchor="end">${displayLabel}</text>`;
    if (unitLabel) {
      labelText += `<text x="${labelWidth}" y="${labelY + 8}" font-size="7" fill="#666" text-anchor="end">${unitLabel}</text>`;
    }
  });

  // Grid lines and X-axis labels
  let gridLines = '';
  const numGridLines = 5;
  for (let i = 0; i <= numGridLines; i++) {
    const x = chartLeft + (chartWidth * i) / numGridLines;
    gridLines += `<line x1="${x}" y1="${chartTop}" x2="${x}" y2="${chartBottom}" stroke="#e9ecef" stroke-width="1"/>`;
    const val = (maxValue * i) / numGridLines;
    gridLines += `<text x="${x}" y="${chartBottom + 14}" font-size="8" fill="#666" text-anchor="middle">${val.toFixed(0)}</text>`;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${svgHeight}" width="${SVG_WIDTH}" height="${svgHeight}">
      <rect width="100%" height="100%" fill="white"/>
      ${gridLines}
      ${bars}
      ${valueLabels}
      ${labelText}
    </svg>
  `;
}

// ============================================================================
// Donut Chart Generator with external labels and connecting lines
// ============================================================================

interface DonutChartOptions {
  portfolioValue: number;
  benchmarkValue: number;
  colors: ThemeColors;
  label?: string;
}

export function generateDonutChartSVG(options: DonutChartOptions): string {
  const { portfolioValue, benchmarkValue, colors } = options;

  // Wide viewBox for labels on left and right
  const width = 320;
  const height = 160;
  const centerX = width / 2;
  const centerY = height / 2;

  // Single ring donut matching reference PDF style
  const outerRadius = 55;
  const innerRadius = 42;

  // Calculate arc angles for portfolio and benchmark (0-100%)
  const portfolioPercentage = Math.min(100, Math.max(0, portfolioValue));
  const benchmarkPercentage = Math.min(100, Math.max(0, benchmarkValue));

  // Portfolio arc (starting from top, going clockwise) - main colored portion
  const portfolioAngle = (portfolioPercentage / 100) * 360;
  const portfolioPath = createArcPath(centerX, centerY, outerRadius, innerRadius, -90, -90 + portfolioAngle);

  // Benchmark arc (partial outer arc to show benchmark position)
  const benchmarkAngle = (benchmarkPercentage / 100) * 360;
  const benchmarkOuterRadius = outerRadius + 4;
  const benchmarkArcInner = outerRadius + 1;
  const benchmarkPath = createArcPath(centerX, centerY, benchmarkOuterRadius, benchmarkArcInner, -90, -90 + benchmarkAngle);

  // Gray unfilled portion of main ring
  const remainderPath = portfolioPercentage < 100
    ? createArcPath(centerX, centerY, outerRadius, innerRadius, -90 + portfolioAngle, 270)
    : '';

  // Determine portfolio color based on benchmark comparison (higher is better for ratios)
  const portfolioColor = getPerformanceColor(portfolioValue, benchmarkValue, false, colors);

  // Fixed positions: Portfolio on LEFT, Benchmark on RIGHT
  const pDotX = 70;
  const pDotY = centerY;
  const pLineStartX = centerX - outerRadius - 3;
  const pLineStartY = centerY;

  const bDotX = width - 70;
  const bDotY = centerY;
  const bLineStartX = centerX + outerRadius + 3;
  const bLineStartY = centerY;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="transparent"/>

      <!-- Gray unfilled portion -->
      ${remainderPath ? `<path d="${remainderPath}" fill="#e9ecef"/>` : ''}

      <!-- Portfolio arc (main ring) -->
      ${portfolioPath ? `<path d="${portfolioPath}" fill="${colors.portfolioColor}"/>` : ''}

      <!-- Benchmark arc (thin outer indicator) -->
      ${benchmarkPath ? `<path d="${benchmarkPath}" fill="${colors.benchmarkColor}"/>` : ''}

      <!-- Portfolio label with leader line (LEFT side) -->
      <line x1="${pLineStartX}" y1="${pLineStartY}" x2="${pDotX}" y2="${pDotY}" stroke="#333" stroke-width="1"/>
      <circle cx="${pDotX}" cy="${pDotY}" r="4" fill="${colors.portfolioColor}"/>
      <text x="${pDotX - 10}" y="${pDotY - 8}" font-size="11" font-weight="bold" fill="${portfolioColor}" text-anchor="end">${portfolioValue.toFixed(1)}%</text>
      <text x="${pDotX - 10}" y="${pDotY + 14}" font-size="9" fill="#666" text-anchor="end">Portfolio</text>

      <!-- Benchmark label with leader line (RIGHT side) -->
      <line x1="${bLineStartX}" y1="${bLineStartY}" x2="${bDotX}" y2="${bDotY}" stroke="#333" stroke-width="1"/>
      <circle cx="${bDotX}" cy="${bDotY}" r="4" fill="${colors.benchmarkColor}"/>
      <text x="${bDotX + 10}" y="${bDotY - 8}" font-size="11" font-weight="bold" fill="#333" text-anchor="start">${benchmarkValue.toFixed(1)}%</text>
      <text x="${bDotX + 10}" y="${bDotY + 14}" font-size="9" fill="#666" text-anchor="start">Benchmark</text>
    </svg>
  `;
}

// Helper function to create arc path
function createArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  const outerStartX = cx + outerR * Math.cos(startRad);
  const outerStartY = cy + outerR * Math.sin(startRad);
  const outerEndX = cx + outerR * Math.cos(endRad);
  const outerEndY = cy + outerR * Math.sin(endRad);

  const innerStartX = cx + innerR * Math.cos(endRad);
  const innerStartY = cy + innerR * Math.sin(endRad);
  const innerEndX = cx + innerR * Math.cos(startRad);
  const innerEndY = cy + innerR * Math.sin(startRad);

  return `
    M ${outerStartX} ${outerStartY}
    A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}
    L ${innerStartX} ${innerStartY}
    A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${innerEndX} ${innerEndY}
    Z
  `;
}

// ============================================================================
// Convert SVG to Base64 Data URI
// ============================================================================

export function svgToDataUri(svg: string): string {
  const encoded = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

// ============================================================================
// Report Charts Interface
// ============================================================================

export interface ReportCharts {
  climateScope12: string;
  climateScope3: string;
  climatePerformanceEnv: string;
  climatePerformanceTemp: string;
  naturalCapital: string;
  waterRecycled: string;
  wasteRecycled: string;
  humanCapital: string;
  businessEthics: string;
}

// ============================================================================
// Generate All Charts
// ============================================================================

export function generateAllChartsSVG(
  metrics: PortfolioMetrics,
  benchmark: BenchmarkMetrics,
  colors: ThemeColors
): ReportCharts {
  return {
    climateScope12: svgToDataUri(generateBarChartSVG({
      title: 'Financed & Carbon Intensity (Scope 1+2)',
      labels: ['Financed Intensity Scope 1+2', 'Carbon Intensity Scope 1+2'],
      portfolioData: [...metrics.climate_scope12],
      benchmarkData: [...benchmark.climate_scope12],
      colors,
      metricNames: ['Financed Intensity Scope 1+2', 'Carbon Intensity Scope 1+2'],
    })),

    climateScope3: svgToDataUri(generateBarChartSVG({
      title: 'Financed & Carbon Intensity (Scope 3)',
      labels: ['Financed Intensity Scope 3', 'Carbon Intensity Scope 3'],
      portfolioData: [...metrics.climate_scope3],
      benchmarkData: [...benchmark.climate_scope3],
      colors,
      metricNames: ['Financed Intensity Scope 3', 'Carbon Intensity Scope 3'],
    })),

    climatePerformanceEnv: svgToDataUri(generateBarChartSVG({
      title: 'Environmental Performance',
      labels: ['Environmental Score', 'Net Zero Target'],
      portfolioData: [...metrics.climate_performance_env],
      benchmarkData: [...benchmark.climate_performance_env],
      colors,
      metricNames: ['Environmental Score', 'Net Zero Target'],
    })),

    climatePerformanceTemp: svgToDataUri(generateBarChartSVG({
      title: 'Temperature Alignment',
      labels: ['Temp Rating Scope 1+2', 'Temp Rating Scope 3'],
      portfolioData: [...metrics.climate_performance_temp],
      benchmarkData: [...benchmark.climate_performance_temp],
      colors,
      unit: '°C',
      metricNames: ['Temp Rating Scope 1+2', 'Temp Rating Scope 3'],
      yAxisMax: 3,
      yAxisStep: 0.5,
    })),

    naturalCapital: svgToDataUri(generateBarChartSVG({
      title: 'Natural Capital & Biodiversity',
      labels: ['Land Use & Biodiversity', 'Biodiversity Reduction'],
      portfolioData: [...metrics.natural_capital],
      benchmarkData: [...benchmark.natural_capital],
      colors,
      metricNames: ['Land Use & Biodiversity', 'Biodiversity Reduction'],
      svgWidth: 900, // Extra wide for Page 2
    })),

    waterRecycled: svgToDataUri(generateDonutChartSVG({
      portfolioValue: metrics.water_recycled_ratio,
      benchmarkValue: benchmark.water_recycled_ratio,
      colors,
    })),

    wasteRecycled: svgToDataUri(generateDonutChartSVG({
      portfolioValue: metrics.waste_recycling_ratio,
      benchmarkValue: benchmark.waste_recycling_ratio,
      colors,
    })),

    humanCapital: svgToDataUri(generateHorizontalBarChartSVG({
      title: 'Human Capital',
      labels: ['Social Score', 'Gender Pay Gap', 'Female Board Members', 'Diversity Targets'],
      portfolioData: [...metrics.social],
      benchmarkData: [...benchmark.social],
      colors,
      metricNames: ['Social Score', 'Gender Pay Gap', 'Female Board Members', 'Diversity Targets'],
    })),

    businessEthics: svgToDataUri(generateHorizontalBarChartSVG({
      title: 'Business Ethics',
      labels: ['Governance Score', 'Non-Executive Board', 'Independent Board', 'Anti-Bribery Score'],
      portfolioData: [...metrics.governance],
      benchmarkData: [...benchmark.governance],
      colors,
      metricNames: ['Governance Score', 'Non-Executive Board', 'Independent Board', 'Anti-Bribery Score'],
    })),
  };
}
