'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import type { PortfolioAnalysisResult, ExposureItem } from '@/lib/clarity-api/types';

type MetricTab = 'all' | 'environmental' | 'social' | 'governance' | 'climate';

interface AnalysisResultWithMeta extends PortfolioAnalysisResult {
  id: string;
  name: string;
  date: string;
}

function ScoreCard({
  label,
  value,
  unit,
  subtitle,
  color = 'gray',
}: {
  label: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  color?: 'gray' | 'emerald' | 'cyan';
}) {
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200',
    emerald: 'bg-[#ECFDF5] border-[#D1FAE5]',
    cyan: 'bg-[#E5F5F3] border-[#C3E6E3]',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className="text-4xl font-light text-gray-900">
        {value}
        {unit && <span className="text-xl text-gray-500 ml-1">{unit}</span>}
      </p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResultWithMeta | null>(null);
  const [activeTab, setActiveTab] = useState<MetricTab>('all');
  const [sortColumn, setSortColumn] = useState<'weight' | 'esgScore'>('weight');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAllExposures, setShowAllExposures] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('analysisResult');
    if (!stored) {
      router.push('/impact-analytics/analyze');
      return;
    }
    setResult(JSON.parse(stored));
  }, [router]);

  // Extract scores
  const esgScore = useMemo(() => {
    if (!result?.esgImpact?.scores) return null;
    return result.esgImpact.scores.find(
      (s) => s.treeLevel === 'TOTAL' && s.id === 'ESG'
    )?.score;
  }, [result]);

  const pillarScores = useMemo(() => {
    if (!result?.esgImpact?.scores) return { e: null, s: null, g: null };
    const scores = result.esgImpact.scores;
    return {
      e: scores.find((s) => s.treeLevel === 'PILLAR' && s.id === 'ENVIRONMENTAL')?.score,
      s: scores.find((s) => s.treeLevel === 'PILLAR' && s.id === 'SOCIAL')?.score,
      g: scores.find((s) => s.treeLevel === 'PILLAR' && s.id === 'GOVERNANCE')?.score,
    };
  }, [result]);

  const climateData = useMemo(() => {
    if (!result?.tcfd?.values) return { temp: null, netZero: null, carbonIntensity: null };
    const values = result.tcfd.values;
    return {
      temp: values.find((v) => v.id.includes('TEMP'))?.value,
      netZero: values.find((v) => v.id.includes('NET_ZERO'))?.value,
      carbonIntensity: values.find((v) => v.id.includes('CARBON'))?.value,
    };
  }, [result]);

  const sdgData = useMemo(() => {
    if (!result?.sdg?.sdgScores) return { scores: [], totalPositive: 0, totalNegative: 0 };
    return {
      scores: result.sdg.sdgScores.sort((a, b) => b.netRevenue - a.netRevenue),
      totalPositive: result.sdg.totalPositiveRevenue || 0,
      totalNegative: result.sdg.totalNegativeRevenue || 0,
    };
  }, [result]);

  // Sort exposures
  const sortedExposures = useMemo(() => {
    if (!result?.exposures?.exposures) return [];
    const exposures = [...result.exposures.exposures];

    exposures.sort((a, b) => {
      const aVal = sortColumn === 'weight' ? a.weight : (a.esgScore || 0);
      const bVal = sortColumn === 'weight' ? b.weight : (b.esgScore || 0);
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return exposures;
  }, [result, sortColumn, sortDirection]);

  const displayedExposures = showAllExposures ? sortedExposures : sortedExposures.slice(0, 20);

  const handleSort = (column: 'weight' | 'esgScore') => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleGeneratePDF = async () => {
    // Navigate to PDF preview/generation
    router.push('/impact-analytics/reports/preview');
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <p className="text-gray-500">Loading results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-8">
        {/* Portfolio Header */}
        <div className="mb-10">
          <h1 className="font-serif text-4xl text-gray-900 mb-2">
            {result.name || result.portfolioName}
          </h1>
          <p className="text-gray-500">
            {result.positionCount?.toLocaleString()} positions · Analyzed{' '}
            {new Date(result.date).toLocaleDateString()}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <ScoreCard
            label="ESG Score"
            value={esgScore ?? '-'}
            subtitle={esgScore ? (esgScore >= 70 ? 'Above average' : 'Below average') : undefined}
            color="cyan"
          />
          <ScoreCard
            label="Climate Alignment"
            value={climateData.temp?.toFixed(1) ?? '-'}
            unit="°C"
            subtitle={
              climateData.temp
                ? climateData.temp <= 2
                  ? 'Paris-aligned'
                  : 'Above 2°C pathway'
                : undefined
            }
            color="emerald"
          />
          <ScoreCard
            label="Net Zero Coverage"
            value={climateData.netZero ? Math.round(climateData.netZero) : '-'}
            unit="%"
            subtitle={
              climateData.netZero
                ? climateData.netZero >= 50
                  ? 'Good coverage'
                  : 'Limited coverage'
                : undefined
            }
          />
          <ScoreCard
            label="Carbon Intensity"
            value={climateData.carbonIntensity?.toFixed(0) ?? '-'}
            unit="tCO₂e/M$"
          />
        </div>

        {/* Pillar Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">
            ESG Pillar Breakdown
          </h2>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-light text-gray-900">
                  {pillarScores.e ?? '-'}
                </span>
                <span className="text-sm text-gray-500 pb-1">/ 100</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${pillarScores.e || 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">Environmental</p>
            </div>
            <div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-light text-gray-900">
                  {pillarScores.s ?? '-'}
                </span>
                <span className="text-sm text-gray-500 pb-1">/ 100</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${pillarScores.s || 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">Social</p>
            </div>
            <div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-light text-gray-900">
                  {pillarScores.g ?? '-'}
                </span>
                <span className="text-sm text-gray-500 pb-1">/ 100</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${pillarScores.g || 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">Governance</p>
            </div>
          </div>
        </div>

        {/* SDG Alignment */}
        {sdgData.scores.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">
              SDG Alignment (Revenue Exposure)
            </h2>
            <div className="space-y-4">
              {sdgData.scores.map((sdg) => (
                <div key={sdg.sdgId} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                    {sdg.sdgId}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{sdg.sdgName}</span>
                      <span className={`text-sm font-medium ${sdg.netRevenue >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {sdg.netRevenue >= 0 ? '+' : ''}{sdg.netRevenue.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      {sdg.negativeRevenue > 0 && (
                        <div
                          className="h-full bg-red-400"
                          style={{ width: `${Math.min(sdg.negativeRevenue, 50)}%` }}
                        />
                      )}
                      {sdg.positiveRevenue > 0 && (
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${Math.min(sdg.positiveRevenue, 50)}%` }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">
                Total Positive: <span className="text-emerald-600 font-medium">{sdgData.totalPositive.toFixed(1)}%</span>
              </span>
              <span className="text-gray-500">
                Total Negative: <span className="text-red-500 font-medium">{sdgData.totalNegative.toFixed(1)}%</span>
              </span>
            </div>
          </div>
        )}

        {/* Holdings Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Holdings by Category
            </h2>

            {/* Tab Filters */}
            <div className="flex gap-2">
              {(['all', 'environmental', 'social', 'governance', 'climate'] as MetricTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      activeTab === tab
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('weight')}
                  >
                    <div className="flex items-center gap-1">
                      Weight
                      {sortColumn === 'weight' &&
                        (sortDirection === 'desc' ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronUp className="w-3 h-3" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('esgScore')}
                  >
                    <div className="flex items-center gap-1">
                      ESG
                      {sortColumn === 'esgScore' &&
                        (sortDirection === 'desc' ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronUp className="w-3 h-3" />
                        ))}
                    </div>
                  </th>
                  {(activeTab === 'all' || activeTab === 'environmental') && (
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      E
                    </th>
                  )}
                  {(activeTab === 'all' || activeTab === 'social') && (
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S
                    </th>
                  )}
                  {(activeTab === 'all' || activeTab === 'governance') && (
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      G
                    </th>
                  )}
                  {(activeTab === 'all' || activeTab === 'climate') && (
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Climate
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedExposures.map((exposure, index) => (
                  <tr key={exposure.securityId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {exposure.securityName}
                      </p>
                      <p className="text-xs text-gray-500">{exposure.securityId}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {(exposure.weight * 100).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          (exposure.esgScore || 0) >= 70
                            ? 'text-emerald-600'
                            : (exposure.esgScore || 0) >= 50
                            ? 'text-gray-700'
                            : 'text-red-600'
                        }`}
                      >
                        {exposure.esgScore ?? '-'}
                      </span>
                    </td>
                    {(activeTab === 'all' || activeTab === 'environmental') && (
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {exposure.environmentalScore ?? '-'}
                      </td>
                    )}
                    {(activeTab === 'all' || activeTab === 'social') && (
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {exposure.socialScore ?? '-'}
                      </td>
                    )}
                    {(activeTab === 'all' || activeTab === 'governance') && (
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {exposure.governanceScore ?? '-'}
                      </td>
                    )}
                    {(activeTab === 'all' || activeTab === 'climate') && (
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {exposure.climateRating ? `${exposure.climateRating.toFixed(1)}°C` : '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          {sortedExposures.length > 20 && (
            <div className="px-6 py-4 border-t border-gray-100 text-center">
              <button
                onClick={() => setShowAllExposures(!showAllExposures)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {showAllExposures
                  ? 'Show Less'
                  : `Show All ${sortedExposures.length} Holdings`}
              </button>
            </div>
          )}
        </div>

        {/* Export Actions */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={handleGeneratePDF}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generate PDF Report
          </button>
        </div>
      </main>
    </div>
  );
}
