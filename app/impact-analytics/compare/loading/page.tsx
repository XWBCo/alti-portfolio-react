'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProgressDisplay, DEFAULT_STAGES } from '@/components/impact-analytics/ProgressDisplay';
import type { AnalysisStage, AnalysisPreview, Holding, StreamEvent } from '@/lib/clarity-api/types';

interface Stage {
  id: AnalysisStage;
  label: string;
  status: 'pending' | 'loading' | 'complete';
  result?: string;
}

interface PendingComparison {
  portfolioA: {
    holdings: Holding[];
    name: string;
  };
  portfolioB: {
    holdings: Holding[];
    name: string;
  };
  startedAt: string;
}

export default function CompareLoadingPage() {
  const router = useRouter();
  const eventSourceARef = useRef<EventSource | null>(null);
  const eventSourceBRef = useRef<EventSource | null>(null);

  // Portfolio A state
  const [progressA, setProgressA] = useState(0);
  const [stagesA, setStagesA] = useState<Stage[]>(
    DEFAULT_STAGES.map((s) => ({ ...s }))
  );
  const [previewA, setPreviewA] = useState<AnalysisPreview>({});
  const [resultA, setResultA] = useState<any>(null);
  const [errorA, setErrorA] = useState<string | null>(null);

  // Portfolio B state
  const [progressB, setProgressB] = useState(0);
  const [stagesB, setStagesB] = useState<Stage[]>(
    DEFAULT_STAGES.map((s) => ({ ...s }))
  );
  const [previewB, setPreviewB] = useState<AnalysisPreview>({});
  const [resultB, setResultB] = useState<any>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  const [portfolioNames, setPortfolioNames] = useState({ a: '', b: '' });

  const handleCancel = useCallback(() => {
    eventSourceARef.current?.close();
    eventSourceBRef.current?.close();
    router.push('/impact-analytics/compare');
  }, [router]);

  // Navigate to results when both complete
  useEffect(() => {
    if (resultA && resultB) {
      const comparisonResult = {
        id: `comparison-${Date.now()}`,
        date: new Date().toISOString(),
        portfolioA: resultA,
        portfolioB: resultB,
      };
      sessionStorage.setItem('comparisonResult', JSON.stringify(comparisonResult));

      // Add to recent analyses
      const recentRaw = localStorage.getItem('recentAnalyses');
      const recent = recentRaw ? JSON.parse(recentRaw) : [];
      recent.unshift({
        id: comparisonResult.id,
        name: `${portfolioNames.a} vs ${portfolioNames.b}`,
        date: new Date().toLocaleDateString(),
        mode: 'compare',
      });
      localStorage.setItem('recentAnalyses', JSON.stringify(recent.slice(0, 10)));

      setTimeout(() => {
        router.push('/impact-analytics/compare/results');
      }, 500);
    }
  }, [resultA, resultB, router, portfolioNames]);

  // Helper to create stage updater
  const createStageUpdater = (setStages: React.Dispatch<React.SetStateAction<Stage[]>>) => {
    return (
      stageId: AnalysisStage,
      status: 'pending' | 'loading' | 'complete',
      result?: string
    ) => {
      setStages((prev) =>
        prev.map((stage) =>
          stage.id === stageId ? { ...stage, status, result: result || stage.result } : stage
        )
      );
    };
  };

  // Process SSE events
  const processEvent = (
    data: StreamEvent,
    setProgress: React.Dispatch<React.SetStateAction<number>>,
    updateStage: (id: AnalysisStage, status: 'pending' | 'loading' | 'complete', result?: string) => void,
    setPreview: React.Dispatch<React.SetStateAction<AnalysisPreview>>,
    setResult: React.Dispatch<React.SetStateAction<any>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (data.progress !== undefined) {
      setProgress(data.progress);
    }

    switch (data.stage) {
      case 'creating':
        updateStage('creating', 'loading');
        break;
      case 'processing':
        updateStage('creating', 'complete');
        updateStage('processing', 'loading');
        break;
      case 'esg_impact':
        updateStage('processing', 'complete');
        updateStage('esg_impact', 'loading');
        break;
      case 'climate':
        updateStage('esg_impact', 'complete');
        if (data.data?.esgImpact) {
          const esgScore = data.data.esgImpact.scores?.find(
            (s) => s.treeLevel === 'TOTAL' && s.id === 'ESG'
          )?.score;
          if (esgScore) {
            setPreview((prev) => ({ ...prev, esgScore }));
          }
        }
        updateStage('climate', 'loading');
        break;
      case 'exposures':
        updateStage('climate', 'complete');
        if (data.data?.tcfd) {
          const tempRating = data.data.tcfd.values?.find(
            (v) => v.id.includes('TEMP')
          )?.value;
          if (tempRating) {
            setPreview((prev) => ({ ...prev, climateRating: tempRating }));
          }
        }
        updateStage('exposures', 'loading');
        break;
      case 'complete':
        updateStage('exposures', 'complete');
        setProgress(1);
        if (data.data) {
          setResult(data.data);
        }
        break;
      case 'error':
        setError(data.error || 'An error occurred');
        break;
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingComparison');
    if (!stored) {
      router.push('/impact-analytics/compare');
      return;
    }

    const comparison: PendingComparison = JSON.parse(stored);
    setPortfolioNames({
      a: comparison.portfolioA.name,
      b: comparison.portfolioB.name,
    });

    const updateStageA = createStageUpdater(setStagesA);
    const updateStageB = createStageUpdater(setStagesB);

    // Connect to SSE for Portfolio A
    const paramsA = new URLSearchParams({
      holdings: JSON.stringify(comparison.portfolioA.holdings),
      name: comparison.portfolioA.name,
    });
    const eventSourceA = new EventSource(`/impact-analytics/api/scores/stream?${paramsA.toString()}`);
    eventSourceARef.current = eventSourceA;

    eventSourceA.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);
        processEvent(data, setProgressA, updateStageA, setPreviewA, setResultA, setErrorA);
      } catch (err) {
        console.error('Failed to parse SSE event A:', err);
      }
    };

    eventSourceA.onerror = () => {
      setErrorA('Connection lost for Portfolio A');
      eventSourceA.close();
    };

    // Connect to SSE for Portfolio B
    const paramsB = new URLSearchParams({
      holdings: JSON.stringify(comparison.portfolioB.holdings),
      name: comparison.portfolioB.name,
    });
    const eventSourceB = new EventSource(`/impact-analytics/api/scores/stream?${paramsB.toString()}`);
    eventSourceBRef.current = eventSourceB;

    eventSourceB.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);
        processEvent(data, setProgressB, updateStageB, setPreviewB, setResultB, setErrorB);
      } catch (err) {
        console.error('Failed to parse SSE event B:', err);
      }
    };

    eventSourceB.onerror = () => {
      setErrorB('Connection lost for Portfolio B');
      eventSourceB.close();
    };

    return () => {
      eventSourceA.close();
      eventSourceB.close();
    };
  }, [router]);

  const hasError = errorA || errorB;
  const combinedProgress = (progressA + progressB) / 2;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Cancel</span>
            </button>
            <img src="/alti.PNG" alt="AlTi Global" className="h-10" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl text-gray-900 mb-3">
            Analyzing Portfolios
          </h1>
          <p className="text-gray-500">
            Fetching ESG metrics for comparison
          </p>
        </div>

        {/* Combined Progress */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="h-[3px] bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00F0DB] transition-all duration-300"
              style={{ width: `${combinedProgress * 100}%` }}
            />
          </div>
          <p className="text-center text-4xl font-light text-gray-900 mt-4">
            {Math.round(combinedProgress * 100)}%
          </p>
        </div>

        {/* Error State */}
        {hasError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-xl mx-auto">
            <p className="text-red-800 mb-4">
              {errorA && `Portfolio A: ${errorA}`}
              {errorA && errorB && <br />}
              {errorB && `Portfolio B: ${errorB}`}
            </p>
            <Link
              href="/impact-analytics/compare"
              className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </Link>
          </div>
        ) : (
          /* Dual Progress Display */
          <div className="grid grid-cols-2 gap-8">
            {/* Portfolio A Progress */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center mb-6">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Portfolio A
                </h2>
                <p className="text-lg text-gray-900">{portfolioNames.a}</p>
              </div>
              <ProgressDisplay
                progress={progressA}
                stages={stagesA}
                preview={previewA}
              />
            </div>

            {/* Portfolio B Progress */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center mb-6">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Portfolio B
                </h2>
                <p className="text-lg text-gray-900">{portfolioNames.b}</p>
              </div>
              <ProgressDisplay
                progress={progressB}
                stages={stagesB}
                preview={previewB}
              />
            </div>
          </div>
        )}

        {/* Cancel Button */}
        {!hasError && (
          <div className="text-center mt-8">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
