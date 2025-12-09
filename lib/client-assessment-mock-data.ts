/**
 * Client Assessment Mock Data
 * Pre-computed archetype scores for demonstration
 */

import type { ClientSurvey, ArchetypeId } from './client-assessment-types';

export const MOCK_CLIENTS: ClientSurvey[] = [
  {
    id: 'daffy-duck',
    clientInfo: {
      family: 'DD Enterprises',
      client: 'Daffy Duck',
      advisor: 'Donovan Ervin',
      email: 'donovan.ervin@alti-global.com',
      portfolioValue: '$100-200M',
      location: 'United States',
      entityStructure: 'Trust',
    },
    impactInterest: 'significant',
    isImpactClient: true,
    archetypeScores: {
      impact_100: { score: 485, percentage: 59, rank: 1 },
      climate_sustainability: { score: 420, percentage: 51, rank: 2 },
      inclusive_innovation: { score: 380, percentage: 46, rank: 3 },
      integrated_best_ideas: { score: 195, percentage: 24, rank: 4 },
    },
    questions: [
      {
        qNumber: '6',
        category: 'Background',
        question: 'How would you describe your interest in impact or ESG investing?',
        response: 'Significant',
        responseType: 'text',
      },
      {
        qNumber: '11',
        category: 'Risk & Suitability',
        question: 'Rank your portfolio objectives in order of importance:',
        response: [
          { option: 'Drive meaningful environmental and social impact', rank: 1 },
          { option: 'Long-term growth to support lifestyle and philanthropic goals', rank: 2 },
          { option: 'Wealth preservation and capital protection', rank: 3 },
          { option: 'Perpetual wealth for future generations', rank: 4 },
        ],
        responseType: 'ranking',
      },
      {
        qNumber: '12',
        category: 'Risk & Suitability',
        question: 'How do you prefer to evaluate portfolio performance?',
        response: [
          { option: 'Value social/environmental outcomes alongside financial performance', rank: 1 },
          { option: 'Look at portfolio returns over a longer time frame', rank: 2 },
          { option: 'Watch the portfolio closely', rank: 3 },
          { option: 'Review vs benchmark quarterly', rank: 4 },
        ],
        responseType: 'ranking',
      },
      {
        qNumber: '36',
        category: 'Impact Preferences',
        question: 'How do you balance financial returns and impact?',
        response: 'Accept potential return trade-offs for greater impact',
        responseType: 'text',
      },
      {
        qNumber: '41',
        category: 'Impact Preferences',
        question: 'Bond portfolio alignment preference:',
        response: 'Blend of green bonds and social bonds',
        responseType: 'text',
      },
      {
        qNumber: '50',
        category: 'Impact Preferences',
        question: 'Inclusive investment priorities:',
        response: ['Affordable housing', 'Healthcare access', 'Financial inclusion'],
        responseType: 'multiselect',
      },
      {
        qNumber: '52',
        category: 'Impact Preferences',
        question: 'Climate investment priorities:',
        response: ['Renewable energy', 'Energy efficiency', 'Sustainable agriculture'],
        responseType: 'multiselect',
      },
      {
        qNumber: '63',
        category: 'Final Feedback',
        question: 'Views on public market investing:',
        response: [
          { option: 'Values-based alignment is the main priority', rank: 1 },
          { option: 'Market performance expected but values matter', rank: 2 },
          { option: 'Specific impact goal: climate', rank: 3 },
        ],
        responseType: 'ranking',
      },
    ],
    submittedDate: '2024-10-09',
  },
  {
    id: 'teresa-wells',
    clientInfo: {
      family: 'Wells Family Office',
      client: 'Teresa Wells',
      advisor: 'Teresa Wells',
      email: 'teresa.wells@alti-global.com',
      portfolioValue: '$50-100M',
      location: 'United States',
      entityStructure: 'Family Office',
    },
    impactInterest: 'significant',
    isImpactClient: true,
    archetypeScores: {
      climate_sustainability: { score: 520, percentage: 63, rank: 1 },
      impact_100: { score: 410, percentage: 50, rank: 2 },
      inclusive_innovation: { score: 320, percentage: 39, rank: 3 },
      integrated_best_ideas: { score: 180, percentage: 22, rank: 4 },
    },
    questions: [
      {
        qNumber: '6',
        category: 'Background',
        question: 'How would you describe your interest in impact or ESG investing?',
        response: 'Significant',
        responseType: 'text',
      },
      {
        qNumber: '11',
        category: 'Risk & Suitability',
        question: 'Rank your portfolio objectives in order of importance:',
        response: [
          { option: 'Drive meaningful environmental and social impact', rank: 1 },
          { option: 'Wealth preservation and capital protection', rank: 2 },
          { option: 'Long-term growth to support lifestyle and philanthropic goals', rank: 3 },
          { option: 'Perpetual wealth for future generations', rank: 4 },
        ],
        responseType: 'ranking',
      },
      {
        qNumber: '36',
        category: 'Impact Preferences',
        question: 'How do you balance financial returns and impact?',
        response: 'Prioritize maximum impact with returns as secondary',
        responseType: 'text',
      },
      {
        qNumber: '46',
        category: 'Impact Preferences',
        question: 'Natural gas holdings preference:',
        response: 'Do not wish to hold natural gas investments',
        responseType: 'text',
      },
      {
        qNumber: '52',
        category: 'Impact Preferences',
        question: 'Climate investment priorities:',
        response: ['Renewable energy', 'Carbon removal', 'Sustainable transportation', 'Green buildings'],
        responseType: 'multiselect',
      },
    ],
    submittedDate: '2024-10-01',
  },
  {
    id: 'john-smith',
    clientInfo: {
      family: 'Smith Holdings',
      client: 'John Smith',
      advisor: 'Xavier Court',
      email: 'xavier.court@alti-global.com',
      portfolioValue: '$200-500M',
      location: 'United States',
      entityStructure: 'LLC',
    },
    impactInterest: 'moderate',
    isImpactClient: true,
    archetypeScores: {
      integrated_best_ideas: { score: 480, percentage: 58, rank: 1 },
      impact_100: { score: 310, percentage: 38, rank: 2 },
      climate_sustainability: { score: 280, percentage: 34, rank: 3 },
      inclusive_innovation: { score: 250, percentage: 30, rank: 4 },
    },
    questions: [
      {
        qNumber: '6',
        category: 'Background',
        question: 'How would you describe your interest in impact or ESG investing?',
        response: 'Moderate',
        responseType: 'text',
      },
      {
        qNumber: '11',
        category: 'Risk & Suitability',
        question: 'Rank your portfolio objectives in order of importance:',
        response: [
          { option: 'Long-term growth to support lifestyle and philanthropic goals', rank: 1 },
          { option: 'Wealth preservation and capital protection', rank: 2 },
          { option: 'Perpetual wealth for future generations', rank: 3 },
          { option: 'Drive meaningful environmental and social impact', rank: 4 },
        ],
        responseType: 'ranking',
      },
      {
        qNumber: '36',
        category: 'Impact Preferences',
        question: 'How do you balance financial returns and impact?',
        response: 'Competitive financial performance with measurable impact',
        responseType: 'text',
      },
      {
        qNumber: '41',
        category: 'Impact Preferences',
        question: 'Bond portfolio alignment preference:',
        response: 'Traditional bond approach',
        responseType: 'text',
      },
      {
        qNumber: '63',
        category: 'Final Feedback',
        question: 'Views on public market investing:',
        response: [
          { option: 'Outperformance is the main priority', rank: 1 },
          { option: 'Market performance expected but values matter', rank: 2 },
          { option: 'Values-based alignment is the main priority', rank: 3 },
        ],
        responseType: 'ranking',
      },
    ],
    submittedDate: '2024-09-30',
  },
  // Non-impact client example
  {
    id: 'robert-chen',
    clientInfo: {
      family: 'Chen Family Trust',
      client: 'Robert Chen',
      advisor: 'Sarah Johnson',
      email: 'sarah.johnson@alti-global.com',
      portfolioValue: '$75-150M',
      location: 'United States',
      entityStructure: 'Trust',
    },
    impactInterest: 'none',
    isImpactClient: false,
    riskProfile: {
      riskTolerance: 'growth',
      portfolioType: 'traditional',
      timeHorizon: '10-15 years',
      liquidityNeeds: 'Low - can tolerate illiquidity',
      taxStatus: 'taxable',
    },
    questions: [
      {
        qNumber: '6',
        category: 'Background',
        question: 'How would you describe your interest in impact or ESG investing?',
        response: 'None',
        responseType: 'text',
      },
      {
        qNumber: '7',
        category: 'Risk & Suitability',
        question: 'What is your primary investment objective?',
        response: 'Maximize long-term capital appreciation',
        responseType: 'text',
      },
      {
        qNumber: '8',
        category: 'Risk & Suitability',
        question: 'What is your investment time horizon?',
        response: '10-15 years',
        responseType: 'text',
      },
      {
        qNumber: '9',
        category: 'Risk & Suitability',
        question: 'How would you describe your risk tolerance?',
        response: 'Above average - comfortable with volatility for higher returns',
        responseType: 'text',
      },
      {
        qNumber: '10',
        category: 'Risk & Suitability',
        question: 'What are your liquidity needs?',
        response: 'Low - can tolerate illiquidity for better returns',
        responseType: 'text',
      },
      {
        qNumber: '11',
        category: 'Risk & Suitability',
        question: 'Rank your portfolio objectives in order of importance:',
        response: [
          { option: 'Long-term growth to support lifestyle and philanthropic goals', rank: 1 },
          { option: 'Wealth preservation and capital protection', rank: 2 },
          { option: 'Perpetual wealth for future generations', rank: 3 },
          { option: 'Drive meaningful environmental and social impact', rank: 4 },
        ],
        responseType: 'ranking',
      },
      {
        qNumber: '12',
        category: 'Final Feedback',
        question: 'Views on public market investing:',
        response: [
          { option: 'Outperformance is the main priority', rank: 1 },
          { option: 'Market performance expected but values matter', rank: 2 },
        ],
        responseType: 'ranking',
      },
    ],
    submittedDate: '2024-11-15',
  },
  // Another non-impact client - Endowment style
  {
    id: 'margaret-wilson',
    clientInfo: {
      family: 'Wilson Foundation',
      client: 'Margaret Wilson',
      advisor: 'Michael Davis',
      email: 'michael.davis@alti-global.com',
      portfolioValue: '$300-500M',
      location: 'United States',
      entityStructure: 'Foundation',
    },
    impactInterest: 'minimal',
    isImpactClient: false,
    riskProfile: {
      riskTolerance: 'moderate_growth',
      portfolioType: 'endowment',
      timeHorizon: 'Perpetual',
      liquidityNeeds: 'Moderate - 5% annual distribution',
      taxStatus: 'tax-exempt',
    },
    questions: [
      {
        qNumber: '6',
        category: 'Background',
        question: 'How would you describe your interest in impact or ESG investing?',
        response: 'Minimal',
        responseType: 'text',
      },
      {
        qNumber: '7',
        category: 'Risk & Suitability',
        question: 'What is your primary investment objective?',
        response: 'Preserve real purchasing power while supporting foundation mission',
        responseType: 'text',
      },
      {
        qNumber: '8',
        category: 'Risk & Suitability',
        question: 'What is your investment time horizon?',
        response: 'Perpetual - intergenerational wealth',
        responseType: 'text',
      },
      {
        qNumber: '9',
        category: 'Risk & Suitability',
        question: 'How would you describe your risk tolerance?',
        response: 'Moderate - willing to accept short-term volatility for long-term growth',
        responseType: 'text',
      },
      {
        qNumber: '10',
        category: 'Risk & Suitability',
        question: 'What are your liquidity needs?',
        response: 'Moderate - need to support 5% annual distribution',
        responseType: 'text',
      },
      {
        qNumber: '11',
        category: 'Risk & Suitability',
        question: 'Rank your portfolio objectives in order of importance:',
        response: [
          { option: 'Perpetual wealth for future generations', rank: 1 },
          { option: 'Wealth preservation and capital protection', rank: 2 },
          { option: 'Long-term growth to support lifestyle and philanthropic goals', rank: 3 },
          { option: 'Drive meaningful environmental and social impact', rank: 4 },
        ],
        responseType: 'ranking',
      },
    ],
    submittedDate: '2024-11-20',
  },
];

// Helper to get client by ID
export function getClientById(id: string): ClientSurvey | undefined {
  return MOCK_CLIENTS.find((c) => c.id === id);
}

// Helper to get top archetype (returns undefined if no scores)
export function getTopArchetype(
  scores?: Record<ArchetypeId, { rank: number }>
): ArchetypeId | undefined {
  if (!scores) return undefined;
  const entries = Object.entries(scores) as [ArchetypeId, { rank: number }][];
  const top = entries.find(([, data]) => data.rank === 1);
  return top ? top[0] : undefined;
}

// Helper to format questions by category
export function getQuestionsByCategory(
  questions: ClientSurvey['questions'],
  category: string
): ClientSurvey['questions'] {
  if (category === 'All') return questions;
  return questions.filter((q) => q.category === category);
}
