'use client';

import pptxgen from 'pptxgenjs';
import { ReportConfig } from './report-types';
import {
  RiskContributionsResponse,
  DiversificationResponse,
  PerformanceStats,
  StressScenarioResult,
} from './risk-types';

interface RiskReportData {
  contributions: RiskContributionsResponse | null;
  diversification: DiversificationResponse | null;
  performance: PerformanceStats | null;
  stressResults: StressScenarioResult[];
  portfolioName: string;
}

export async function generateRiskReport(
  config: ReportConfig,
  data: RiskReportData
): Promise<void> {
  try {
    const pptx = new pptxgen();

    // Set presentation properties
    pptx.author = 'AlTi Global';
    pptx.title = config.title;
    pptx.subject = 'Risk Analysis Report';
    pptx.company = 'AlTi Global';

    // Define master slide layout
    pptx.defineSlideMaster({
      title: 'ALTI_MASTER',
      background: { color: 'FFFFFF' },
      objects: [
        // Bottom accent line
        {
          rect: {
            x: 0,
            y: 5.3,
            w: '100%',
            h: 0.02,
            fill: { color: '00f0db' },
          },
        },
        // Footer text
        {
          text: {
            text: 'CONFIDENTIAL',
            options: {
              x: 0.5,
              y: 5.35,
              w: 2,
              h: 0.3,
              fontSize: 8,
              color: '757575',
              fontFace: 'Arial',
            },
          },
        },
      ],
    });

    // Generate slides based on config
    let slidesAdded = 0;
    for (const slideConfig of config.slides) {
      if (!slideConfig.included) continue;

      try {
        switch (slideConfig.type) {
          case 'title':
            addTitleSlide(pptx, config);
            slidesAdded++;
            break;
          case 'metrics':
            addMetricsSlide(pptx, data);
            slidesAdded++;
            break;
          case 'chart':
            addChartSlide(pptx, data);
            slidesAdded++;
            break;
          case 'table':
            addStressTableSlide(pptx, data);
            slidesAdded++;
            break;
          case 'summary':
            addSummarySlide(pptx, data);
            slidesAdded++;
            break;
        }
      } catch (slideError) {
        console.warn(`Failed to add slide ${slideConfig.type}:`, slideError);
        // Continue with other slides even if one fails
      }
    }

    if (slidesAdded === 0) {
      throw new Error('No slides could be generated. Please ensure you have selected at least one slide.');
    }

    // Generate filename with sanitization
    const sanitizedTitle = config.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedDate = config.date.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${sanitizedTitle}_${sanitizedDate}.pptx`;

    // Save the file
    await pptx.writeFile({ fileName });
  } catch (error) {
    console.error('PowerPoint generation error:', error);
    throw new Error(`Failed to generate PowerPoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function addTitleSlide(pptx: pptxgen, config: ReportConfig): void {
  const slide = pptx.addSlide();

  // Turquoise accent bar at top
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.15,
    fill: { color: '00f0db' },
  });

  // Logo placeholder (right side)
  slide.addImage({
    path: '/alti-logo-ips.png',
    x: 7.5,
    y: 0.5,
    w: 2,
    h: 0.8,
  });

  // Main title
  slide.addText(config.title, {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1,
    fontSize: 36,
    fontFace: 'Georgia',
    color: '010203',
    bold: false,
  });

  // Subtitle
  slide.addText(config.subtitle, {
    x: 0.5,
    y: 2.9,
    w: 9,
    h: 0.5,
    fontSize: 18,
    fontFace: 'Arial',
    color: '074269',
  });

  // Date and prepared for
  slide.addText(config.date, {
    x: 0.5,
    y: 4,
    w: 4,
    h: 0.3,
    fontSize: 12,
    fontFace: 'Arial',
    color: '757575',
  });

  if (config.preparedFor) {
    slide.addText(`Prepared for: ${config.preparedFor}`, {
      x: 0.5,
      y: 4.4,
      w: 4,
      h: 0.3,
      fontSize: 12,
      fontFace: 'Arial',
      color: '757575',
    });
  }
}

