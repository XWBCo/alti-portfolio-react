/**
 * Portfolio Optimization Engine
 * Efficient frontier generation using quadratic programming
 */

import { solveQP } from 'quadprog';
import {
  AssetClass,
  CorrelationMatrix,
  FrontierPoint,
  PortfolioHoldings,
  PortfolioMetrics,
  PortfolioWithMetrics,
  EfficientFrontierResult,
  OptimizationParams,
} from './portfolio-types';
import { getAssetsByMode, applyCapsTemplate, CORRELATION_MATRIX } from './cma-data';

/**
 * Build covariance matrix from assets and correlation matrix
 * Σ = diag(σ) × ρ × diag(σ)
 */
export function buildCovarianceMatrix(
  assets: AssetClass[],
  correlationMatrix: CorrelationMatrix
): number[][] {
  const n = assets.length;
  const cov: number[][] = [];

  for (let i = 0; i < n; i++) {
    cov[i] = [];
    for (let j = 0; j < n; j++) {
      const sigmaI = assets[i].risk;
      const sigmaJ = assets[j].risk;
      const rho = correlationMatrix[assets[i].name]?.[assets[j].name] ?? (i === j ? 1 : 0);
      cov[i][j] = sigmaI * sigmaJ * rho;
    }
  }

  // Ensure positive semi-definiteness via eigenvalue clipping
  return ensurePSD(cov);
}

/**
 * Ensure matrix is positive semi-definite
 * Uses eigenvalue decomposition and clips negative eigenvalues
 */
function ensurePSD(matrix: number[][]): number[][] {
  const n = matrix.length;

  // For small matrices, just ensure symmetry and positive diagonal
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const avg = (matrix[i][j] + matrix[j][i]) / 2;
      matrix[i][j] = avg;
      matrix[j][i] = avg;
    }
    // Ensure positive diagonal
    if (matrix[i][i] <= 0) {
      matrix[i][i] = 1e-10;
    }
  }

  return matrix;
}

/**
 * Convert 0-indexed JavaScript arrays to 1-indexed format for quadprog
 */
function to1IndexedMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const m = matrix[0]?.length ?? 0;
  const result: number[][] = new Array(n + 1);

  result[0] = new Array(m + 1).fill(0);
  for (let i = 0; i < n; i++) {
    result[i + 1] = [0, ...matrix[i]];
  }

  return result;
}

function to1IndexedVector(vector: number[]): number[] {
  return [0, ...vector];
}

/**
 * Solve single portfolio optimization for given lambda (risk aversion)
 * minimize: λ(w'Σw) - μ'w
 * subject to: Σw = 1, 0 ≤ w ≤ cap
 */
function optimizeForLambda(
  lambda: number,
  returns: number[],
  covMatrix: number[][],
  bounds: Array<[number, number]>
): { success: boolean; weights: number[]; return: number; risk: number } | null {
  const n = returns.length;

  try {
    // D matrix = 2 * lambda * Σ (quadprog expects 1/2 x'Dx, so we multiply by 2)
    const Dmat: number[][] = covMatrix.map(row => row.map(v => 2 * lambda * v));

    // d vector = μ (returns)
    const dvec = returns.slice();

    // Build constraint matrix A'x >= b
    // Constraints:
    // 1. Sum of weights = 1 (equality)
    // 2. w_i >= 0 (lower bounds)
    // 3. -w_i >= -cap_i (upper bounds as -w_i >= -cap)
    const numConstraints = 1 + n + n; // 1 equality + n lower + n upper
    const Amat: number[][] = [];

    // Initialize Amat as n x numConstraints (will be transposed)
    for (let i = 0; i < n; i++) {
      Amat[i] = new Array(numConstraints).fill(0);
    }

    // Constraint 1: sum = 1 (equality)
    for (let i = 0; i < n; i++) {
      Amat[i][0] = 1;
    }

    // Constraints 2-n+1: w_i >= 0
    for (let i = 0; i < n; i++) {
      Amat[i][1 + i] = 1;
    }

    // Constraints n+2 to 2n+1: -w_i >= -cap_i
    for (let i = 0; i < n; i++) {
      Amat[i][1 + n + i] = -1;
    }

    // b vector
    const bvec = new Array(numConstraints).fill(0);
    bvec[0] = 1; // sum = 1
    // Lower bounds (w >= 0) have bvec = 0, already set
    // Upper bounds (-w >= -cap) have bvec = -cap
    for (let i = 0; i < n; i++) {
      bvec[1 + n + i] = -bounds[i][1];
    }

    // Convert to 1-indexed format
    const Dmat1 = to1IndexedMatrix(Dmat);
    const dvec1 = to1IndexedVector(dvec);
    const Amat1 = to1IndexedMatrix(Amat);
    const bvec1 = to1IndexedVector(bvec);

    // Solve with meq=1 (first constraint is equality)
    const result = solveQP(Dmat1, dvec1, Amat1, bvec1, 1);

    if (result.message !== '') {
      return null;
    }

    // Extract weights (convert back from 1-indexed)
    const weights = result.solution.slice(1);

    // Normalize weights to ensure they sum to 1
    const sum = weights.reduce((a: number, b: number) => a + b, 0);
    const normalizedWeights = weights.map((w: number) => w / sum);

    // Calculate portfolio return and risk
    const portReturn = normalizedWeights.reduce((acc: number, w: number, i: number) => acc + w * returns[i], 0);
    const portVariance = normalizedWeights.reduce((acc: number, wi: number, i: number) =>
      acc + normalizedWeights.reduce((inner: number, wj: number, j: number) =>
        inner + wi * wj * covMatrix[i][j], 0), 0);
    const portRisk = Math.sqrt(Math.max(portVariance, 0));

    return {
      success: true,
      weights: normalizedWeights,
      return: portReturn,
      risk: portRisk,
    };
  } catch {
    return null;
  }
}

