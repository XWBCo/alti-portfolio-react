/**
 * Client Assessment Types
 */

export type ArchetypeId =
  | 'impact_100'
  | 'inclusive_innovation'
  | 'climate_sustainability'
  | 'integrated_best_ideas';

export interface ClientInfo {
  family: string;
  client: string;
  advisor: string;
  email: string;
  portfolioValue: string;
  location: string;
  entityStructure: string;
}

export interface ArchetypeScore {
  score: number;
  percentage: number;
  rank: number;
}

export interface ArchetypeDetail {
  id: ArchetypeId;
  name: string;
  description: string;
  color: string;
  whyMatch: string[];
  whyNotMatch: string[];
  areasOfAlignment: string[];
}

export interface SurveyQuestion {
  qNumber: string;
  category: string;
  question: string;
  response: string | string[] | { option: string; rank: number }[];
  responseType: 'text' | 'multiselect' | 'ranking';
}

export interface ClientSurvey {
  id: string;
  clientInfo: ClientInfo;
  archetypeScores: Record<ArchetypeId, ArchetypeScore>;
  questions: SurveyQuestion[];
  submittedDate: string;
}

// Archetype metadata
export const ARCHETYPE_DETAILS: Record<ArchetypeId, ArchetypeDetail> = {
  impact_100: {
    id: 'impact_100',
    name: '100% Impact',
    description: 'Comprehensive measurable impact across all themes',
    color: '#0B6D7B',
    whyMatch: [
      'Balanced interest in climate and social impact',
      'High ESG priority across multiple themes',
      'Willing to accept impact-first returns',
      'Comprehensive exclusions and screens',
    ],
    whyNotMatch: [
      'Priorities suggest a more focused impact approach',
      'Less emphasis on comprehensive theme coverage',
      'Different balance between impact and returns',
    ],
    areasOfAlignment: [
      'Commitment to measurable impact outcomes',
      'Interest in diversified impact themes',
      'ESG integration across the portfolio',
    ],
  },
  inclusive_innovation: {
    id: 'inclusive_innovation',
    name: 'Inclusive Innovation',
    description: 'Social equity and inclusive economic growth',
    color: '#D351DE',
    whyMatch: [
      'Strong focus on social equity and diversity',
      'Interest in financial inclusion themes',
      'Community development priority',
      'Healthcare and education impact goals',
    ],
    whyNotMatch: [
      'Different social impact priorities',
      'Less emphasis on community development',
      'Different diversity and inclusion alignment',
    ],
    areasOfAlignment: [
      'Focus on social impact objectives',
      'Recognition of diversity and inclusion',
      'Interest in community-focused investments',
    ],
  },
  climate_sustainability: {
    id: 'climate_sustainability',
    name: 'Climate Sustainability',
    description: 'Environment-first investment approach',
    color: '#0A598C',
    whyMatch: [
      'Clear priority on environmental impact',
      'Net zero alignment and decarbonization goals',
      'Climate-focused investment preferences',
      'Renewable energy and sustainability themes',
    ],
    whyNotMatch: [
      'Broader impact focus beyond climate',
      'Less emphasis on environmental-first priorities',
      'Different balance between climate and other themes',
    ],
    areasOfAlignment: [
      'Recognition of environmental sustainability',
      'Interest in climate-aware strategies',
      'Support for renewable energy initiatives',
    ],
  },
  integrated_best_ideas: {
    id: 'integrated_best_ideas',
    name: 'Integrated Best Ideas',
    description: 'Strong returns with ESG screening',
    color: '#4A4A4A',
    whyMatch: [
      'Return maximization as primary goal',
      'ESG as risk management tool',
      'Moderate exclusions and screens',
      'Traditional allocation with ESG overlay',
    ],
    whyNotMatch: [
      'Stronger impact preferences indicated',
      'Less emphasis on returns-first approach',
      'Different ESG vs impact balance',
    ],
    areasOfAlignment: [
      'Focus on risk-adjusted returns',
      'Integration of ESG factors',
      'Preference for established strategies',
    ],
  },
};

export const QUESTION_CATEGORIES = [
  'Background',
  'Risk & Suitability',
  'Impact Preferences',
  'Final Feedback',
] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