function addMetricsSlide(pptx: pptxgen, data: RiskReportData): void {
  const slide = pptx.addSlide({ masterName: 'ALTI_MASTER' });

  // Header
  addSlideHeader(slide, 'Key Risk Metrics');

  // Format metric values with proper validation
  const formatPercentage = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
      return 'N/A';
    }
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDecimal = (value: number | undefined | null, decimals: number = 2): string => {
    if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
      return 'N/A';
    }
    return value.toFixed(decimals);
  };

  // Metrics boxes
  const metrics = [
    {
      label: 'Portfolio Volatility',
      value: formatPercentage(data.contributions?.portfolio_vol_annualized),
      description: 'Annualized',
    },
    {
      label: 'Diversification Ratio',
      value: formatDecimal(data.diversification?.diversification_ratio),
      description: 'Higher is better',
    },
    {
      label: 'Sharpe Ratio',
      value: formatDecimal(data.performance?.sharpe),
      description: 'Risk-adjusted return',
    },
    {
      label: 'Max Drawdown',
      value: formatPercentage(data.performance?.max_drawdown),
      description: 'Historical peak-to-trough',
    },
    {
      label: 'CAGR',
      value: formatPercentage(data.performance?.cagr),
      description: 'Compound annual growth',
    },
    {
      label: 'Avg Correlation',
      value: formatDecimal(data.diversification?.weighted_avg_correlation),
      description: 'Weighted average',
    },
  ];

  metrics.forEach((metric, i) => {
    const x = 0.5 + (i % 3) * 3.2;
    const y = 1.5 + Math.floor(i / 3) * 1.8;

    // Metric box
    slide.addShape('rect', {
      x,
      y,
      w: 3,
      h: 1.5,
      fill: { color: 'f8f9fa' },
      line: { color: 'e6e6e6', width: 1 },
    });

    // Metric label
    slide.addText(metric.label, {
      x,
      y: y + 0.15,
      w: 3,
      h: 0.35,
      fontSize: 10,
      fontFace: 'Arial',
      color: '757575',
      align: 'center',
      bold: true,
    });

    // Metric value
    slide.addText(metric.value, {
      x,
      y: y + 0.55,
      w: 3,
      h: 0.5,
      fontSize: 22,
      fontFace: 'Arial',
      color: '074269',
      bold: true,
      align: 'center',
    });

    // Metric description
    slide.addText(metric.description, {
      x,
      y: y + 1.1,
      w: 3,
      h: 0.25,
      fontSize: 8,
      fontFace: 'Arial',
      color: '999999',
      align: 'center',
      italic: true,
    });
  });
}

function addChartSlide(pptx: pptxgen, data: RiskReportData): void {
  const slide = pptx.addSlide({ masterName: 'ALTI_MASTER' });

  addSlideHeader(slide, 'Risk Contribution (PCTR)');

  if (!data.contributions?.pctr || Object.keys(data.contributions.pctr).length === 0) {
    slide.addText('No risk contribution data available.\nPlease run the analysis to generate data.', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 14,
      color: '757575',
      align: 'center',
    });
    return;
  }

  // Create bar chart data - sorted by PCTR descending, top 10 assets
  const sortedAssets = Object.entries(data.contributions.pctr)
    .filter(([, pctr]) => !isNaN(pctr) && isFinite(pctr))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (sortedAssets.length === 0) {
    slide.addText('No valid risk contribution data available.', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 14,
      color: '757575',
      align: 'center',
    });
    return;
  }

  const assets = sortedAssets.map(([asset]) => asset);
  const riskContribs = sortedAssets.map(([, pctr]) => Number((pctr * 100).toFixed(2)));

  slide.addChart('bar', [
    {
      name: 'Risk Contribution (PCTR) %',
      labels: assets,
      values: riskContribs,
    },
  ], {
    x: 0.5,
    y: 1.3,
    w: 9,
    h: 3.8,
    barDir: 'bar',
    barGrouping: 'standard',
    chartColors: ['00f0db'],
    showLegend: true,
    legendPos: 'b',
    catAxisTitle: '',
    valAxisTitle: 'Percentage (%)',
    showValue: true,
    dataLabelFontSize: 9,
    catAxisLabelFontSize: 9,
    valAxisLabelFontSize: 9,
  });
}

