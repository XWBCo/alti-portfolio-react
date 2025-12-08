/**
 * IPS Field Mapper
 * Maps client survey data to IPS document fields
 */

import type { ClientSurvey, SurveyQuestion, ArchetypeId } from '../client-assessment-types';
import type { IPSFields, AllocationTable } from './types';
import {
  TRADITIONAL_ALLOCATIONS,
  ARCHETYPE_ALLOCATIONS,
  ARCHETYPE_DISPLAY_NAMES,
} from './types';

/**
 * Map client survey to IPS fields
 */
export function mapSurveyToIPS(client: ClientSurvey): IPSFields {
  const esgInterest = getESGInterest(client.questions);
  const useArchetypeAllocation = esgInterest !== 'not_interested';
  const topArchetype = getTopArchetype(client.archetypeScores);
  const topArchetypeName = ARCHETYPE_DISPLAY_NAMES[topArchetype] || topArchetype;

  // Determine allocation based on ESG interest
  const allocation = useArchetypeAllocation
    ? ARCHETYPE_ALLOCATIONS[topArchetypeName] || ARCHETYPE_ALLOCATIONS['Integrated Best Ideas']
    : TRADITIONAL_ALLOCATIONS['Moderate Growth'];

  return {
    // Section I: Relationship Summary
    clientName: client.clientInfo.client,
    familyOrgName: client.clientInfo.family,
    advisorName: client.clientInfo.advisor,
    advisorEmail: client.clientInfo.email,
    portfolioValue: client.clientInfo.portfolioValue,
    entityStructure: client.clientInfo.entityStructure,

    // Section II: Tax Considerations
    taxStatus: inferTaxStatus(client.clientInfo.entityStructure),
    taxSitus: client.clientInfo.location,
    taxLossHarvesting: inferTaxStatus(client.clientInfo.entityStructure) === 'Taxable',

    // Section III: Investment Considerations
    riskTolerance: inferRiskTolerance(client.questions),
    timeHorizon: getQuestionResponse(client.questions, '13') || 'Long (7-15 years)',
    liquidityRestrictions: getQuestionResponse(client.questions, '25') || '0%',
    esgInterest,
    impactApproach: formatImpactApproach(esgInterest, topArchetypeName),
    exclusions: getMultiSelectResponse(client.questions, '44'),
    screens: getMultiSelectResponse(client.questions, '77'),
    tilts: getMultiSelectResponse(client.questions, '78'),
    inclusivePriorities: getMultiSelectResponse(client.questions, '50'),
    climatePriorities: getMultiSelectResponse(client.questions, '52'),
    accreditedInvestor: true, // Assumed for wealth management clients
    qualifiedPurchaser: parsePortfolioValue(client.clientInfo.portfolioValue) >= 5000000,

    // Section IV: Investment Objective
    investmentObjective: useArchetypeAllocation
      ? `${topArchetypeName} Archetype-based Allocation`
      : 'Moderate Growth',
    useArchetypeAllocation,

    // Section V: Risk Allocation
    allocation,

    // Section VI: Authorization (manual fields)
    authorizedIndividuals: [],
    consultantInfo: '[To be completed by advisor]',

    // Section VII: Other Comments
    additionalNotes: getQuestionResponse(client.questions, '32') || '',

    // Section VIII: Review & Signatures
    signatureDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    clientTitle: 'Authorized Signatory',

    // Archetype Info
    topArchetype: topArchetypeName,
    archetypeScores: client.archetypeScores,
  };
}

/**
 * Get ESG interest level from Q6 response
 */
function getESGInterest(questions: SurveyQuestion[]): 'significant' | 'moderate' | 'not_interested' {
  const response = getQuestionResponse(questions, '6');
  if (!response) return 'not_interested';

  const responseLower = response.toLowerCase();
  if (responseLower.includes('significant')) return 'significant';
  if (responseLower.includes('moderate')) return 'moderate';
  return 'not_interested';
}

/**
 * Get top archetype by rank
 */
function getTopArchetype(
  scores: Record<ArchetypeId, { score: number; percentage: number; rank: number }>
): ArchetypeId {
  const entries = Object.entries(scores) as [ArchetypeId, { rank: number }][];
  const top = entries.find(([, data]) => data.rank === 1);
  return top ? top[0] : 'impact_100';
}

/**
 * Infer tax status from entity structure
 */
function inferTaxStatus(entityStructure: string): string {
  const lower = entityStructure.toLowerCase();
  if (lower.includes('foundation')) return 'Tax-Exempt';
  if (lower.includes('trust') || lower.includes('llc') || lower.includes('family office')) {
    return 'Taxable';
  }
  return 'Taxable';
}

/**
 * Infer risk tolerance from Q11 rankings
 */
function inferRiskTolerance(questions: SurveyQuestion[]): string {
  const q11 = questions.find((q) => q.qNumber === '11');
  if (!q11 || !Array.isArray(q11.response)) return 'Moderate';

  // Check what's ranked first
  const rankings = q11.response as { option: string; rank: number }[];
  const topRank = rankings.find((r) => r.rank === 1);

  if (!topRank) return 'Moderate';

  const optionLower = topRank.option.toLowerCase();
  if (optionLower.includes('preservation') || optionLower.includes('protection')) {
    return 'Low';
  }
  if (optionLower.includes('impact') || optionLower.includes('growth')) {
    return 'High';
  }
  return 'Moderate';
}

/**
 * Get question response by question number
 */
function getQuestionResponse(questions: SurveyQuestion[], qNumber: string): string | null {
  const question = questions.find((q) => q.qNumber === qNumber);
  if (!question) return null;

  if (typeof question.response === 'string') {
    return question.response;
  }
  if (Array.isArray(question.response)) {
    if (question.response.length === 0) return null;
    if (typeof question.response[0] === 'string') {
      return (question.response as string[]).join(', ');
    }
    // Ranking response - return first ranked option
    const rankings = question.response as { option: string; rank: number }[];
    const top = rankings.find((r) => r.rank === 1);
    return top ? top.option : null;
  }
  return null;
}

/**
 * Get multi-select response as array
 */
function getMultiSelectResponse(questions: SurveyQuestion[], qNumber: string): string[] {
  const question = questions.find((q) => q.qNumber === qNumber);
  if (!question) return [];

  if (Array.isArray(question.response)) {
    return question.response
      .filter((r): r is string => typeof r === 'string')
      .map((r) => r.trim());
  }
  return [];
}

/**
 * Parse portfolio value string to number
 */
function parsePortfolioValue(value: string): number {
  const match = value.match(/\$?([\d,]+)/);
  if (!match) return 0;
  const num = parseInt(match[1].replace(/,/g, ''), 10);
  if (value.toLowerCase().includes('m')) return num * 1_000_000;
  if (value.toLowerCase().includes('b')) return num * 1_000_000_000;
  return num;
}

/**
 * Format impact approach description
 */
function formatImpactApproach(
  esgInterest: 'significant' | 'moderate' | 'not_interested',
  archetype: string
): string {
  switch (esgInterest) {
    case 'significant':
      return `${archetype} - Client has expressed significant interest in impact investing with comprehensive ESG integration across the portfolio.`;
    case 'moderate':
      return `${archetype} - Client has expressed moderate interest in impact investing with ESG considerations integrated alongside financial objectives.`;
    default:
      return 'Traditional investment approach with ESG risk screening where appropriate.';
  }
}
