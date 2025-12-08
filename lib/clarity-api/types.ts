/**
 * Clarity AI API Types
 * Derived from YAML schemas in /docs/clarity-api/
 */

// ============================================
// Authentication
// ============================================

export interface AuthRequest {
  key: string;
  secret: string;
  portfolioId?: string;
}

export interface AuthResponse {
  token: string;
}

// ============================================
// Portfolio Management
// ============================================

export type SecurityIdType = 'ISIN' | 'CUSIP' | 'CASH' | 'OTHER' | 'LEI' | 'PERMID';
export type SecurityType = 'EQUITY' | 'FIXED_INCOME' | 'FUND';
export type WeightDistribution = 'PERCENTAGE' | 'AMOUNT';
export type PortfolioStatus = 'DRAFT' | 'CREATED' | 'UPDATING' | 'REJECTED';

export interface SecurityItem {
  id: string;
  idType: SecurityIdType;
  percentage?: number;
  amount?: number;
  currency?: string;
  securityType?: SecurityType;
}

export interface PortfolioTotal {
  value: number;
  currency: string;
}

export interface CreatePortfolioRequest {
  name: string;
  securitiesWeightDistribution: WeightDistribution;
  securities: SecurityItem[];
  total: PortfolioTotal;
}

export interface PortfolioResponse {
  id: string;
  name: string;
  status: PortfolioStatus;
  total: PortfolioTotal;
  cause?: string;
  securities?: SecurityItem[];
}

// ============================================
// ESG Impact Scores
// ============================================

export type ScoreMetadata =
  | 'NONE'
  | 'ASSIGNED'
  | 'LIMITED_INFO'
  | 'NOT_AVAILABLE'
  | 'NOT_IMPORTANT'
  | 'NOT_APPLICABLE'
  | 'OUT_OF_UNIVERSE';

export type TreeLevel = 'TOTAL' | 'PILLAR' | 'METRIC';

export interface EsgImpactScore {
  id: string;
  pillar: string;
  treeLevel: TreeLevel;
  score: number;
  metadata: ScoreMetadata;
  relevance?: number;
}

export interface EsgImpactSummaryResponse {
  portfolioName: string;
  totalOrganizations: number;
  coverageOrganizations: number;
  coverageWeight: number;
  totalCompanies: number;
  esgImpactCoverage: number;
  scores: EsgImpactScore[];
}

export interface EsgImpactScoresByIdResponse {
  portfolioName: string;
  totalOrganizations: number;
  coverageOrganizations: number;
  coverageWeight: number;
  scores: EsgImpactScore[];
}

// ============================================
// Climate / TCFD
// ============================================

export interface TcfdValue {
  id: string;
  value: number;
  unit: string;
  metadata?: ScoreMetadata;
}

export interface TcfdValuesResponse {
  portfolioName: string;
  values: TcfdValue[];
  coverage?: number;
}

// ============================================
// SDG (Sustainable Development Goals)
// ============================================

export interface SdgScore {
  sdgId: number;
  sdgName: string;
  positiveRevenue: number;
  negativeRevenue: number;
  netRevenue: number;
}

export interface SdgSummaryResponse {
  portfolioName: string;
  sdgScores: SdgScore[];
  totalPositiveRevenue: number;
  totalNegativeRevenue: number;
}

// ============================================
// Exposures
// ============================================

export interface ExposureItem {
  securityId: string;
  securityName: string;
  weight: number;
  esgScore?: number;
  environmentalScore?: number;
  socialScore?: number;
  governanceScore?: number;
  climateRating?: number;
}

export interface ExposuresResponse {
  portfolioName: string;
  exposures: ExposureItem[];
  totalWeight: number;
}

// ============================================
// Async Job (Universe API)
// ============================================

export type JobStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export interface JobStatusResponse {
  statusMessage: JobStatus;
  progress?: number;
}

export interface CreateJobResponse {
  uuid: string;
}

// ============================================
// API Errors
// ============================================

export interface ApiError {
  code: number;
  message: string;
}

// ============================================
// Aggregated Portfolio Data
// ============================================

export interface PortfolioAnalysisResult {
  portfolioId: string;
  portfolioName: string;
  positionCount: number;
  esgImpact: EsgImpactSummaryResponse;
  tcfd: TcfdValuesResponse;
  sdg: SdgSummaryResponse;
  exposures: ExposuresResponse;
}

// ============================================
// SSE Stream Events
// ============================================

export type AnalysisStage =
  | 'creating'
  | 'processing'
  | 'esg_impact'
  | 'climate'
  | 'sdg'
  | 'exposures'
  | 'complete'
  | 'error';

export interface StreamEvent {
  stage: AnalysisStage;
  progress: number;
  message?: string;
  data?: Partial<PortfolioAnalysisResult>;
  error?: string;
}

// ============================================
// Internal Types (for our app)
// ============================================

export interface Holding {
  id: string;
  idType: SecurityIdType;
  name: string;
  ticker?: string;
  weight: number; // 0-1 (e.g., 0.032 = 3.2%)
  type: 'US_FUND' | 'INTL_FUND' | 'LP' | 'SMA';
}

export interface AnalysisPreview {
  esgScore?: number;
  environmentalScore?: number;
  socialScore?: number;
  governanceScore?: number;
  climateRating?: number;
  netZeroCoverage?: number;
}