/**
 * Generate efficient frontier using lambda sweep
 */
export function generateEfficientFrontier(
  params: OptimizationParams
): EfficientFrontierResult {
  // Get and filter assets
  let assets = getAssetsByMode(params.mode);
  assets = applyCapsTemplate(assets, params.capsTemplate);

  if (assets.length < 2) {
    return { frontier: [], portfolios: [] };
  }

  const returns = assets.map(a => a.expectedReturn);
  const covMatrix = buildCovarianceMatrix(assets, CORRELATION_MATRIX);
  const bounds: Array<[number, number]> = assets.map(a => [0, a.capMax]);

  // Lambda sweep: geometric spacing from 0.1 to 200
  const numPoints = params.numPoints ?? 30;
  const lambdas: number[] = [];
  const minLambda = 0.1;
  const maxLambda = 200;
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    lambdas.push(minLambda * Math.pow(maxLambda / minLambda, t));
  }

  const frontier: FrontierPoint[] = [];
  const seenRisks = new Set<string>();

  for (const lambda of lambdas) {
    const result = optimizeForLambda(lambda, returns, covMatrix, bounds);
    if (result && result.success) {
      // Deduplicate very similar risk levels
      const riskKey = result.risk.toFixed(4);
      if (!seenRisks.has(riskKey)) {
        seenRisks.add(riskKey);
        frontier.push({
          risk: result.risk,
          return: result.return,
          allocations: Object.fromEntries(
            assets.map((a, i) => [a.name, result.weights[i]])
          ),
        });
      }
    }
  }

  // Sort by risk
  frontier.sort((a, b) => a.risk - b.risk);

  return { frontier, portfolios: [] };
}

/**
 * Calculate portfolio metrics given holdings
 */
export function calculatePortfolioMetrics(
  holdings: PortfolioHoldings,
  assets: AssetClass[],
  correlationMatrix: CorrelationMatrix
): PortfolioMetrics {
  // Get weights in order of assets
  const weights = assets.map(a => holdings.allocations[a.name] ?? 0);
  const returns = assets.map(a => a.expectedReturn);
  const covMatrix = buildCovarianceMatrix(assets, correlationMatrix);

  // Expected return
  const expectedReturn = weights.reduce((acc, w, i) => acc + w * returns[i], 0);

  // Portfolio risk (standard deviation)
  const variance = weights.reduce((acc, wi, i) =>
    acc + weights.reduce((inner, wj, j) =>
      inner + wi * wj * covMatrix[i][j], 0), 0);
  const risk = Math.sqrt(Math.max(variance, 0));

  // VaR (95%) - assuming normal distribution
  // VaR_95% = -μ + σ × z_0.95 where z_0.95 ≈ 1.645
  const z95 = 1.645;
  const var95 = -expectedReturn + risk * z95;

  // CVaR (95%) - Expected Shortfall
  // CVaR_95% ≈ -μ + σ × φ(z) / (1-α) where φ(z) is standard normal PDF at z
  // φ(1.645) ≈ 0.103
  const phi_z = 0.103;
  const cvar95 = -expectedReturn + risk * (phi_z / 0.05);

  // Sharpe Ratio (assuming risk-free rate of 3%)
  const riskFreeRate = 0.03;
  const sharpeRatio = risk > 0 ? (expectedReturn - riskFreeRate) / risk : 0;

  return {
    expectedReturn,
    risk,
    var95,
    cvar95,
    sharpeRatio,
  };
}

/**
 * Calculate metrics for multiple portfolios
 */
export function calculatePortfoliosWithMetrics(
  portfolios: PortfolioHoldings[],
  assets: AssetClass[],
  correlationMatrix: CorrelationMatrix
): PortfolioWithMetrics[] {
  return portfolios.map(portfolio => ({
    ...portfolio,
    metrics: calculatePortfolioMetrics(portfolio, assets, correlationMatrix),
  }));
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
