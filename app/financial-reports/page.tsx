'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  REPORT_TEMPLATES,
  type ReportTemplate,
  getDefaultTemplate,
  templateToSections,
} from '@/lib/financial-reports/templates/report-templates';

type ReportType = 'client' | 'advisor' | 'firm';
type OutputFormat = 'pdf' | 'html' | 'excel' | 'csv';

interface Client {
  id: number;
  name: string;
  household: string;
  aum: number;
  aumFormatted: string;
  advisor: string;
  status: 'on-track' | 'needs-attention' | 'at-risk';
}

interface Advisor {
  index: number;
  id: string;
  name: string;
  team: string;
  role: string;
  clientCount: number;
  aum: number;
  aumFormatted: string;
}

interface DatePreset {
  label: string;
  getValue: () => { start: string; end: string };
}

interface ReportSections {
  summary: boolean;
  performance: boolean;
  allocation: boolean;
  holdings: boolean;
  accounts: boolean;
  benchmark: boolean;
}

const DATE_PRESETS: DatePreset[] = [
  {
    label: 'YTD',
    getValue: () => {
      const now = new Date();
      return {
        start: `${now.getFullYear()}-01-01`,
        end: now.toISOString().split('T')[0],
      };
    },
  },
  {
    label: 'Last Month',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    },
  },
  {
    label: 'Last Quarter',
    getValue: () => {
      const now = new Date();
      const currentQ = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), (currentQ - 1) * 3, 1);
      const end = new Date(now.getFullYear(), currentQ * 3, 0);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    },
  },
  {
    label: '1 Year',
    getValue: () => {
      const now = new Date();
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      return {
        start: start.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      };
    },
  },
  {
    label: '3 Years',
    getValue: () => {
      const now = new Date();
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 3);
      return {
        start: start.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      };
    },
  },
];

const DEFAULT_SECTIONS: ReportSections = {
  summary: true,
  performance: true,
  allocation: true,
  holdings: true,
  accounts: true,
  benchmark: true,
};

const SECTION_LABELS: Record<keyof ReportSections, string> = {
  summary: 'Executive Summary',
  performance: 'Performance Analysis',
  allocation: 'Asset Allocation',
  holdings: 'Holdings Detail',
  accounts: 'Account Details',
  benchmark: 'Benchmark Comparison',
};

