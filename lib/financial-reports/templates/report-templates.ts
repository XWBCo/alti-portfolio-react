// ============================================================================
// Report Template Presets
// Pre-configured report layouts that users can customize
// ============================================================================

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  sections: ReportSectionConfig[];
  defaultOptions: ReportTemplateOptions;
}

export interface ReportSectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  options?: Record<string, unknown>;
}

export interface ReportTemplateOptions {
  holdingsLimit: number;
  showBenchmark: boolean;
  showWaterfallChart: boolean;
  performancePeriods: string[];
  includeDisclaimer: boolean;
}

// ============================================================================
// PRESET TEMPLATES
// ============================================================================

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'Concise 2-page overview for quick client reviews',
    icon: '📋',
    sections: [
      { id: 'summary', name: 'Portfolio Summary', enabled: true, order: 1 },
      { id: 'allocation', name: 'Asset Allocation', enabled: true, order: 2 },
      { id: 'performance', name: 'Performance', enabled: true, order: 3 },
      { id: 'holdings', name: 'Holdings', enabled: false, order: 4 },
      { id: 'accounts', name: 'Accounts', enabled: false, order: 5 },
    ],
    defaultOptions: {
      holdingsLimit: 5,
      showBenchmark: true,
      showWaterfallChart: false,
      performancePeriods: ['YTD', '1Y'],
      includeDisclaimer: true,
    },
  },
  {
    id: 'detailed-analysis',
    name: 'Detailed Analysis',
    description: 'Comprehensive 4-page report with full holdings and performance',
    icon: '📊',
    sections: [
      { id: 'summary', name: 'Portfolio Summary', enabled: true, order: 1 },
      { id: 'allocation', name: 'Asset Allocation', enabled: true, order: 2 },
      { id: 'performance', name: 'Performance', enabled: true, order: 3 },
      { id: 'holdings', name: 'Holdings', enabled: true, order: 4 },
      { id: 'accounts', name: 'Accounts', enabled: true, order: 5 },
    ],
    defaultOptions: {
      holdingsLimit: 12,
      showBenchmark: true,
      showWaterfallChart: true,
      performancePeriods: ['QTD', 'YTD', '1Y', '3Y'],
      includeDisclaimer: true,
    },
  },
  {
    id: 'performance-focus',
    name: 'Performance Focus',
    description: 'Emphasis on returns and benchmark comparison',
    icon: '📈',
    sections: [
      { id: 'summary', name: 'Portfolio Summary', enabled: true, order: 1 },
      { id: 'performance', name: 'Performance', enabled: true, order: 2 },
      { id: 'allocation', name: 'Asset Allocation', enabled: true, order: 3 },
      { id: 'holdings', name: 'Holdings', enabled: false, order: 4 },
      { id: 'accounts', name: 'Accounts', enabled: false, order: 5 },
    ],
    defaultOptions: {
      holdingsLimit: 5,
      showBenchmark: true,
      showWaterfallChart: true,
      performancePeriods: ['MTD', 'QTD', 'YTD', '1Y', '3Y', '5Y'],
      includeDisclaimer: true,
    },
  },
  {
    id: 'compliance',
    name: 'Compliance Report',
    description: 'Full disclosure report for regulatory requirements',
    icon: '📑',
    sections: [
      { id: 'summary', name: 'Portfolio Summary', enabled: true, order: 1 },
      { id: 'allocation', name: 'Asset Allocation', enabled: true, order: 2 },
      { id: 'performance', name: 'Performance', enabled: true, order: 3 },
      { id: 'holdings', name: 'Holdings', enabled: true, order: 4 },
      { id: 'accounts', name: 'Accounts', enabled: true, order: 5 },
    ],
    defaultOptions: {
      holdingsLimit: 25,
      showBenchmark: true,
      showWaterfallChart: true,
      performancePeriods: ['MTD', 'QTD', 'YTD', '1Y', '3Y', '5Y', 'SI'],
      includeDisclaimer: true,
    },
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getTemplateById(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find(t => t.id === id);
}

export function getDefaultTemplate(): ReportTemplate {
  return REPORT_TEMPLATES.find(t => t.id === 'detailed-analysis') || REPORT_TEMPLATES[0];
}

export function getSectionsByTemplate(templateId: string): ReportSectionConfig[] {
  const template = getTemplateById(templateId);
  return template ? [...template.sections].sort((a, b) => a.order - b.order) : [];
}

export function createCustomTemplate(
  baseTemplateId: string,
  customizations: Partial<ReportTemplate>
): ReportTemplate {
  const base = getTemplateById(baseTemplateId) || getDefaultTemplate();
  return {
    ...base,
    id: 'custom',
    name: customizations.name || 'Custom Report',
    ...customizations,
  };
}

// Convert template to sections config for existing report generator
export function templateToSections(template: ReportTemplate): Record<string, boolean> {
  const sections: Record<string, boolean> = {};
  template.sections.forEach(s => {
    sections[s.id] = s.enabled;
  });
  return sections;
}
