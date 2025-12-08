'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Clock, ChevronRight, Trash2 } from 'lucide-react';
import FeatureCard from '@/components/FeatureCard';
import { IconPrism, IconAnalyzePortfolio, IconComparePortfolios } from '@/components/icons/AltiIcons';

interface RecentAnalysis {
  id: string;
  name: string;
  date: string;
  mode: 'single' | 'compare';
  positionCount?: number;
}

export default function ImpactAnalyticsHub() {
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentAnalyses');
    if (stored) {
      try {
        setRecentAnalyses(JSON.parse(stored));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  const clearAnalyses = () => {
    localStorage.removeItem('recentAnalyses');
    setRecentAnalyses([]);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <main className="max-w-5xl mx-auto px-8 py-12">
        {/* Featured Card - Prism AI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <FeatureCard
            name="Prism (AI)"
            description="Query ESG data, impact metrics, and sustainability research across platform holdings. Get instant answers on climate risk, portfolio alignment, and impact analysis."
            href="/impact-analytics/research"
            icon={IconPrism}
            featured
            accentColor="#10B981"
            ctaText="Ask"
          />
        </motion.div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <FeatureCard
              name="Analyze Portfolio"
              description="ESG scores, climate metrics, and generate professional PDF reports"
              tooltip="Upload a portfolio to analyze its ESG performance, climate risk exposure, and generate comprehensive sustainability reports."
              href="/impact-analytics/analyze"
              icon={IconAnalyzePortfolio}
              accentColor="#2DD4BF"
              ctaText="Get Started"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <FeatureCard
              name="Compare Portfolios"
              description="Side-by-side analysis with performance deltas and benchmark comparison"
              tooltip="Compare two portfolios to identify ESG differences, performance gaps, and opportunities for improvement."
              href="/impact-analytics/compare"
              icon={IconComparePortfolios}
              accentColor="#34D399"
              ctaText="Get Started"
            />
          </motion.div>
        </div>

        {/* Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Analyses
              </h3>
              <button
                onClick={clearAnalyses}
                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {recentAnalyses.slice(0, 5).map((analysis) => (
                <Link
                  key={analysis.id}
                  href={`/impact-analytics/${analysis.mode === 'compare' ? 'compare' : 'analyze'}/results?id=${analysis.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      analysis.mode === 'compare' ? 'bg-[#D1FAE5]' : 'bg-[#CCFBF1]'
                    }`}>
                      {analysis.mode === 'compare' ? (
                        <IconComparePortfolios className="w-6 h-6 text-[#34D399]" />
                      ) : (
                        <IconAnalyzePortfolio className="w-6 h-6 text-[#2DD4BF]" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{analysis.name}</p>
                      <p className="text-xs text-gray-400">
                        {analysis.positionCount ? `${analysis.positionCount.toLocaleString()} positions` : ''} · {analysis.date}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State for Recent */}
        {recentAnalyses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-center py-12 text-gray-400"
          >
            <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Your recent analyses will appear here</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
