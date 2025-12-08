'use client';

import { motion } from 'motion/react';
import { BookOpen, TrendingUp, BarChart3 } from 'lucide-react';

export type Intent = 'archetype' | 'pipeline' | 'clarity';

interface IntentOption {
  id: Intent;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    id: 'archetype',
    label: 'Model/Archetype',
    description: 'Explore investment models, fund allocations, and holdings',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    description: 'Discover upcoming 2025 investment opportunities',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    id: 'clarity',
    label: 'Clarity AI Metrics',
    description: 'Learn about ESG metrics, calculations, and methodology',
    icon: <BarChart3 className="w-5 h-5" />,
  },
];

interface IntentRouterProps {
  onSelectIntent: (intent: Intent) => void;
  className?: string;
}

export function IntentRouter({ onSelectIntent, className = '' }: IntentRouterProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <p className="text-gray-600 text-center">What would you like to explore?</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {INTENT_OPTIONS.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => onSelectIntent(option.id)}
            className="group flex flex-col items-center p-6 bg-white border border-emerald-200 rounded-xl transition-all hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-100"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-emerald-50 rounded-full mb-3 group-hover:bg-emerald-100 transition-colors">
              <span className="text-emerald-600">{option.icon}</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">{option.label}</h3>
            <p className="text-sm text-gray-500 text-center">{option.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
