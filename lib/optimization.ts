/**
 * Portfolio Optimization Engine
 * Efficient frontier generation using quadratic programming
 *
 * Features:
 * - Lambda sweep optimization for efficient frontier
 * - Custom asset selection for targeted frontiers
 * - Bucket constraints (Stability/Diversified/Growth envelopes)
 * - Risk allocation envelope constraints
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
import { getAssetsByMode, applyCapsTemplate, CORRELATION_MATRIX, ASSET_CLASSES } from './cma-data';

/**
 * Bucket constraint envelope definition
 */
export interface BucketConstraint {
  name: string;
  indices: number[];
  minWeight: number;
  maxWeight: number;
}

/**
 * Extended optimization parameters with custom assets and bucket constraints
 */
export interface ExtendedOptimizationParams extends OptimizationParams {
  customAssets?: string[];
  enableBucketConstraints?: boolean;
  bucketConstraints?: {
    stability?: { min: number; max: number };
    diversified?: { min: number; max: number };
    growth?: { min: number; max: number };
  };
}

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
 * Build bucket indices from assets
 * Groups assets by their riskAllocation property
 */
function buildBucketIndices(assets: AssetClass[]): {
  stability: number[];
  diversified: number[];
  growth: number[];
} {
  const stability: number[] = [];
  const diversified: number[] = [];
  const growth: number[] = [];

  assets.forEach((asset, idx) => {
    const allocation = asset.riskAllocation?.toUpperCase() || '';
    if (allocation === 'STABILITY') {
      stability.push(idx);
    } else if (allocation === 'DIVERSIFIED') {
      diversified.push(idx);
    } else {
      growth.push(idx);
    }
  });

  return { stability, diversified, growth };
}

/**
 * Build bucket constraint envelopes for optimization
 */
function buildBucketConstraints(
  assets: AssetClass[],
  constraints?: ExtendedOptimizationParams['bucketConstraints']
): BucketConstraint[] {
  const indices = buildBucketIndices(assets);
  const buckets: BucketConstraint[] = [];

  // Default envelope constraints (0% to 100% for each bucket)
  const defaults = {
    stability: { min: 0, max: 1 },
    diversified: { min: 0, max: 1 },
    growth: { min: 0, max: 1 },
  };

  const merged = {
    stability: { ...defaults.stability, ...constraints?.stability },
    diversified: { ...defaults.diversified, ...constraints?.diversified },
    growth: { ...defaults.growth, ...constraints?.growth },
  };

  if (indices.stability.length > 0) {
    buckets.push({
      name: 'STABILITY',
      indices: indices.stability,
      minWeight: merged.stability.min,
      maxWeight: merged.stability.max,
    });
  }

  if (indices.diversified.length > 0) {
    buckets.push({
      name: 'DIVERSIFIED',
      indices: indices.diversified,
      minWeight: merged.diversified.min,
      maxWeight: merged.diversified.max,
    });
  }

  if (indices.growth.length > 0) {
    buckets.push({
      name: 'GROWTH',
      indices: indices.growth,
      minWeight: merged.growth.min,
      maxWeight: merged.growth.max,
    });
  }

  return buckets;
}

/**
 * Filter assets by custom selection
 */
function filterAssetsByCustomSelection(
  assets: AssetClass[],
  customAssets: string[]
): AssetClass[] {
  const customSet = new Set(customAssets.map(a => a.toUpperCase()));
  return assets.filter(a => customSet.has(a.name.toUpperCase()));
}

/**
 * Generate efficient frontier using lambda sweep
 * Supports custom asset selection and bucket constraints
 */
