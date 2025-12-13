import * as XLSX from 'xlsx';
import type { OptimalPortfolioResponse, FrontierResponse } from '../optimization-api-types';
import { ASSET_CLASSES } from '../cma-data';

// ============================================================================
// Excel Export for Portfolio Optimization
// ============================================================================

interface PortfolioExportData {
  optimizationResult: OptimalPortfolioResponse;
  currentWeights?: Record<string, number>;
  efficientFrontier?: FrontierResponse;
  reportDate?: string;
  mode?: string;
  capsTemplate?: string;
}

function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}


export function generatePortfolioOptimizationExcel(data: PortfolioExportData): Uint8Array {
  const workbook = XLSX.utils.book_new();
  const { optimizationResult, currentWeights, efficientFrontier, reportDate, mode, capsTemplate } = data;

  // ============================================================================
  // Sheet 1: Summary Metrics
  // ============================================================================
  const summaryData = [
    ['Portfolio Optimization Report'],
    [''],
    ['Report Information'],
    ['Generated Date', reportDate || new Date().toLocaleDateString('en-US')],
    ['Optimization Mode', mode || 'N/A'],
    ['Caps Template', capsTemplate || 'N/A'],
    ['Constraint Used', optimizationResult.constraint_used],
    [''],
    ['Optimal Portfolio Metrics'],
    ['Expected Return', formatPercent(optimizationResult.expected_return)],
    ['Risk (Standard Deviation)', formatPercent(optimizationResult.risk)],
    ['Sharpe Ratio', optimizationResult.sharpe_ratio.toFixed(3)],
    [''],
  ];

  if (currentWeights) {
    // Calculate current portfolio metrics
    const currentReturn = Object.entries(currentWeights).reduce((sum, [asset, weight]) => {
      const assetData = ASSET_CLASSES.find(a => a.name === asset);
      return sum + (assetData ? weight * assetData.expectedReturn : 0);
    }, 0);

    const returnImprovement = optimizationResult.expected_return - currentReturn;

    summaryData.push(
      ['Current Portfolio Comparison'],
      ['Current Expected Return', formatPercent(currentReturn)],
      ['Return Improvement', formatPercent(returnImprovement)],
      ['Improvement (bps)', Math.round(returnImprovement * 10000).toString()],
    );
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // ============================================================================
  // Sheet 2: Current Holdings (if provided)
  // ============================================================================
  if (currentWeights) {
    const currentHoldings = Object.entries(currentWeights)
      .filter(([_, weight]) => weight > 0.0001)
      .map(([asset, weight]) => {
        const assetData = ASSET_CLASSES.find(a => a.name === asset);
        return {
          asset,
          weight,
          expectedReturn: assetData?.expectedReturn || 0,
          risk: assetData?.risk || 0,
          riskAllocation: assetData?.riskAllocation || 'N/A',
        };
      })
      .sort((a, b) => b.weight - a.weight);

    const currentHeader = ['Asset Class', 'Weight %', 'Expected Return %', 'Risk (Std Dev) %', 'Risk Allocation'];
    const currentData = currentHoldings.map(h => [
      h.asset,
      formatPercent(h.weight),
      formatPercent(h.expectedReturn),
      formatPercent(h.risk),
      h.riskAllocation,
    ]);

    const currentSheet = XLSX.utils.aoa_to_sheet([currentHeader, ...currentData]);
    currentSheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, currentSheet, 'Current Holdings');
  }

  // ============================================================================
  // Sheet 3: Optimal Holdings
  // ============================================================================
  const optimalHoldings = Object.entries(optimizationResult.weights)
    .filter(([_, weight]) => weight > 0.0001)
    .map(([asset, weight]) => {
      const assetData = ASSET_CLASSES.find(a => a.name === asset);
      const currentWeight = currentWeights?.[asset] || 0;
      const change = weight - currentWeight;

      return {
        asset,
        weight,
        currentWeight,
        change,
        expectedReturn: assetData?.expectedReturn || 0,
        risk: assetData?.risk || 0,
        riskAllocation: assetData?.riskAllocation || 'N/A',
      };
    })
    .sort((a, b) => b.weight - a.weight);

  const optimalHeader = currentWeights
    ? ['Asset Class', 'Current Weight %', 'Optimal Weight %', 'Change %', 'Expected Return %', 'Risk (Std Dev) %', 'Risk Allocation']
    : ['Asset Class', 'Weight %', 'Expected Return %', 'Risk (Std Dev) %', 'Risk Allocation'];

  const optimalData = optimalHoldings.map(h =>
    currentWeights
      ? [
          h.asset,
          h.currentWeight > 0.0001 ? formatPercent(h.currentWeight) : '-',
          formatPercent(h.weight),
          Math.abs(h.change) > 0.0001 ? formatPercent(h.change) : '-',
          formatPercent(h.expectedReturn),
          formatPercent(h.risk),
          h.riskAllocation,
        ]
      : [
          h.asset,
          formatPercent(h.weight),
          formatPercent(h.expectedReturn),
          formatPercent(h.risk),
          h.riskAllocation,
        ]
  );

  const optimalSheet = XLSX.utils.aoa_to_sheet([optimalHeader, ...optimalData]);
  optimalSheet['!cols'] = currentWeights
    ? [{ wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
    : [{ wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, optimalSheet, 'Optimal Holdings');

  // ============================================================================
  // Sheet 4: Allocation Changes (if current weights provided)
  // ============================================================================
  if (currentWeights) {
    const changes = optimalHoldings
      .filter(h => Math.abs(h.change) > 0.0001)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    const changesHeader = ['Asset Class', 'Current Weight %', 'Optimal Weight %', 'Change %', 'Change Type'];
    const changesData = changes.map(h => [
      h.asset,
      formatPercent(h.currentWeight),
      formatPercent(h.weight),
      formatPercent(h.change),
      h.change > 0 ? 'Increase' : 'Decrease',
    ]);

    const changesSheet = XLSX.utils.aoa_to_sheet([changesHeader, ...changesData]);
    changesSheet['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, changesSheet, 'Changes');
  }

  // ============================================================================
  // Sheet 5: Efficient Frontier Points (if provided)
  // ============================================================================
  if (efficientFrontier && efficientFrontier.frontier.length > 0) {
    const frontierHeader = ['Point #', 'Risk (Std Dev) %', 'Expected Return %', 'Sharpe Ratio'];
    const frontierData = efficientFrontier.frontier.map((point, index) => {
      const riskFreeRate = 0.03; // Assume 3% risk-free rate
      const sharpe = point.risk > 0 ? (point.return - riskFreeRate) / point.risk : 0;

      return [
        index + 1,
        formatPercent(point.risk),
        formatPercent(point.return),
        sharpe.toFixed(3),
      ];
    });

    const frontierSheet = XLSX.utils.aoa_to_sheet([frontierHeader, ...frontierData]);
    frontierSheet['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, frontierSheet, 'Efficient Frontier');

    // Add detailed weights for each frontier point
    const weightsHeader = ['Point #', 'Risk %', 'Return %', ...efficientFrontier.assets.map(a => a.name)];
    const weightsData = efficientFrontier.frontier.map((point, index) => {
      const row: (string | number)[] = [
        index + 1,
        formatPercent(point.risk),
        formatPercent(point.return),
      ];

      efficientFrontier.assets.forEach(asset => {
        const weight = point.weights[asset.name] || 0;
        row.push(weight > 0.0001 ? formatPercent(weight) : '-');
      });

      return row;
    });

    const weightsSheet = XLSX.utils.aoa_to_sheet([weightsHeader, ...weightsData]);
    const colWidths = [{ wch: 10 }, { wch: 12 }, { wch: 12 }];
    efficientFrontier.assets.forEach(() => colWidths.push({ wch: 12 }));
    weightsSheet['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, weightsSheet, 'Frontier Weights');
  }

  // ============================================================================
  // Sheet 6: Asset Class Details
  // ============================================================================
  const assetsInPortfolio = ASSET_CLASSES.filter(asset =>
    optimizationResult.weights[asset.name] > 0.0001 ||
    (currentWeights && currentWeights[asset.name] > 0.0001)
  );

  const assetHeader = ['Asset Class', 'Expected Return %', 'Risk (Std Dev) %', 'Sharpe Ratio', 'Risk Allocation', 'Max Cap %'];
  const assetData = assetsInPortfolio.map(asset => {
    const riskFreeRate = 0.03;
    const sharpe = asset.risk > 0 ? (asset.expectedReturn - riskFreeRate) / asset.risk : 0;

    return [
      asset.name,
      formatPercent(asset.expectedReturn),
      formatPercent(asset.risk),
      sharpe.toFixed(3),
      asset.riskAllocation,
      formatPercent(asset.capMax),
    ];
  });

  const assetSheet = XLSX.utils.aoa_to_sheet([assetHeader, ...assetData]);
  assetSheet['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, assetSheet, 'Asset Details');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buffer);
}

// Helper function to trigger download in browser
export function downloadPortfolioExcel(
  data: PortfolioExportData,
  filename: string = 'portfolio-optimization.xlsx'
): void {
  const excelData = generatePortfolioOptimizationExcel(data);
  const blob = new Blob([excelData as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
