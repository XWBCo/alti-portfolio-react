'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { SingleSelectChips } from './MultiSelectChips';
import type { ArchetypeId } from '@/lib/client-assessment-types';

type FlowStep = 'topic' | 'asset_class' | 'sub_asset' | 'question';

interface ArchetypeFlowProps {
  archetype: ArchetypeId | string;
  region: 'US' | 'INT';
  onQuery: (query: string, context: Record<string, string>) => void;
  onBack: () => void;
}

const TOPIC_OPTIONS = [
  { id: 'performance', label: 'Performance', description: 'Returns, benchmarks, track record' },
  { id: 'holdings', label: 'Fund Holdings', description: 'Underlying investments and positions' },
  { id: 'esg', label: 'ESG Outcomes', description: 'Impact metrics and sustainability data' },
  { id: 'risk', label: 'Risk Levels', description: 'Allocation by risk tolerance' },
  { id: 'compare', label: 'Compare Models', description: 'Side-by-side archetype comparison' },
];

const ASSET_CLASS_OPTIONS = [
  { id: 'stability', label: 'Stability', description: 'Fixed income, bonds' },
  { id: 'diversified', label: 'Diversified', description: 'Multi-asset strategies' },
  { id: 'growth_public', label: 'Growth-Public', description: 'Public equities' },
  { id: 'growth_private', label: 'Growth-Private', description: 'Private equity/credit' },
  { id: 'catalytic', label: 'Catalytic', description: 'Catalytic Debt & Equity' },
];

const RISK_LEVELS = [
  { id: 'CON', label: 'Conservative', description: 'Lower risk tolerance' },
  { id: 'BAL', label: 'Balanced', description: 'Moderate risk' },
  { id: 'MG', label: 'Moderate Growth', description: 'Growth-oriented' },
  { id: 'GRO', label: 'Growth', description: 'Higher risk tolerance' },
  { id: 'LTG', label: 'Long-Term Growth', description: 'Maximum growth' },
];

const ARCHETYPE_NAMES: Record<string, string> = {
  impact_100: '100% Impact',
  inclusive_innovation: 'Inclusive Innovation',
  climate_sustainability: 'Climate Sustainability',
  integrated_best_ideas: 'Integrated Best Ideas',
};

export function ArchetypeFlow({ archetype, region, onQuery, onBack }: ArchetypeFlowProps) {
  const [step, setStep] = useState<FlowStep>('topic');
  const [topic, setTopic] = useState<string | null>(null);
  const [assetClass, setAssetClass] = useState<string | null>(null);
  const [riskLevel, setRiskLevel] = useState<string | null>(null);

  const archetypeName = ARCHETYPE_NAMES[archetype] || archetype;

  const handleTopicSelect = (selectedTopic: string) => {
    setTopic(selectedTopic);

    if (selectedTopic === 'holdings' || selectedTopic === 'esg') {
      setStep('asset_class');
    } else if (selectedTopic === 'risk') {
      // Show risk level selector
      setStep('sub_asset');
    } else {
      // Generate query directly
      const query = generateQuery(selectedTopic, null, null);
      onQuery(query, { topic: selectedTopic, archetype, region });
    }
  };

  const handleAssetClassSelect = (selectedAssetClass: string) => {
    setAssetClass(selectedAssetClass);
    const query = generateQuery(topic!, selectedAssetClass, null);
    onQuery(query, { topic: topic!, assetClass: selectedAssetClass, archetype, region });
  };

  const handleRiskLevelSelect = (selectedRisk: string) => {
    setRiskLevel(selectedRisk);
    const query = generateQuery(topic!, null, selectedRisk);
    onQuery(query, { topic: topic!, riskLevel: selectedRisk, archetype, region });
  };

  const generateQuery = (
    topicId: string,
    assetClassId: string | null,
    riskId: string | null
  ): string => {
    const topicQueries: Record<string, string> = {
      performance: `What is the performance of ${archetypeName}?`,
      holdings: assetClassId
        ? `What funds are in the ${assetClassId.replace('_', '-')} asset class for ${archetypeName}?`
        : `What funds are in ${archetypeName}?`,
      esg: assetClassId
        ? `What are the ESG outcomes for ${assetClassId.replace('_', '-')} funds in ${archetypeName}?`
        : `What are the ESG outcomes for ${archetypeName}?`,
      risk: riskId
        ? `What is the allocation for ${archetypeName} at ${riskId} risk level?`
        : `What are the risk level allocations for ${archetypeName}?`,
      compare: `Compare ${archetypeName} to other archetypes`,
    };

    return topicQueries[topicId] || `Tell me about ${archetypeName}`;
  };

  const goBack = () => {
    if (step === 'asset_class' || step === 'sub_asset') {
      setStep('topic');
      setTopic(null);
    } else {
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h3 className="font-medium text-gray-900">{archetypeName}</h3>
          <p className="text-sm text-gray-500">
            {region === 'US' ? 'US Region' : 'International'}
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className={step === 'topic' ? 'text-emerald-600 font-medium' : ''}>
          Topic
        </span>
        {topic && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className={step !== 'topic' ? 'text-emerald-600 font-medium' : ''}>
              {TOPIC_OPTIONS.find((t) => t.id === topic)?.label}
            </span>
          </>
        )}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 'topic' && (
          <motion.div
            key="topic"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <p className="text-gray-600">What would you like to know about {archetypeName}?</p>
            <SingleSelectChips
              options={TOPIC_OPTIONS}
              selected={topic}
              onChange={handleTopicSelect}
            />
          </motion.div>
        )}

        {step === 'asset_class' && (
          <motion.div
            key="asset_class"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <p className="text-gray-600">Which asset class?</p>
            <SingleSelectChips
              options={ASSET_CLASS_OPTIONS}
              selected={assetClass}
              onChange={handleAssetClassSelect}
            />
          </motion.div>
        )}

        {step === 'sub_asset' && topic === 'risk' && (
          <motion.div
            key="risk"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <p className="text-gray-600">Which risk level?</p>
            <SingleSelectChips
              options={RISK_LEVELS}
              selected={riskLevel}
              onChange={handleRiskLevelSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