export default function FinancialReportsPage() {
  // Report type & format
  const [selectedType, setSelectedType] = useState<ReportType>('client');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('html');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Client selection
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number>(0);
  const [clientSearch, setClientSearch] = useState('');
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // Advisor selection
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [selectedAdvisorIndex, setSelectedAdvisorIndex] = useState<number>(0);
  const [isLoadingAdvisors, setIsLoadingAdvisors] = useState(false);

  // Date range
  const [datePreset, setDatePreset] = useState<string>('YTD');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report sections
  const [sections, setSections] = useState<ReportSections>(DEFAULT_SECTIONS);

  // Report template
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>(getDefaultTemplate());

  // Apply template when changed
  const handleTemplateChange = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    const templateSections = templateToSections(template);
    setSections({
      summary: templateSections.summary ?? true,
      performance: templateSections.performance ?? true,
      allocation: templateSections.allocation ?? true,
      holdings: templateSections.holdings ?? true,
      accounts: templateSections.accounts ?? true,
      benchmark: template.defaultOptions.showBenchmark,
    });
  };

  // Load clients on mount
  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/financial-reports/api/clients');
        const data = await response.json();
        if (data.success) {
          setClients(data.clients);
        }
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setIsLoadingClients(false);
      }
    }
    fetchClients();
  }, []);

  // Load advisors when type changes to advisor
  useEffect(() => {
    if (selectedType === 'advisor' && advisors.length === 0) {
      setIsLoadingAdvisors(true);
      async function fetchAdvisors() {
        try {
          const response = await fetch('/financial-reports/api/advisors');
          const data = await response.json();
          if (data.success) {
            setAdvisors(data.advisors);
          }
        } catch (error) {
          console.error('Failed to load advisors:', error);
        } finally {
          setIsLoadingAdvisors(false);
        }
      }
      fetchAdvisors();
    }
  }, [selectedType, advisors.length]);

  // Initialize dates with YTD preset
  useEffect(() => {
    const preset = DATE_PRESETS.find((p) => p.label === 'YTD');
    if (preset) {
      const { start, end } = preset.getValue();
      setStartDate(start);
      setEndDate(end);
    }
  }, []);

  // Filter clients by search
  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const search = clientSearch.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.household.toLowerCase().includes(search) ||
        c.advisor.toLowerCase().includes(search)
    );
  }, [clients, clientSearch]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedAdvisor = advisors.find((a) => a.index === selectedAdvisorIndex);

  const handleDatePreset = (preset: DatePreset) => {
    setDatePreset(preset.label);
    const { start, end } = preset.getValue();
    setStartDate(start);
    setEndDate(end);
  };

  const handleSectionToggle = (section: keyof ReportSections) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleGenerate = async () => {
    // Validate date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date');
      return;
    }

    setIsGenerating(true);
    setPreviewHtml(null);

    try {
      const params = new URLSearchParams({
        type: selectedType,
        format: outputFormat,
        clientIndex: String(selectedClientId),
        advisorIndex: String(selectedAdvisorIndex),
        startDate,
        endDate,
        sections: JSON.stringify(sections),
      });

      const url = `/financial-reports/api/generate?${params}`;

      // Download formats (PDF, Excel, CSV)
      if (outputFormat === 'pdf' || outputFormat === 'excel' || outputFormat === 'csv') {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to generate report');

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;

        // Generate filename based on type and format
        const ext = outputFormat === 'excel' ? 'xlsx' : outputFormat;
        let baseName = 'sample';
        if (selectedType === 'client') {
          baseName = (selectedClient?.household || 'client').toLowerCase().replace(/\s+/g, '-');
        } else if (selectedType === 'advisor') {
          baseName = (selectedAdvisor?.name || 'advisor').toLowerCase().replace(/\s+/g, '-');
        } else if (selectedType === 'firm') {
          baseName = 'firm';
        }
        const reportSuffix = selectedType === 'client' ? 'portfolio' : selectedType === 'advisor' ? 'book' : 'analytics';
        a.download = `${baseName}-${reportSuffix}-report.${ext}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // HTML preview
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to generate preview');

        const html = await response.text();
        setPreviewHtml(html);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate report. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const reportTypes = [
    {
      id: 'client' as ReportType,
      name: 'Client Portfolio Report',
      description: 'Individual client holdings, performance, and allocation analysis',
      icon: '📊',
    },
    {
      id: 'advisor' as ReportType,
      name: 'Advisor Book Report',
      description: 'Advisor-level AUM, client list, and performance metrics',
      icon: '👤',
    },
    {
      id: 'firm' as ReportType,
      name: 'Firm Analytics Report',
      description: 'Firm-wide AUM trends, advisor rankings, and client segmentation',
      icon: '🏢',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-sm text-gray-600 mt-1">
                Generate professional portfolio reports for clients, advisors, and firm analytics
              </p>
            </div>
            <Link
              href="/"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Report Type Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Type</h2>
              <div className="space-y-3">
                {reportTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => !type.disabled && setSelectedType(type.id)}
                    disabled={type.disabled}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      type.disabled
                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        : selectedType === type.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {type.name}
                          {type.disabled && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Client Selection */}
            {selectedType === 'client' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Client</h2>
                {isLoadingClients ? (
                  <div className="text-gray-500 text-sm">Loading clients...</div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredClients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => setSelectedClientId(client.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                            selectedClientId === client.id
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">
                                {client.household}
                              </div>
                              <div className="text-xs text-gray-500">{client.advisor}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900 text-sm">
                                {client.aumFormatted}
                              </div>
                              <div
                                className={`text-xs capitalize ${
                                  client.status === 'on-track'
                                    ? 'text-green-600'
                                    : client.status === 'needs-attention'
                                      ? 'text-amber-600'
                                      : 'text-red-600'
                                }`}
                              >
                                {client.status.replace('-', ' ')}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedClient && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Selected:</div>
                        <div className="font-medium text-gray-900">{selectedClient.name}</div>
                        <div className="text-sm text-gray-600">
                          {selectedClient.aumFormatted} AUM
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Advisor Selection */}
            {selectedType === 'advisor' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Advisor</h2>
                {isLoadingAdvisors ? (
                  <div className="text-gray-500 text-sm">Loading advisors...</div>
                ) : (
                  <div className="space-y-3">
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {advisors.map((advisor) => (
                        <button
                          key={advisor.id}
                          onClick={() => setSelectedAdvisorIndex(advisor.index)}
                          className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                            selectedAdvisorIndex === advisor.index
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">
                                {advisor.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {advisor.team} | {advisor.role}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900 text-sm">
                                {advisor.aumFormatted}
                              </div>
                              <div className="text-xs text-gray-500">
                                {advisor.clientCount} clients
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedAdvisor && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Selected:</div>
                        <div className="font-medium text-gray-900">{selectedAdvisor.name}</div>
                        <div className="text-sm text-gray-600">
                          {selectedAdvisor.aumFormatted} AUM | {selectedAdvisor.clientCount} clients
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Date Range */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Period</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleDatePreset(preset)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        datePreset === preset.label
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDatePreset('Custom');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setDatePreset('Custom');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Report Template - only for client reports */}
            {selectedType === 'client' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Template</h2>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateChange(template)}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        selectedTemplate.id === template.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{template.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{template.name}</div>
                          <div className="text-xs text-gray-500">{template.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Report Sections - only for client reports */}
            {selectedType === 'client' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customize Sections</h2>
              <div className="space-y-2">
                {(Object.keys(sections) as Array<keyof ReportSections>).map((section) => (
                  <label
                    key={section}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={sections[section]}
                      onChange={() => handleSectionToggle(section)}
                      className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">{SECTION_LABELS[section]}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() =>
                    setSections({
                      summary: true,
                      performance: true,
                      allocation: true,
                      holdings: true,
                      accounts: true,
                      benchmark: true,
                    })
                  }
                  className="text-xs text-teal-600 hover:text-teal-700"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() =>
                    setSections({
                      summary: false,
                      performance: false,
                      allocation: false,
                      holdings: false,
                      accounts: false,
                      benchmark: false,
                    })
                  }
                  className="text-xs text-teal-600 hover:text-teal-700"
                >
                  Deselect All
                </button>
              </div>
            </div>
            )}

            {/* Output Format */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Output Format</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOutputFormat('html')}
                  className={`py-2.5 px-3 rounded-lg border-2 font-medium text-sm transition-all ${
                    outputFormat === 'html'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  HTML Preview
                </button>
                <button
                  onClick={() => setOutputFormat('pdf')}
                  className={`py-2.5 px-3 rounded-lg border-2 font-medium text-sm transition-all ${
                    outputFormat === 'pdf'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  PDF Download
                </button>
                <button
                  onClick={() => setOutputFormat('excel')}
                  className={`py-2.5 px-3 rounded-lg border-2 font-medium text-sm transition-all ${
                    outputFormat === 'excel'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Excel Export
                </button>
                <button
                  onClick={() => setOutputFormat('csv')}
                  className={`py-2.5 px-3 rounded-lg border-2 font-medium text-sm transition-all ${
                    outputFormat === 'csv'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  CSV Export
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : (
                `Generate ${outputFormat.toUpperCase()} Report`
              )}
            </button>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Report Preview</h2>
                {previewHtml && (
                  <button
                    onClick={() => setPreviewHtml(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear Preview
                  </button>
                )}
              </div>

              <div className="relative" style={{ minHeight: '700px' }}>
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full absolute inset-0"
                    style={{ minHeight: '700px' }}
                    title="Report Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                    <svg
                      className="w-16 h-16 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-lg font-medium">No preview yet</p>
                    <p className="text-sm mt-1">
                      Configure your report and click Generate to see a preview
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Configuration Summary */}
            {selectedClient && (
              <div className="mt-6 bg-teal-50 border border-teal-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="text-teal-500 mt-0.5">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-teal-900">Report Configuration</div>
                    <div className="text-sm text-teal-700 mt-1 space-y-1">
                      <p>
                        <strong>Client:</strong> {selectedClient.household} (
                        {selectedClient.aumFormatted})
                      </p>
                      <p>
                        <strong>Period:</strong> {startDate} to {endDate} ({datePreset})
                      </p>
                      <p>
                        <strong>Sections:</strong>{' '}
                        {Object.entries(sections)
                          .filter(([, v]) => v)
                          .map(([k]) => SECTION_LABELS[k as keyof ReportSections])
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
