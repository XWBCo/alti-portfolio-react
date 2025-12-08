'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import { MultiSelectChips, SingleSelectChips } from './MultiSelectChips';

type FlowStep = 'region' | 'archetype' | 'results';

interface PipelineFlowProps {
  onQuery: (query: string, context: Record<string, string | string[]>) => void;
  onBack: () => void;
}

const REGION_OPTIONS = [
  { id: 'US', label: 'US Only', description: 'Domestic strategies' },
  { id: 'INT', label: 'International', description: 'Non-US strategies' },
  { id: 'BOTH', label: 'Both', description: 'All regions' },
];

const ARCHETYPE_OPTIONS = [
  { id: '1', label: 'Integrated Best Ideas', description: 'ESG-integrated returns focus' },
  { id: '2', label: '100% Impact', description: 'Comprehensive impact' },
  { id: '3', label: 'Climate Sustainability', description: 'Environmental focus' },
  { id: '4', label: 'Inclusive Innovation', description: 'Social equity focus' },
];

export function PipelineFlow({ onQuery, onBack }: PipelineFlowProps) {
  const [step, setStep] = useState<FlowStep>('region');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);

  const handleRegionSelect = (regions: string[]) => {
    setSelectedRegions(regions);
    if (regions.length > 0) {
      setStep('archetype');
    }
  };

  const handleArchetypeSelect = (archetypes: string[]) => {
    setSelectedArchetypes(archetypes);
  };

  const handleShowResults = () => {
    // Build natural language query
    const regionText = selectedRegions.includes('BOTH')
      ? 'US and International'
      : selectedRegions.join(' and ');

    const archetypeText = selectedArchetypes.length === 4
      ? 'all archetypes'
      : selectedArchetypes
          .map((id) => ARCHETYPE_OPTIONS.find((a) => a.id === id)?.label)
          .filter(Boolean)
          .join(', ');

    const query = `What strategies are in the 2025 pipeline for ${regionText} region(s) fitting ${archetypeText}?`;

    onQuery(query, {
      regions: selectedRegions,
      archetypes: selectedArchetypes,
      intent: 'pipeline',
    });
  };

  const goBack = () => {
    if (step === 'archetype') {
      setStep('region');
    } else if (step === 'results') {
      setStep('archetype');
    } else {
      onBack();
    }
  };

  const canShowResults = selectedArchetypes.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h3 className="font-medium text-gray-900">2025 Impact Pipeline</h3>
          <p className="text-sm text-gray-500">Explore upcoming opportunities</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className={step === 'region' ? 'text-emerald-600 font-medium' : ''}>
          Region
        </span>
        {selectedRegions.length > 0 && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className={step === 'archetype' ? 'text-emerald-600 font-medium' : ''}>
              Archetypes
            </span>
          </>
        )}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 'region' && (
          <motion.div
            key="region"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <p className="text-gray-600">Which region(s) are you interested in?</p>
            <SingleSelectChips
              options={REGION_OPTIONS}
              selected={selectedRegions[0] || null}
              onChange={(region) => handleRegionSelect([region])}
            />
          </motion.div>
        )}

        {step === 'archetype' && (
          <motion.div
            key="archetype"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <p className="text-gray-600 mb-1">Which archetype(s) are relevant?</p>
              <p className="text-sm text-gray-400">Select all that apply</p>
            </div>

            <MultiSelectChips
              options={ARCHETYPE_OPTIONS}
              selected={selectedArchetypes}
              onChange={handleArchetypeSelect}
              allowMultiple={true}
            />

            {/* Select All / Clear buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedArchetypes(ARCHETYPE_OPTIONS.map((a) => a.id))}
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setSelectedArchetypes([])}
                className="text-sm text-gray-500 hover:text-gray-600"
              >
                Clear
              </button>
            </div>

            {/* Show Results button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: canShowResults ? 1 : 0.5, y: 0 }}
              onClick={handleShowResults}
              disabled={!canShowResults}
              className={`
                w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-medium
                transition-all
                ${canShowResults
                  ? 'bg-emerald-500 hover:bg-emerald-600 cursor-pointer'
                  : 'bg-gray-300 cursor-not-allowed'
                }
              `}
            >
              <Search className="w-4 h-4" />
              <span>Show Matching Strategies</span>
            </motion.button>

            {/* Selection summary */}
            {selectedArchetypes.length > 0 && (
              <p className="text-sm text-gray-500 text-center">
                {selectedArchetypes.length} archetype(s) selected
                {selectedRegions[0] !== 'BOTH' && ` for ${selectedRegions[0]}`}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
