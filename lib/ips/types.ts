/**
 * Investment Policy Statement (IPS) Types
 */

export interface IPSFields {
  // Section I: Relationship Summary
  clientName: string;
  familyOrgName: string;
  advisorName: string;
  advisorEmail: string;
  portfolioValue: string;
  entityStructure: string;

  // Section II: Tax Considerations
  taxStatus: string;
  taxSitus: string;
  taxLossHarvesting: boolean;

  // Section III: Investment Considerations
  riskTolerance: string;
  timeHorizon: string;
  liquidityRestrictions: string;
  esgInterest: 'significant' | 'moderate' | 'not_interested';
  impactApproach: string;
  exclusions: string[];
  screens: string[];
  tilts: string[];
  inclusivePriorities: string[];
  climatePriorities: string[];
  accreditedInvestor: boolean;
  qualifiedPurchaser: boolean;

  // Section IV: Investment Objective
  investmentObjective: string;
  useArchetypeAllocation: boolean;

  // Section V: Risk Allocation
  allocation: AllocationTable;

  // Section VI: Authorization (manual)
  authorizedIndividuals: string[];
  consultantInfo: string;

  // Section VII: Other Comments
  additionalNotes: string;

  // Section VIII: Review & Signatures
  signatureDate: string;
  clientTitle: string;

  // Archetype Info (if applicable)
  topArchetype?: string;
  archetypeScores?: Record<string, { score: number; percentage: number; rank: number }>;
}

export interface AllocationTable {
  stability: { target: number; lowerBand: number; upperBand: number };
  diversified: { target: number; lowerBand: number; upperBand: number };
  growth: { target: number; lowerBand: number; upperBand: number };
  privateMarkets?: { target: number; lowerBand: number; upperBand: number };
}

// Traditional allocations (for non-ESG interested clients)
export const TRADITIONAL_ALLOCATIONS: Record<string, AllocationTable> = {
  Conservative: {
    stability: { target: 46, lowerBand: 35, upperBand: 61 },
    diversified: { target: 25, lowerBand: 14, upperBand: 40 },
    growth: { target: 29, lowerBand: 18, upperBand: 44 },
  },
  Balanced: {
    stability: { target: 29, lowerBand: 18, upperBand: 44 },
    diversified: { target: 23, lowerBand: 12, upperBand: 38 },
    growth: { target: 48, lowerBand: 37, upperBand: 63 },
  },
  'Moderate Growth': {
    stability: { target: 24, lowerBand: 13, upperBand: 39 },
    diversified: { target: 20, lowerBand: 9, upperBand: 35 },
    growth: { target: 56, lowerBand: 45, upperBand: 71 },
  },
  Growth: {
    stability: { target: 15, lowerBand: 4, upperBand: 30 },
    diversified: { target: 20, lowerBand: 9, upperBand: 35 },
    growth: { target: 65, lowerBand: 54, upperBand: 80 },
  },
  'Long Term Growth': {
    stability: { target: 9, lowerBand: 0, upperBand: 24 },
    diversified: { target: 15, lowerBand: 4, upperBand: 30 },
    growth: { target: 76, lowerBand: 65, upperBand: 91 },
  },
};

// Archetype-based allocations (for ESG interested clients)
export const ARCHETYPE_ALLOCATIONS: Record<string, AllocationTable> = {
  '100% Impact': {
    stability: { target: 20, lowerBand: 9, upperBand: 35 },
    diversified: { target: 20, lowerBand: 9, upperBand: 35 },
    growth: { target: 45, lowerBand: 34, upperBand: 60 },
    privateMarkets: { target: 15, lowerBand: 5, upperBand: 25 },
  },
  'Inclusive Innovation': {
    stability: { target: 25, lowerBand: 14, upperBand: 40 },
    diversified: { target: 15, lowerBand: 4, upperBand: 30 },
    growth: { target: 45, lowerBand: 34, upperBand: 60 },
    privateMarkets: { target: 15, lowerBand: 5, upperBand: 25 },
  },
  'Climate Sustainability': {
    stability: { target: 20, lowerBand: 9, upperBand: 35 },
    diversified: { target: 20, lowerBand: 9, upperBand: 35 },
    growth: { target: 45, lowerBand: 34, upperBand: 60 },
    privateMarkets: { target: 15, lowerBand: 5, upperBand: 25 },
  },
  'Integrated Best Ideas': {
    stability: { target: 20, lowerBand: 9, upperBand: 35 },
    diversified: { target: 20, lowerBand: 9, upperBand: 35 },
    growth: { target: 45, lowerBand: 34, upperBand: 60 },
    privateMarkets: { target: 15, lowerBand: 5, upperBand: 25 },
  },
};

// Archetype ID to display name mapping
export const ARCHETYPE_DISPLAY_NAMES: Record<string, string> = {
  impact_100: '100% Impact',
  inclusive_innovation: 'Inclusive Innovation',
  climate_sustainability: 'Climate Sustainability',
  integrated_best_ideas: 'Integrated Best Ideas',
};
