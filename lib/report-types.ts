// Report types for PowerPoint generation

export interface SlideContent {
  id: string;
  type: 'title' | 'metrics' | 'chart' | 'table' | 'summary';
  title: string;
  subtitle?: string;
  data?: Record<string, unknown>;
  included: boolean;
}

export interface ReportConfig {
  title: string;
  subtitle: string;
  date: string;
  preparedFor?: string;
  slides: SlideContent[];
}

export const DEFAULT_RISK_REPORT_SLIDES: SlideContent[] = [
  {
    id: 'title',
    type: 'title',
    title: 'Risk Contribution Analysis',
    subtitle: 'Portfolio Risk Assessment Report',
    included: true,
  },
  {
    id: 'metrics',
    type: 'metrics',
    title: 'Key Risk Metrics',
    subtitle: 'Portfolio volatility, VaR, and diversification',
    included: true,
  },
  {
    id: 'contribution-chart',
    type: 'chart',
    title: 'Risk Contribution vs Weight',
    subtitle: 'Asset-level risk analysis',
    included: true,
  },
  {
    id: 'stress-table',
    type: 'table',
    title: 'Stress Scenario Analysis',
    subtitle: 'Historical drawdown analysis',
    included: true,
  },
  {
    id: 'summary',
    type: 'summary',
    title: 'Summary & Recommendations',
    subtitle: 'Key takeaways',
    included: true,
  },
];

// Brand colors
export const ALTI_COLORS = {
  primary: '#010203',      // Near black
  secondary: '#074269',    // Deep blue
  accent: '#00f0db',       // Turquoise
  accentDark: '#0B6D7B',   // Dark teal
  white: '#FFFFFF',
  gray: '#757575',
  lightGray: '#f8f9fa',
  border: '#e6e6e6',
};
