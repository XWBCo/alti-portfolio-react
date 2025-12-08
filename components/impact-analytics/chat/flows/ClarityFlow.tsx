'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronRight, Leaf, Users, Shield, Calculator, Building2 } from 'lucide-react';
import { SingleSelectChips } from './MultiSelectChips';

type FlowStep = 'category' | 'metric' | 'detail';

interface ClarityFlowProps {
  onQuery: (query: string, context: Record<string, string>) => void;
  onBack: () => void;
}

interface MetricCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  metrics: { id: string; label: string; description: string }[];
}

const METRIC_CATEGORIES: MetricCategory[] = [
  {
    id: 'carbon',
    label: 'Carbon Metrics',
    description: 'Emissions, intensity, footprint',
    icon: <Leaf className="w-5 h-5" />,
    metrics: [
      { id: 'carbon_intensity', label: 'Carbon Intensity', description: 'Scope 1+2 emissions per revenue' },
      { id: 'financed_emissions', label: 'Financed Emissions', description: 'Emissions attributable to investments' },
      { id: 'carbon_footprint', label: 'Carbon Footprint', description: 'Total emissions exposure' },
      { id: 'net_zero', label: 'Net Zero Alignment', description: 'Alignment with net zero pathways' },
    ],
  },
  {
    id: 'social',
    label: 'Social Impact',
    description: 'Diversity, labor, community',
    icon: <Users className="w-5 h-5" />,
    metrics: [
      { id: 'board_diversity', label: 'Board Diversity', description: 'Gender and ethnic diversity on boards' },
      { id: 'living_wage', label: 'Living Wage', description: 'Fair compensation practices' },
      { id: 'community', label: 'Community Investment', description: 'Local community engagement' },
      { id: 'human_rights', label: 'Human Rights', description: 'Supply chain and operations' },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    description: 'Board, ethics, transparency',
    icon: <Shield className="w-5 h-5" />,
    metrics: [
      { id: 'board_independence', label: 'Board Independence', description: 'Independent director ratio' },
      { id: 'executive_pay', label: 'Executive Compensation', description: 'Pay equity and alignment' },
      { id: 'ethics', label: 'Business Ethics', description: 'Anti-corruption, compliance' },
      { id: 'transparency', label: 'Transparency', description: 'Disclosure quality' },
    ],
  },
  {
    id: 'examples',
    label: 'Real Examples',
    description: 'Calculations and case studies',
    icon: <Calculator className="w-5 h-5" />,
    metrics: [
      { id: 'intensity_calc', label: 'Intensity Calculation', description: 'Step-by-step carbon intensity' },
      { id: 'financed_calc', label: 'Financed Emissions Calc', description: 'Portfolio attribution example' },
      { id: 'benchmark', label: 'Benchmark Comparison', description: 'vs. sector averages' },
    ],
  },
  {
    id: 'about',
    label: 'About Clarity AI',
    description: 'Company, methodology, coverage',
    icon: <Building2 className="w-5 h-5" />,
    metrics: [
      { id: 'company', label: 'Company Overview', description: 'Who is Clarity AI?' },
      { id: 'methodology', label: 'Methodology', description: 'How scores are calculated' },
      { id: 'coverage', label: 'Data Coverage', description: 'Assets and metrics covered' },
      { id: 'advantages', label: 'Key Advantages', description: 'Why Clarity AI?' },
    ],
  },
];

export function ClarityFlow({ onQuery, onBack }: ClarityFlowProps) {
  const [step, setStep] = useState<FlowStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const currentCategory = METRIC_CATEGORIES.find((c) => c.id === selectedCategory);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep('metric');
  };

  const handleMetricSelect = (metricId: string) => {
    setSelectedMetric(metricId);

    const category = METRIC_CATEGORIES.find((c) => c.id === selectedCategory);
    const metric = category?.metrics.find((m) => m.id === metricId);

    if (!metric) return;

    // Generate natural language query
    let query: string;

    if (selectedCategory === 'examples') {
      query = `Show me a real-world example of calculating ${metric.label.toLowerCase()}`;
    } else if (selectedCategory === 'about') {
      query = `Tell me about Clarity AI's ${metric.label.toLowerCase()}`;
    } else {
      query = `Explain the ${metric.label} metric - what is it, how is it calculated, and what does AlTi consider a good score?`;
    }

    onQuery(query, {
      category: selectedCategory!,
      metric: metricId,
      intent: 'clarity',
    });
  };

  const goBack = () => {
    if (step === 'metric') {
      setStep('category');
      setSelectedCategory(null);
    } else {
      onBack();
    }
  };

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
          <h3 className="font-medium text-gray-900">Clarity AI Metrics</h3>
          <p className="text-sm text-gray-500">ESG methodology and metrics</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className={step === 'category' ? 'text-emerald-600 font-medium' : ''}>
          Category
        </span>
        {selectedCategory && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className={step === 'metric' ? 'text-emerald-600 font-medium' : ''}>
              {currentCategory?.label}
            </span>
          </>
        )}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 'category' && (
          <motion.div
            key="category"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <p className="text-gray-600">What would you like to learn about?</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {METRIC_CATEGORIES.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleCategorySelect(category.id)}
                  className="flex items-center gap-3 p-4 bg-white border border-emerald-200 rounded-xl transition-all hover:border-emerald-500 hover:shadow-sm text-left"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-emerald-50 rounded-lg">
                    <span className="text-emerald-600">{category.icon}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{category.label}</p>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'metric' && currentCategory && (
          <motion.div
            key="metric"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <p className="text-gray-600">Select a specific metric:</p>

            <div className="space-y-2">
              {currentCategory.metrics.map((metric, index) => (
                <motion.button
                  key={metric.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleMetricSelect(metric.id)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-emerald-200 rounded-xl transition-all hover:border-emerald-500 hover:bg-emerald-50/50 text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900">{metric.label}</p>
                    <p className="text-sm text-gray-500">{metric.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
