'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { PortfolioAnalysisResult } from '@/lib/clarity-api/types';

interface ComparisonResult {
  id: string;
  date: string;
  portfolioA: PortfolioAnalysisResult;
  portfolioB: PortfolioAnalysisResult;
}

function DeltaIndicator({
  valueA,
  valueB,
  lowerIsBetter = false,
}: {
  valueA: number | null;
  valueB: number | null;
  lowerIsBetter?: boolean;
}) {
  if (valueA === null || valueB === null) return null;

  const diff = valueB - valueA;
  const isPositive = lowerIsBetter ? diff < 0 : diff > 0;
  const isNeutral = Math.abs(diff) < 0.5;

  if (isNeutral) {
    return (
      <span className="flex items-center gap-1 text-gray-400 text-sm">
        <Minus className="w-3 h-3" />
        Same
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-1 text-sm ${
        isPositive ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {lowerIsBetter ? (diff < 0 ? 'Better' : 'Worse') : (diff > 0 ? '+' : '')}
      {!lowerIsBetter && Math.abs(diff).toFixed(1)}
    </span>
  );
}

function CompareCard({
  label,
  valueA,
  valueB,
  unit,
  lowerIsBetter = false,
}: {
  label: string;
  valueA: number | null;
  valueB: number | null;
  unit?: string;
  lowerIsBetter?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center border-r border-gray-100">
          <p className="text-3xl font-light text-gray-900">
            {valueA ?? '-'}
            {unit && valueA !== null && (
              <span className="text-lg text-gray-500 ml-1">{unit}</span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">Portfolio A</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-light text-gray-900">
            {valueB ?? '-'}
            {unit && valueB !== null && (
              <span className="text-lg text-gray-500 ml-1">{unit}</span>
            )}
          </p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-xs text-gray-400">Portfolio B</p>
            <DeltaIndicator valueA={valueA} valueB={valueB} lowerIsBetter={lowerIsBetter} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompareResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('comparisonResult');
    if (!stored) {
      router.push('/impact-analytics/compare');
      return;
    }
    setResult(JSON.parse(stored));
  }, [router]);

  // Extract scores from each portfolio
  const scoresA = useMemo(() => {
    if (!result?.portfolioA) return null;
    const esg = result.portfolioA.esgImpact?.scores;
    const tcfd = result.portfolioA.tcfd?.values;
    return {
      esg: esg?.find((s) => s.treeLevel === 'TOTAL' && s.id === 'ESG')?.score ?? null,
      e: esg?.find((s) => s.treeLevel === 'PILLAR' && s.id === 'ENVIRONMENTAL')?.score ?? null,
      s: esg?.find((s) => s.treeLevel === 'PILLAR' && s.id === 'SOCIAL')?.score ?? null,
      g: esg?.find((s) => s.treeLevel === 'PILLAR' && s.id === 'GOVERNANCE')?.score ?? null,
      temp: tcfd?.find((v) => v.id.includes('TEMP'))?.value ?? null,
      netZero: tcfd?.find((v) => v.id.includes('NET_ZERO'))?.value ?? null,
      carbon: tcfd?.find((v) => v.id.includes('CARBON'))?.value ?? null,
    };
  }, [result]);

  const scoresB = useMemo(() => {
    if (!result?.portfolioB) return null;
    const esg = result.portfolioB.esgImpact?.scores;
    const tcfd = result.portfolioB.tcfd?.values;
    return {
      esg: esg?.find((s) => s.treeLevel === 'TOTAL' && s.id === 'ESG')?.score ?? null,
      e: esg?.find((s) => s.treeLevel === 'PILLAR' && s.id === 'ENVIRONMENTAL')?.score ?? null,
      s: esg?.find((s) => s.treeLevel === 'PILLAR' && s.id === 'SOCIAL')?.score ?? null,
      g: esg?.find((s) => s.treeLevel === 'PILLAR' && s.id === 'GOVERNANCE')?.score ?? null,
      temp: tcfd?.find((v) => v.id.includes('TEMP'))?.value ?? null,
      netZero: tcfd?.find((v) => v.id.includes('NET_ZERO'))?.value ?? null,
      carbon: tcfd?.find((v) => v.id.includes('CARBON'))?.value ?? null,
    };
  }, [result]);

  // Generate key differences
  const keyDifferences = useMemo(() => {
    if (!scoresA || !scoresB) return [];
    const diffs: string[] = [];

    // ESG comparison
    if (scoresA.esg !== null && scoresB.esg !== null) {
      const esgDiff = scoresB.esg - scoresA.esg;
      if (Math.abs(esgDiff) >= 3) {
        diffs.push(
          esgDiff > 0
            ? `Portfolio B has a higher overall ESG score (+${esgDiff.toFixed(0)})`
            : `Portfolio A has a higher overall ESG score (+${Math.abs(esgDiff).toFixed(0)})`
        );
      }
    }

    // Environmental
    if (scoresA.e !== null && scoresB.e !== null) {
      const eDiff = scoresB.e - scoresA.e;
      if (Math.abs(eDiff) >= 5) {
        diffs.push(
          eDiff > 0
            ? `Portfolio B outperforms on Environmental (+${eDiff.toFixed(0)})`
            : `Portfolio A outperforms on Environmental (+${Math.abs(eDiff).toFixed(0)})`
        );
      }
    }

    // Governance
    if (scoresA.g !== null && scoresB.g !== null) {
      const gDiff = scoresB.g - scoresA.g;
      if (Math.abs(gDiff) >= 5) {
        diffs.push(
          gDiff > 0
            ? `Portfolio B has stronger Governance (+${gDiff.toFixed(0)})`
            : `Portfolio A has stronger Governance (+${Math.abs(gDiff).toFixed(0)})`
        );
      }
    }

    // Climate
    if (scoresA.temp !== null && scoresB.temp !== null) {
      if (scoresA.temp <= 2 && scoresB.temp <= 2) {
        diffs.push('Both portfolios are Paris-aligned (<2°C)');
      } else if (scoresA.temp > 2 && scoresB.temp > 2) {
        diffs.push('Neither portfolio is Paris-aligned (>2°C)');
      } else {
        const better = scoresA.temp < scoresB.temp ? 'A' : 'B';
        diffs.push(`Portfolio ${better} has better climate alignment`);
      }
    }

    // Net Zero
    if (scoresA.netZero !== null && scoresB.netZero !== null) {
      const nzDiff = scoresB.netZero - scoresA.netZero;
      if (Math.abs(nzDiff) >= 10) {
        diffs.push(
          nzDiff > 0
            ? `Portfolio B has higher Net Zero coverage (+${nzDiff.toFixed(0)}%)`
            : `Portfolio A has higher Net Zero coverage (+${Math.abs(nzDiff).toFixed(0)}%)`
        );
      }
    }

    return diffs;
  }, [scoresA, scoresB]);

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
        {/* Page Title */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-gray-900 mb-3">
            Portfolio Comparison
          </h1>
          <p className="text-gray-500">
            {result.portfolioA.portfolioName} vs {result.portfolioB.portfolioName}
          </p>
        </div>

        {/* Portfolio Headers */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-[#E5F5F3] border border-[#C3E6E3] rounded-lg p-6 text-center">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
              Portfolio A
            </h2>
            <p className="text-xl text-gray-900">{result.portfolioA.portfolioName}</p>
            <p className="text-sm text-gray-500 mt-1">
              {result.portfolioA.positionCount?.toLocaleString()} positions
            </p>
          </div>
          <div className="bg-[#ECFDF5] border border-[#D1FAE5] rounded-lg p-6 text-center">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
              Portfolio B
            </h2>
            <p className="text-xl text-gray-900">{result.portfolioB.portfolioName}</p>
            <p className="text-sm text-gray-500 mt-1">
              {result.portfolioB.positionCount?.toLocaleString()} positions
            </p>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          <CompareCard
            label="ESG Score"
            valueA={scoresA?.esg ?? null}
            valueB={scoresB?.esg ?? null}
          />
          <CompareCard
            label="Climate Alignment"
            valueA={scoresA?.temp ?? null}
            valueB={scoresB?.temp ?? null}
            unit="°C"
            lowerIsBetter={true}
          />
          <CompareCard
            label="Net Zero Coverage"
            valueA={scoresA?.netZero ?? null}
            valueB={scoresB?.netZero ?? null}
            unit="%"
          />
          <CompareCard
            label="Carbon Intensity"
            valueA={scoresA?.carbon ?? null}
            valueB={scoresB?.carbon ?? null}
            unit="tCO₂e/M$"
            lowerIsBetter={true}
          />
        </div>

        {/* Pillar Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">
            ESG Pillar Comparison
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {/* Environmental */}
            <div>
              <p className="text-sm text-gray-600 mb-4">Environmental</p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Portfolio A</span>
                    <span className="font-medium">{scoresA?.e ?? '-'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00F0DB] rounded-full"
                      style={{ width: `${scoresA?.e || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Portfolio B</span>
                    <span className="font-medium">{scoresB?.e ?? '-'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${scoresB?.e || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social */}
            <div>
              <p className="text-sm text-gray-600 mb-4">Social</p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Portfolio A</span>
                    <span className="font-medium">{scoresA?.s ?? '-'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00F0DB] rounded-full"
                      style={{ width: `${scoresA?.s || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Portfolio B</span>
                    <span className="font-medium">{scoresB?.s ?? '-'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${scoresB?.s || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Governance */}
            <div>
              <p className="text-sm text-gray-600 mb-4">Governance</p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Portfolio A</span>
                    <span className="font-medium">{scoresA?.g ?? '-'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00F0DB] rounded-full"
                      style={{ width: `${scoresA?.g || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Portfolio B</span>
                    <span className="font-medium">{scoresB?.g ?? '-'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${scoresB?.g || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Differences */}
        {keyDifferences.length > 0 && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-12">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Key Differences
            </h2>
            <ul className="space-y-2">
              {keyDifferences.map((diff, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-gray-400 mt-1">•</span>
                  {diff}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Export Actions */}
        <div className="flex items-center justify-center gap-4">
          <button className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => router.push('/impact-analytics/reports/preview')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generate Comparison PDF
          </button>
        </div>
      </main>
    </div>
  );
}