function addStressTableSlide(pptx: pptxgen, data: RiskReportData): void {
  const slide = pptx.addSlide({ masterName: 'ALTI_MASTER' });

  addSlideHeader(slide, 'Stress Scenario Analysis');

  if (!data.stressResults || data.stressResults.length === 0) {
    slide.addText('No stress test data available.\nEnable stress scenarios in parameters to generate results.', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 14,
      color: '757575',
      align: 'center',
    });
    return;
  }

  const tableRows: pptxgen.TableRow[] = [
    // Header row
    [
      { text: 'Scenario', options: { bold: true, fill: { color: '074269' }, color: 'FFFFFF' } },
      { text: 'Period', options: { bold: true, fill: { color: '074269' }, color: 'FFFFFF' } },
      { text: 'Return', options: { bold: true, fill: { color: '074269' }, color: 'FFFFFF' } },
      { text: 'Max DD', options: { bold: true, fill: { color: '074269' }, color: 'FFFFFF' } },
      { text: 'Volatility', options: { bold: true, fill: { color: '074269' }, color: 'FFFFFF' } },
    ],
  ];

  data.stressResults.slice(0, 8).forEach((result) => {
    const returnColor = result.portfolio_return < 0 ? 'cc0000' : '008800';
    const formattedReturn = isNaN(result.portfolio_return) ? 'N/A' : `${(result.portfolio_return * 100).toFixed(1)}%`;
    const formattedDD = isNaN(result.max_drawdown) ? 'N/A' : `${(result.max_drawdown * 100).toFixed(1)}%`;
    const formattedVol = isNaN(result.volatility) ? 'N/A' : `${(result.volatility * 100).toFixed(1)}%`;

    tableRows.push([
      { text: result.scenario || 'Unknown' },
      { text: `${result.start_date || ''} - ${result.end_date || ''}` },
      { text: formattedReturn, options: { color: returnColor } },
      { text: formattedDD, options: { color: 'cc0000' } },
      { text: formattedVol, options: { color: '757575' } },
    ]);
  });

  slide.addTable(tableRows, {
    x: 0.5,
    y: 1.3,
    w: 9,
    colW: [2.5, 2.2, 1.4, 1.4, 1.5],
    fontSize: 9,
    fontFace: 'Arial',
    border: { type: 'solid', color: 'e6e6e6', pt: 0.5 },
    align: 'center',
    valign: 'middle',
  });
}

