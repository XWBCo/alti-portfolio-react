'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import PortfolioSelector from '@/components/impact-analytics/PortfolioSelector';
import type { Holding } from '@/lib/clarity-api/types';

export default function ComparePage() {
  const router = useRouter();

  // Portfolio A
  const [holdingsA, setHoldingsA] = useState<Holding[]>([]);
  const [nameA, setNameA] = useState('');

  // Portfolio B
  const [holdingsB, setHoldingsB] = useState<Holding[]>([]);
  const [nameB, setNameB] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (holdingsA.length === 0 || holdingsB.length === 0) return;

    setIsSubmitting(true);

    // Store both portfolios in sessionStorage for the loading page
    const comparisonData = {
      portfolioA: {
        holdings: holdingsA,
        name: nameA || 'Portfolio A',
      },
      portfolioB: {
        holdings: holdingsB,
        name: nameB || 'Portfolio B',
      },
      startedAt: new Date().toISOString(),
    };
    sessionStorage.setItem('pendingComparison', JSON.stringify(comparisonData));

    // Navigate to loading page
    router.push('/impact-analytics/compare/loading');
  }, [holdingsA, holdingsB, nameA, nameB, router]);

  const canSubmit = holdingsA.length > 0 && holdingsB.length > 0 && !isSubmitting;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-8">
        {/* Page Title */}
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl text-gray-900 mb-3">Compare Portfolios</h1>
          <p className="text-gray-500">
            Select two portfolios for side-by-side ESG analysis
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          {/* Portfolio A */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#D1FAE5] to-[#CFFAFE] border-b border-[#A7F3D0]">
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                Portfolio A
              </h2>
            </div>
            <div className="p-6">
              <PortfolioSelector
                holdings={holdingsA}
                onHoldingsChange={setHoldingsA}
                portfolioName={nameA}
                onNameChange={setNameA}
                placeholder="e.g., Current Portfolio"
              />
            </div>
          </div>

          {/* Portfolio B */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#CFFAFE] to-[#D1FAE5] border-b border-[#A7F3D0]">
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                Portfolio B
              </h2>
            </div>
            <div className="p-6">
              <PortfolioSelector
                holdings={holdingsB}
                onHoldingsChange={setHoldingsB}
                portfolioName={nameB}
                onNameChange={setNameB}
                placeholder="e.g., Proposed Changes"
              />
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex items-center gap-2 px-8 py-4 rounded-lg font-medium transition-all ${
              canSubmit
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting Comparison...
              </>
            ) : (
              'Compare ESG Scores'
            )}
          </button>
        </div>

        {/* Validation Message */}
        {(holdingsA.length === 0 || holdingsB.length === 0) && (
          <p className="text-center text-sm text-gray-400 mt-4">
            {holdingsA.length === 0 && holdingsB.length === 0
              ? 'Select holdings for both portfolios to continue'
              : holdingsA.length === 0
              ? 'Add holdings to Portfolio A'
              : 'Add holdings to Portfolio B'}
          </p>
        )}

        {/* Info Card */}
        <div className="mt-12 bg-[#ECFDF5] border border-[#D1FAE5] rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="text-sm font-medium text-emerald-900 mb-2">
            Comparison Analysis
          </h3>
          <ul className="space-y-2 text-sm text-emerald-800">
            <li>
              <span className="font-medium">Side-by-side metrics</span> - ESG scores,
              climate alignment, net zero coverage
            </li>
            <li>
              <span className="font-medium">Delta indicators</span> - Shows which
              portfolio performs better on each metric
            </li>
            <li>
              <span className="font-medium">Key differences summary</span> - Highlights
              significant variations between portfolios
            </li>
            <li>
              <span className="font-medium">Export options</span> - Comparison PDF and
              detailed Excel workbook
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