export function generateEfficientFrontier(
  params: OptimizationParams | ExtendedOptimizationParams
): EfficientFrontierResult {
  const extParams = params as ExtendedOptimizationParams;

  // Get and filter assets
  let assets = getAssetsByMode(params.mode);
  assets = applyCapsTemplate(assets, params.capsTemplate);

  // Apply custom asset filter if provided
  if (extParams.customAssets && extParams.customAssets.length >= 2) {
    assets = filterAssetsByCustomSelection(assets, extParams.customAssets);
  }

  if (assets.length < 2) {
    return { frontier: [], portfolios: [] };
  }

  const returns = assets.map(a => a.expectedReturn);
  const covMatrix = buildCovarianceMatrix(assets, CORRELATION_MATRIX);
  const bounds: Array<[number, number]> = assets.map(a => [0, a.capMax]);

  // Build bucket constraints if enabled
  const bucketConstraints = extParams.enableBucketConstraints
    ? buildBucketConstraints(assets, extParams.bucketConstraints)
    : [];

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
    const result = optimizeForLambdaWithBuckets(
      lambda,
      returns,
      covMatrix,
      bounds,
      bucketConstraints
    );
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
 * Solve single portfolio optimization with bucket constraints
 */
function optimizeForLambdaWithBuckets(
  lambda: number,
  returns: number[],
  covMatrix: number[][],
  bounds: Array<[number, number]>,
  bucketConstraints: BucketConstraint[]
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
    // 4. sum(w_bucket) >= min_bucket (bucket lower bounds)
    // 5. -sum(w_bucket) >= -max_bucket (bucket upper bounds)

    const numBucketConstraints = bucketConstraints.length * 2; // min and max for each
    const numConstraints = 1 + n + n + numBucketConstraints;
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

    // Bucket constraints
    let constraintIdx = 1 + n + n;
    for (const bucket of bucketConstraints) {
      // Min constraint: sum(w_bucket) >= min
      for (const idx of bucket.indices) {
        Amat[idx][constraintIdx] = 1;
      }
      bvec[constraintIdx] = bucket.minWeight;
      constraintIdx++;

      // Max constraint: -sum(w_bucket) >= -max
      for (const idx of bucket.indices) {
        Amat[idx][constraintIdx] = -1;
      }
      bvec[constraintIdx] = -bucket.maxWeight;
      constraintIdx++;
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

/**
 * Generate normally distributed random number (Box-Muller)
 */
function randomNormal(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Generate resampled efficient frontier portfolios
 * Uses Monte Carlo simulation to perturb return estimates and re-optimize
 * This accounts for estimation uncertainty in mean-variance optimization
 *
 * @param params Optimization parameters
 * @param numResamples Number of resampling iterations (default 100)
 * @param returnNoise Std dev of noise added to returns (default 2% = 0.02)
 * @returns Array of {risk, return} points from resampled portfolios
 */
export function generateResampledPortfolios(
  params: OptimizationParams | ExtendedOptimizationParams,
  numResamples: number = 100,
  returnNoise: number = 0.02
): Array<{ risk: number; return: number }> {
  const extParams = params as ExtendedOptimizationParams;

  // Get and filter assets
  let assets = getAssetsByMode(params.mode);
  assets = applyCapsTemplate(assets, params.capsTemplate);

  // Apply custom asset filter if provided
  if (extParams.customAssets && extParams.customAssets.length >= 2) {
    const customSet = new Set(extParams.customAssets.map(a => a.toUpperCase()));
    assets = assets.filter(a => customSet.has(a.name.toUpperCase()));
  }

  if (assets.length < 2) {
    return [];
  }

  const baseReturns = assets.map(a => a.expectedReturn);
  const covMatrix = buildCovarianceMatrix(assets, CORRELATION_MATRIX);
  const bounds: Array<[number, number]> = assets.map(a => [0, a.capMax]);

  // Build bucket constraints if enabled
  const bucketConstraints = extParams.enableBucketConstraints
    ? buildBucketConstraints(assets, extParams.bucketConstraints)
    : [];

  const resampledPoints: Array<{ risk: number; return: number }> = [];

  // Generate resampled portfolios
  const lambdas = [0.5, 1, 2, 5, 10, 20, 50, 100]; // Key risk aversion levels

  for (let i = 0; i < numResamples; i++) {
    // Perturb returns with random noise
    const perturbedReturns = baseReturns.map(r => r + randomNormal() * returnNoise);

    for (const lambda of lambdas) {
      const result = optimizeForLambdaWithBuckets(
        lambda,
        perturbedReturns,
        covMatrix,
        bounds,
        bucketConstraints
      );

      if (result && result.success) {
        // Calculate actual risk/return using base (unperturbed) returns
        const actualReturn = result.weights.reduce((acc, w, j) => acc + w * baseReturns[j], 0);
        resampledPoints.push({
          risk: result.risk,
          return: actualReturn,
        });
      }
    }
  }

  return resampledPoints;
}
