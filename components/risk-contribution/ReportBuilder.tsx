'use client';

import { useState } from 'react';
import { X, FileDown, Eye, EyeOff, GripVertical, Presentation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SlideContent, ReportConfig, DEFAULT_RISK_REPORT_SLIDES, ALTI_COLORS } from '@/lib/report-types';
import { generateRiskReport } from '@/lib/pptx-generator';
import {
  RiskContributionsResponse,
  DiversificationResponse,
  PerformanceStats,
  StressScenarioResult,
} from '@/lib/risk-types';

interface ReportBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  contributions: RiskContributionsResponse | null;
  diversification: DiversificationResponse | null;
  performance: PerformanceStats | null;
  stressResults: StressScenarioResult[];
  portfolioName: string;
}

export default function ReportBuilder({
  isOpen,
  onClose,
  contributions,
  diversification,
  performance,
  stressResults,
  portfolioName,
}: ReportBuilderProps) {
  const [slides, setSlides] = useState<SlideContent[]>(DEFAULT_RISK_REPORT_SLIDES);
  const [reportTitle, setReportTitle] = useState('Risk Contribution Analysis');
  const [reportSubtitle, setReportSubtitle] = useState('Portfolio Risk Assessment Report');
  const [preparedFor, setPreparedFor] = useState('');
  const [activePreview, setActivePreview] = useState<string | null>('title');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  const toggleSlide = (id: string) => {
    setSlides(prev =>
      prev.map(s => (s.id === id ? { ...s, included: !s.included } : s))
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      // Validate that we have at least some data to report on
      const hasData = contributions || diversification || performance || stressResults.length > 0;
      if (!hasData) {
        throw new Error('No analysis data available. Please run the analysis first.');
      }

      const config: ReportConfig = {
        title: reportTitle,
        subtitle: reportSubtitle,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        preparedFor: preparedFor || undefined,
        slides,
      };

      await generateRiskReport(config, {
        contributions,
        diversification,
        performance,
        stressResults,
        portfolioName,
      });

      // Show success message
      setGenerateSuccess(true);
      setTimeout(() => {
        setGenerateSuccess(false);
        onClose();
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      setGenerateError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const includedCount = slides.filter(s => s.included).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00f0db]/10 flex items-center justify-center">
                <Presentation size={20} className="text-[#0B6D7B]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                  Export Report
                </h2>
                <p className="text-sm text-gray-500">Configure and preview your PowerPoint report</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Data Availability Banner */}
          {(!contributions && !diversification && !performance && stressResults.length === 0) && (
            <div className="mx-6 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> No analysis data available. The report will include placeholder text.
                Run the analysis first to generate meaningful results.
              </p>
            </div>
          )}

          {/* Content */}
          <div className="flex h-[calc(90vh-140px)]">
            {/* Left Panel - Configuration */}
            <div className="w-80 border-r border-gray-200 p-5 overflow-y-auto">
              {/* Report Details */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Report Title
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00f0db] focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={reportSubtitle}
                  onChange={e => setReportSubtitle(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00f0db] focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Prepared For (Optional)
                </label>
                <input
                  type="text"
                  value={preparedFor}
                  onChange={e => setPreparedFor(e.target.value)}
                  placeholder="Client name"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00f0db] focus:border-transparent"
                />
              </div>

              {/* Slide Selection */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Slides ({includedCount})
                  </label>
                </div>

                <div className="space-y-2">
                  {slides.map((slide) => (
                    <div
                      key={slide.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        slide.included
                          ? 'border-[#00f0db] bg-[#00f0db]/5'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      } ${activePreview === slide.id ? 'ring-2 ring-[#074269]' : ''}`}
                      onClick={() => setActivePreview(slide.id)}
                    >
                      <GripVertical size={14} className="text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {slide.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{slide.subtitle}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSlide(slide.id);
                        }}
                        className="p-1.5 hover:bg-white rounded transition-colors"
                      >
                        {slide.included ? (
                          <Eye size={16} className="text-[#0B6D7B]" />
                        ) : (
                          <EyeOff size={16} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Slide Preview
                </p>
              </div>

              {/* Slide Preview */}
              <div className="bg-white rounded-lg shadow-lg aspect-[16/9] max-w-3xl mx-auto overflow-hidden">
                <SlidePreview
                  slideId={activePreview}
                  slides={slides}
                  reportTitle={reportTitle}
                  reportSubtitle={reportSubtitle}
                  preparedFor={preparedFor}
                  contributions={contributions}
                  diversification={diversification}
                  performance={performance}
                  stressResults={stressResults}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex-1">
              {generateError ? (
                <p className="text-sm text-red-600">
                  Error: {generateError}
                </p>
              ) : generateSuccess ? (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Report generated successfully!
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  {includedCount} slide{includedCount !== 1 ? 's' : ''} will be exported
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                {generateSuccess ? 'Close' : 'Cancel'}
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || includedCount === 0 || generateSuccess}
                className="px-5 py-2 bg-[#00f0db] text-[#010203] text-sm font-semibold rounded-lg hover:bg-[#00d4c1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#010203]/30 border-t-[#010203] rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown size={16} />
                    Export PowerPoint
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Slide Preview Component
function SlidePreview({
  slideId,
  slides,
  reportTitle,
  reportSubtitle,
  preparedFor,
  contributions,
  diversification,
  performance,
  stressResults,
}: {
  slideId: string | null;
  slides: SlideContent[];
  reportTitle: string;
  reportSubtitle: string;
  preparedFor: string;
  contributions: RiskContributionsResponse | null;
  diversification: DiversificationResponse | null;
  performance: PerformanceStats | null;
  stressResults: StressScenarioResult[];
}) {
  const slide = slides.find(s => s.id === slideId);
  if (!slide) return <EmptyPreview />;

  switch (slide.type) {
    case 'title':
      return (
        <TitleSlidePreview
          title={reportTitle}
          subtitle={reportSubtitle}
          preparedFor={preparedFor}
        />
      );
    case 'metrics':
      return (
        <MetricsSlidePreview
          contributions={contributions}
          diversification={diversification}
          performance={performance}
        />
      );
    case 'chart':
      return <ChartSlidePreview contributions={contributions} />;
    case 'table':
      return <TableSlidePreview stressResults={stressResults} />;
    case 'summary':
      return (
        <SummarySlidePreview
          contributions={contributions}
          diversification={diversification}
          stressResults={stressResults}
        />
      );
    default:
      return <EmptyPreview />;
  }
}

function EmptyPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">Select a slide to preview</p>
    </div>
  );
}

function TitleSlidePreview({
  title,
  subtitle,
  preparedFor,
}: {
  title: string;
  subtitle: string;
  preparedFor: string;
}) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="w-full h-full relative p-8 flex flex-col">
      {/* Turquoise accent bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[#00f0db]" />

      {/* Logo */}
      <div className="absolute top-6 right-8">
        <img src="/alti-logo-ips.png" alt="AlTi" className="h-8 object-contain" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        <h1
          className="text-3xl font-light text-[#010203] mb-2"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {title}
        </h1>
        <p className="text-lg text-[#074269] mb-8">{subtitle}</p>

        <div className="space-y-1">
          <p className="text-sm text-gray-500">{today}</p>
          {preparedFor && (
            <p className="text-sm text-gray-500">Prepared for: {preparedFor}</p>
          )}
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f0db]" />
      <p className="absolute bottom-3 left-8 text-[10px] text-gray-400">CONFIDENTIAL</p>
    </div>
  );
}

function MetricsSlidePreview({
  contributions,
  diversification,
  performance,
}: {
  contributions: RiskContributionsResponse | null;
  diversification: DiversificationResponse | null;
  performance: PerformanceStats | null;
}) {
  const formatPercentage = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
      return 'N/A';
    }
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDecimal = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
      return 'N/A';
    }
    return value.toFixed(2);
  };

  const metrics = [
    {
      label: 'Portfolio Volatility',
      value: formatPercentage(contributions?.portfolio_vol_annualized),
      description: 'Annualized',
    },
    {
      label: 'Diversification Ratio',
      value: formatDecimal(diversification?.diversification_ratio),
      description: 'Higher is better',
    },
    {
      label: 'Sharpe Ratio',
      value: formatDecimal(performance?.sharpe),
      description: 'Risk-adjusted return',
    },
    {
      label: 'Max Drawdown',
      value: formatPercentage(performance?.max_drawdown),
      description: 'Peak-to-trough',
    },
    {
      label: 'CAGR',
      value: formatPercentage(performance?.cagr),
      description: 'Compound annual',
    },
    {
      label: 'Avg Correlation',
      value: formatDecimal(diversification?.weighted_avg_correlation),
      description: 'Weighted average',
    },
  ];

  return (
    <div className="w-full h-full relative p-6">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#00f0db]" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-light text-[#010203]" style={{ fontFamily: 'Georgia, serif' }}>
          Key Risk Metrics
        </h2>
        <img src="/alti-logo-ips.png" alt="AlTi" className="h-5 object-contain" />
      </div>

      {/* Metrics Grid - 3 columns */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center"
          >
            <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1 font-semibold">
              {metric.label}
            </p>
            <p className="text-xl font-bold text-[#074269] mb-0.5">{metric.value}</p>
            <p className="text-[7px] text-gray-400 italic">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f0db]" />
      <p className="absolute bottom-2 left-6 text-[8px] text-gray-400">CONFIDENTIAL</p>
    </div>
  );
}

function ChartSlidePreview({
  contributions,
}: {
  contributions: RiskContributionsResponse | null;
}) {
  const topAssets = contributions?.pctr
    ? Object.entries(contributions.pctr)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  return (
    <div className="w-full h-full relative p-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#00f0db]" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-light text-[#010203]" style={{ fontFamily: 'Georgia, serif' }}>
          Risk Contribution vs Weight
        </h2>
        <img src="/alti-logo-ips.png" alt="AlTi" className="h-5 object-contain" />
      </div>

      {/* Simple bar visualization */}
      <div className="space-y-3 mt-6">
        {topAssets.map(([asset, pctrValue]) => (
          <div key={asset} className="flex items-center gap-3">
            <div className="w-24 text-xs text-gray-600 truncate">{asset}</div>
            <div className="flex-1 flex gap-1">
              <div
                className="h-4 bg-[#00f0db] rounded-sm"
                style={{ width: `${pctrValue * 100 * 2}%` }}
              />
            </div>
            <div className="text-xs font-mono text-gray-600">
              {(pctrValue * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#074269] rounded-sm" />
          <span className="text-gray-500">Weight</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#00f0db] rounded-sm" />
          <span className="text-gray-500">Risk Contribution</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f0db]" />
      <p className="absolute bottom-2 left-6 text-[8px] text-gray-400">CONFIDENTIAL</p>
    </div>
  );
}

function TableSlidePreview({
  stressResults,
}: {
  stressResults: StressScenarioResult[];
}) {
  return (
    <div className="w-full h-full relative p-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#00f0db]" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-light text-[#010203]" style={{ fontFamily: 'Georgia, serif' }}>
          Stress Scenario Analysis
        </h2>
        <img src="/alti-logo-ips.png" alt="AlTi" className="h-5 object-contain" />
      </div>

      {/* Table */}
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#074269] text-white">
            <th className="px-2 py-1.5 text-left font-medium">Scenario</th>
            <th className="px-2 py-1.5 text-left font-medium">Period</th>
            <th className="px-2 py-1.5 text-right font-medium">Return</th>
            <th className="px-2 py-1.5 text-right font-medium">Max DD</th>
          </tr>
        </thead>
        <tbody>
          {stressResults.slice(0, 5).map((result, i) => (
            <tr key={result.scenario} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="px-2 py-1.5">{result.scenario}</td>
              <td className="px-2 py-1.5 text-gray-500">
                {result.start_date} - {result.end_date}
              </td>
              <td className={`px-2 py-1.5 text-right ${result.portfolio_return < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(result.portfolio_return * 100).toFixed(1)}%
              </td>
              <td className="px-2 py-1.5 text-right text-red-600">
                {(result.max_drawdown * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f0db]" />
      <p className="absolute bottom-2 left-6 text-[8px] text-gray-400">CONFIDENTIAL</p>
    </div>
  );
}

function SummarySlidePreview({
  contributions,
  diversification,
  stressResults,
}: {
  contributions: RiskContributionsResponse | null;
  diversification: DiversificationResponse | null;
  stressResults: StressScenarioResult[];
}) {
  const bullets: string[] = [];

  if (contributions?.portfolio_vol_annualized) {
    bullets.push(`Portfolio annualized volatility: ${(contributions.portfolio_vol_annualized * 100).toFixed(2)}%`);
  }
  if (diversification?.diversification_ratio) {
    bullets.push(`Diversification ratio: ${diversification.diversification_ratio.toFixed(2)}`);
  }
  if (stressResults.length > 0) {
    const worst = stressResults.reduce((w, c) => c.portfolio_return < w.portfolio_return ? c : w);
    bullets.push(`Worst stress scenario: ${worst.scenario}`);
  }
  bullets.push('Regular monitoring recommended');

  return (
    <div className="w-full h-full relative p-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#00f0db]" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-light text-[#010203]" style={{ fontFamily: 'Georgia, serif' }}>
          Summary & Key Takeaways
        </h2>
        <img src="/alti-logo-ips.png" alt="AlTi" className="h-5 object-contain" />
      </div>

      <ul className="space-y-3 mt-6">
        {bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f0db] mt-1.5 flex-shrink-0" />
            {bullet}
          </li>
        ))}
      </ul>

      <p className="absolute bottom-8 left-6 right-6 text-[9px] text-gray-400 italic">
        This analysis is for informational purposes only and does not constitute investment advice.
      </p>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f0db]" />
      <p className="absolute bottom-2 left-6 text-[8px] text-gray-400">CONFIDENTIAL</p>
    </div>
  );
}
