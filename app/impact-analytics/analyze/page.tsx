'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import PortfolioSelector from '@/components/impact-analytics/PortfolioSelector';
import type { Holding } from '@/lib/clarity-api/types';

export default function AnalyzePage() {
  const router = useRouter();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [portfolioName, setPortfolioName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (holdings.length === 0) return;

    setIsSubmitting(true);

    // Store holdings in sessionStorage for the loading page
    const analysisData = {
      holdings,
      portfolioName: portfolioName || 'Portfolio Analysis',
      startedAt: new Date().toISOString(),
    };
    sessionStorage.setItem('pendingAnalysis', JSON.stringify(analysisData));

    // Navigate to loading page
    router.push('/impact-analytics/analyze/loading');
  }, [holdings, portfolioName, router]);

  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-8 py-8">
        {/* Page Title */}
        <div className="mb-10">
          <h1 className="font-serif text-4xl text-gray-900 mb-3">
            Analyze Portfolio
          </h1>
          <p className="text-gray-500">
            Select funds to analyze ESG metrics and generate reports
          </p>
        </div>

        {/* Portfolio Selector */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <PortfolioSelector
            holdings={holdings}
            onHoldingsChange={setHoldings}
            portfolioName={portfolioName}
            onNameChange={setPortfolioName}
          />
        </div>

        {/* Submit Section */}
        <div className="mt-8 flex items-center justify-between">
          {/* Weight Summary */}
          <div className="text-sm text-gray-500">
            {holdings.length > 0 && (
              <span>
                Total weight: {(totalWeight * 100).toFixed(1)}%
                {totalWeight < 0.99 && (
                  <span className="ml-2 text-amber-600">
                    (Unallocated: {((1 - totalWeight) * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={holdings.length === 0 || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              holdings.length > 0 && !isSubmitting
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting Analysis...
              </>
            ) : (
              'Fetch ESG Scores'
            )}
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-12 bg-[#ECFDF5] border border-[#D1FAE5] rounded-lg p-6">
          <h3 className="text-sm font-medium text-emerald-900 mb-2">
            What happens next?
          </h3>
          <ul className="space-y-2 text-sm text-emerald-800">
            <li>
              <span className="font-medium">1.</span> Portfolio uploaded to Clarity AI
            </li>
            <li>
              <span className="font-medium">2.</span> ESG Impact scores calculated (E, S, G pillars)
            </li>
            <li>
              <span className="font-medium">3.</span> Climate metrics fetched (temperature alignment, net zero)
            </li>
            <li>
              <span className="font-medium">4.</span> SDG alignment analysis completed
            </li>
            <li>
              <span className="font-medium">5.</span> Results ready for preview and PDF export
            </li>
          </ul>
          <p className="mt-4 text-xs text-emerald-700">
            Analysis typically completes in 5-15 seconds depending on portfolio complexity.
          </p>
        </div>
      </main>
    </div>
  );
}