function addSummarySlide(pptx: pptxgen, data: RiskReportData): void {
  const slide = pptx.addSlide({ masterName: 'ALTI_MASTER' });

  addSlideHeader(slide, 'Summary & Key Takeaways');

  const bullets: string[] = [];

  // Portfolio volatility insight
  if (data.contributions?.portfolio_vol_annualized) {
    const vol = data.contributions.portfolio_vol_annualized;
    const volPct = (vol * 100).toFixed(2);
    const riskLevel = vol < 0.10 ? 'low' : vol < 0.15 ? 'moderate' : vol < 0.20 ? 'elevated' : 'high';
    bullets.push(`Portfolio exhibits ${riskLevel} volatility at ${volPct}% annualized`);
  }

  // Diversification assessment
  if (data.diversification?.diversification_ratio) {
    const ratio = data.diversification.diversification_ratio;
    let assessment = '';
    if (ratio >= 1.5) {
      assessment = 'excellent diversification benefits';
    } else if (ratio >= 1.2) {
      assessment = 'good diversification benefits';
    } else if (ratio >= 1.0) {
      assessment = 'moderate diversification benefits';
    } else {
      assessment = 'limited diversification benefits - consider rebalancing';
    }
    bullets.push(`Diversification ratio of ${ratio.toFixed(2)} indicates ${assessment}`);
  }

  // Risk concentration analysis
  if (data.contributions?.pctr) {
    const pctrEntries = Object.entries(data.contributions.pctr)
      .filter(([, value]) => !isNaN(value) && isFinite(value))
      .sort((a, b) => b[1] - a[1]);

    if (pctrEntries.length > 0) {
      const topRisk = pctrEntries.slice(0, 3).map(([asset]) => asset);
      const topRiskPct = pctrEntries.slice(0, 3).reduce((sum, [, pctr]) => sum + pctr, 0);
      bullets.push(`Top 3 risk contributors (${topRisk.join(', ')}) account for ${(topRiskPct * 100).toFixed(1)}% of portfolio risk`);
    }
  }

  // Performance insights
  if (data.performance) {
    if (data.performance.sharpe && isFinite(data.performance.sharpe)) {
      const sharpe = data.performance.sharpe;
      const quality = sharpe > 1.5 ? 'excellent' : sharpe > 1.0 ? 'good' : sharpe > 0.5 ? 'acceptable' : 'poor';
      bullets.push(`Risk-adjusted returns are ${quality} with Sharpe ratio of ${sharpe.toFixed(2)}`);
    }
    if (data.performance.max_drawdown && isFinite(data.performance.max_drawdown)) {
      bullets.push(`Maximum historical drawdown: ${(data.performance.max_drawdown * 100).toFixed(2)}%`);
    }
  }

  // Stress test insights
  if (data.stressResults && data.stressResults.length > 0) {
    const validResults = data.stressResults.filter(r => !isNaN(r.portfolio_return) && isFinite(r.portfolio_return));
    if (validResults.length > 0) {
      const worstScenario = validResults.reduce((worst, curr) =>
        curr.portfolio_return < worst.portfolio_return ? curr : worst
      );
      const bestScenario = validResults.reduce((best, curr) =>
        curr.portfolio_return > best.portfolio_return ? curr : best
      );
      bullets.push(`Stress testing: worst case ${worstScenario.scenario} (${(worstScenario.portfolio_return * 100).toFixed(1)}%), best case ${bestScenario.scenario} (${(bestScenario.portfolio_return * 100).toFixed(1)}%)`);
    }
  }

  // Recommendations
  bullets.push('Recommendation: Regular monitoring of risk metrics and rebalancing as needed');

  if (bullets.length === 1) {
    bullets.unshift('Analysis completed - detailed metrics available in previous slides');
  }

  slide.addText(
    bullets.map(b => ({ text: b, options: { bullet: true, paraSpaceAfter: 14 } })),
    {
      x: 0.5,
      y: 1.4,
      w: 9,
      h: 3.5,
      fontSize: 13,
      fontFace: 'Arial',
      color: '010203',
      valign: 'top',
    }
  );

  // Disclaimer
  slide.addText(
    'This analysis is for informational purposes only and does not constitute investment advice. Past performance is not indicative of future results.',
    {
      x: 0.5,
      y: 4.85,
      w: 9,
      h: 0.35,
      fontSize: 8,
      fontFace: 'Arial',
      color: '757575',
      italic: true,
    }
  );
}

function addSlideHeader(slide: pptxgen.Slide, title: string): void {
  // Turquoise accent bar
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.08,
    fill: { color: '00f0db' },
  });

  // Title
  slide.addText(title, {
    x: 0.5,
    y: 0.3,
    w: 8,
    h: 0.6,
    fontSize: 24,
    fontFace: 'Georgia',
    color: '010203',
  });

  // Logo
  slide.addImage({
    path: '/alti-logo-ips.png',
    x: 8.5,
    y: 0.25,
    w: 1.2,
    h: 0.5,
  });
}
