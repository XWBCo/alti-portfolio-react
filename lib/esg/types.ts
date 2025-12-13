// ESG Pipeline Types

export interface Relationship {
  id: string;
  name: string;
  totalValue: number;
  esgScore: number | null;
  environmentalScore: number | null;
  socialScore: number | null;
  governanceScore: number | null;
  coverage: number;
  lastUpdated: string | null;
}

export interface Entity {
  id: string;
  relationshipId: string;
  name: string;
  entityType: string;
  totalValue: number;
  esgScore: number | null;
}

export interface Holding {
  entityId: string;
  securityName: string;
  isin: string | null;
  cusip: string | null;
  ticker: string | null;
  value: number;
  weight: number;
  esgScore: number | null;
  environmentalScore: number | null;
  socialScore: number | null;
  governanceScore: number | null;
}

export interface ESGScore {
  isin?: string;
  cusip?: string;
  governanceScore: number | null;
  environmentalScore: number | null;
  socialScore: number | null;
  overallScore: number | null;
}

export interface ESGDatabase {
  relationships: Record<string, Relationship>;
  entities: Record<string, Entity>;
  holdings: Holding[];
  esgScores: ESGScore[];
  lastUpdated: string;
}

export interface PortfolioHolding {
  securityName: string;
  isin: string | null;
  cusip: string | null;
  ticker: string | null;
  value: number;
  entityName: string;
  entityId: string;
}

export interface WeightedESGResult {
  totalValue: number;
  coveredValue: number;
  coverage: number;
  overallScore: number | null;
  environmentalScore: number | null;
  socialScore: number | null;
  governanceScore: number | null;
  holdings: Array<PortfolioHolding & { esgScore: ESGScore | null }>;
}
