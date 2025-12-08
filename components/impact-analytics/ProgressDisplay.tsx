'use client';

import { motion, useSpring, useTransform } from 'motion/react';
import { Check, Circle, Loader2 } from 'lucide-react';
import type { AnalysisStage, AnalysisPreview } from '@/lib/clarity-api/types';

interface Stage {
  id: AnalysisStage;
  label: string;
  status: 'pending' | 'loading' | 'complete';
  result?: string;
}

interface ProgressDisplayProps {
  progress: number; // 0-1
  stages: Stage[];
  preview?: AnalysisPreview;
  positionCount?: number;
  onCancel?: () => void;
}

function StageIcon({ status }: { status: 'pending' | 'loading' | 'complete' }) {
  if (status === 'complete') {
    return (
      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
        <Check className="w-4 h-4 text-gray-600" />
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="w-6 h-6 rounded-full bg-[#E5F5F3] flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-[#00F0DB] animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
      <Circle className="w-3 h-3 text-gray-300" />
    </div>
  );
}

function StageRow({ stage }: { stage: Stage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 py-3 ${
        stage.status === 'pending' ? 'opacity-50' : ''
      }`}
    >
      <StageIcon status={stage.status} />
      <div className="flex-1">
        <p
          className={`text-sm ${
            stage.status === 'loading'
              ? 'text-gray-900 font-medium'
              : 'text-gray-600'
          }`}
        >
          {stage.label}
        </p>
      </div>
      {stage.result && (
        <p className="text-sm text-gray-500 font-mono">{stage.result}</p>
      )}
      {stage.status === 'loading' && !stage.result && (
        <p className="text-sm text-[#00F0DB]">Fetching...</p>
      )}
    </motion.div>
  );
}

export function ProgressDisplay({
  progress,
  stages,
  preview,
  positionCount,
  onCancel,
}: ProgressDisplayProps) {
  // Spring animation for smooth progress bar
  const springProgress = useSpring(progress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const scaleX = useTransform(springProgress, [0, 1], [0, 1]);

  // Calculate estimated time based on progress
  const estimatedSeconds = progress > 0.1 ? Math.ceil((1 - progress) * 10) : null;

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="h-[3px] bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#00F0DB] origin-left"
            style={{ scaleX }}
          />
        </div>

        {/* Percentage */}
        <div className="text-center">
          <motion.div
            className="text-5xl font-light text-gray-900"
            key={Math.round(progress * 100)}
            initial={{ opacity: 0.5, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {Math.round(progress * 100)}%
          </motion.div>

          {estimatedSeconds !== null && (
            <p className="mt-2 text-sm text-gray-400">
              Estimated: ~{estimatedSeconds} seconds remaining
            </p>
          )}
        </div>
      </div>

      {/* Position Count */}
      {positionCount !== undefined && (
        <div className="text-center text-sm text-gray-500">
          {positionCount.toLocaleString()} positions being analyzed
        </div>
      )}

      {/* Stages */}
      <div className="border-t border-b border-gray-100 py-4">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Analysis Progress
        </h3>
        <div className="divide-y divide-gray-50">
          {stages.map((stage) => (
            <StageRow key={stage.id} stage={stage} />
          ))}
        </div>
      </div>

      {/* Preview Scores */}
      {preview && (preview.esgScore || preview.climateRating || preview.netZeroCoverage) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-4"
        >
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Preview
          </h3>
          <div className="flex items-center justify-center gap-6 text-sm">
            {preview.esgScore && (
              <div className="text-center">
                <p className="text-2xl font-light text-gray-900">{preview.esgScore}</p>
                <p className="text-xs text-gray-500">ESG Score</p>
              </div>
            )}
            {preview.climateRating && (
              <div className="text-center">
                <p className="text-2xl font-light text-gray-900">
                  {preview.climateRating.toFixed(1)}°C
                </p>
                <p className="text-xs text-gray-500">Climate</p>
              </div>
            )}
            {preview.netZeroCoverage && (
              <div className="text-center">
                <p className="text-2xl font-light text-gray-900">
                  {Math.round(preview.netZeroCoverage)}%
                </p>
                <p className="text-xs text-gray-500">Net Zero</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Cancel Button */}
      {onCancel && (
        <div className="text-center">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Default stages configuration
export const DEFAULT_STAGES: Stage[] = [
  { id: 'creating', label: 'Creating portfolio', status: 'pending' },
  { id: 'processing', label: 'Processing positions', status: 'pending' },
  { id: 'esg_impact', label: 'ESG Impact scores', status: 'pending' },
  { id: 'climate', label: 'Climate metrics', status: 'pending' },
  { id: 'exposures', label: 'Position exposures', status: 'pending' },
];

export default ProgressDisplay;
