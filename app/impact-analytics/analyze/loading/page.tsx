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

interface PendingAnalysis {
  holdings: Holding[];
  portfolioName: string;
  startedAt: string;
}

export default function LoadingPage() {
  const router = useRouter();
  const eventSourceRef = useRef<EventSource | null>(null);

  const [progress, setProgress] = useState(0);
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [preview, setPreview] = useState<AnalysisPreview>({});
  const [positionCount, setPositionCount] = useState<number>();
  const [error, setError] = useState<string | null>(null);

  const updateStageStatus = useCallback(
    (stageId: AnalysisStage, status: 'pending' | 'loading' | 'complete', result?: string) => {
      setStages((prev) =>
        prev.map((stage) =>
          stage.id === stageId ? { ...stage, status, result: result || stage.result } : stage
        )
      );
    },
    []
  );

  const handleCancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    router.push('/impact-analytics/analyze');
  }, [router]);

  // Helper to extract pillar score
  function getScore(esgData: { scores?: Array<{ id: string; treeLevel: string; score: number }> }, pillar: string): number | string {
    const score = esgData.scores?.find(
      (s) => s.treeLevel === 'PILLAR' && s.id === pillar
    )?.score;
    return score ?? '-';
  }

  useEffect(() => {
    // Get pending analysis from sessionStorage
    const stored = sessionStorage.getItem('pendingAnalysis');
    if (!stored) {
      router.push('/impact-analytics/analyze');
      return;
    }

    const analysis: PendingAnalysis = JSON.parse(stored);
    setPositionCount(analysis.holdings.length);

    // Build query params for SSE endpoint
    const params = new URLSearchParams({
      holdings: JSON.stringify(analysis.holdings),
      name: analysis.portfolioName,
    });

    // Connect to SSE endpoint
    const eventSource = new EventSource(`/impact-analytics/api/scores/stream?${params.toString()}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);

        // Update progress
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }

        // Handle stage updates
        switch (data.stage) {
          case 'creating':
            updateStageStatus('creating', 'loading');
            break;

          case 'processing':
            updateStageStatus('creating', 'complete');
            updateStageStatus('processing', 'loading');
            if (data.data?.positionCount) {
              setPositionCount(data.data.positionCount);
              updateStageStatus('processing', 'loading', `${data.data.positionCount.toLocaleString()} positions`);
            }
            break;

          case 'esg_impact':
            updateStageStatus('processing', 'complete');
            updateStageStatus('esg_impact', 'loading');
            break;

          case 'climate':
            updateStageStatus('esg_impact', 'complete');
            // Update preview with ESG scores
            if (data.data?.esgImpact) {
              const esgData = data.data.esgImpact;
              const esgScore = esgData.scores?.find(
                (s) => s.treeLevel === 'TOTAL' && s.id === 'ESG'
              )?.score;
              if (esgScore) {
                setPreview((prev) => ({ ...prev, esgScore }));
                updateStageStatus('esg_impact', 'complete', `E: ${getScore(esgData, 'ENVIRONMENTAL')} S: ${getScore(esgData, 'SOCIAL')} G: ${getScore(esgData, 'GOVERNANCE')}`);
              }
            }
            updateStageStatus('climate', 'loading');
            break;

          case 'exposures':
            updateStageStatus('climate', 'complete');
            // Update preview with climate data
            if (data.data?.tcfd) {
              const tempRating = data.data.tcfd.values?.find(
                (v) => v.id.includes('TEMP') || v.id.includes('temperature')
              )?.value;
              if (tempRating) {
                setPreview((prev) => ({ ...prev, climateRating: tempRating }));
                updateStageStatus('climate', 'complete', `${tempRating.toFixed(1)}°C aligned`);
              }
            }
            updateStageStatus('exposures', 'loading');
            break;

          case 'complete':
            updateStageStatus('exposures', 'complete');
            setProgress(1);

            // Store results and navigate
            if (data.data) {
              const resultId = `analysis-${Date.now()}`;
              const result = {
                id: resultId,
                name: analysis.portfolioName,
                date: new Date().toISOString(),
                positionCount,
                ...data.data,
              };
              sessionStorage.setItem('analysisResult', JSON.stringify(result));

              // Add to recent analyses
              const recentRaw = localStorage.getItem('recentAnalyses');
              const recent = recentRaw ? JSON.parse(recentRaw) : [];
              recent.unshift({
                id: resultId,
                name: analysis.portfolioName,
                date: new Date().toLocaleDateString(),
                mode: 'single',
                positionCount,
              });
              localStorage.setItem('recentAnalyses', JSON.stringify(recent.slice(0, 10)));

              // Navigate to results
              setTimeout(() => {
                router.push('/impact-analytics/analyze/results');
              }, 500);
            }
            break;

          case 'error':
            setError(data.error || 'An error occurred during analysis');
            eventSource.close();
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      setError('Connection lost. Please try again.');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [router, updateStageStatus, positionCount]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-8 py-6 flex items-center justify-between">
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
      <main className="max-w-xl mx-auto px-8 py-16">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl text-gray-900 mb-3">
            Analyzing Portfolio
          </h1>
          <p className="text-gray-500">
            Fetching ESG metrics from Clarity AI
          </p>
        </div>

        {/* Error State */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <Link
              href="/impact-analytics/analyze"
              className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </Link>
          </div>
        ) : (
          /* Progress Display */
          <ProgressDisplay
            progress={progress}
            stages={stages}
            preview={preview}
            positionCount={positionCount}
            onCancel={handleCancel}
          />
        )}
      </main>
    </div>
  );
}
