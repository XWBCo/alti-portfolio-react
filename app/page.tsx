'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import ToolCard from '@/components/ToolCard';
import { useAuth } from '@/lib/auth';
import { useTransition } from '@/lib/transitions';
import { FileText, Presentation, MessageSquare } from 'lucide-react';

// Tool definitions matching Dash app
const TOOLS = [
  {
    id: 'portfolio-evaluation',
    name: 'Client Portfolio Evaluation',
    description: 'Efficient frontier optimization and portfolio comparison',
    tooltip: 'Build efficient portfolios aligned with client goals. Upload portfolio CSVs, generate efficient frontiers, and compare risk/return metrics. Mean-variance optimization powered by quadratic programming.',
    icon: 'TrendingUp',
    href: '/portfolio-evaluation',
    disabled: false,
  },
  {
    id: 'monte-carlo',
    name: 'Monte Carlo Simulation',
    description: 'Stochastic modeling for probabilistic outcome analysis',
    tooltip: 'Project thousands of market scenarios to evaluate portfolio durability under different spending patterns. Assess probability of success, portfolio longevity, and optimal withdrawal strategies.',
    icon: 'LineChart',
    href: '/monte-carlo',
    disabled: false,
  },
  {
    id: 'risk-contribution',
    name: 'Risk Contribution Model',
    description: 'PCTR analysis, diversification metrics, and factor decomposition',
    tooltip: 'Analyze portfolio risk contributions (PCTR/MCTR), diversification benefits, and factor exposures. Uses LASSO regression for betas and EWMA for covariance. Powered by Python FastAPI backend.',
    icon: 'Shield',
    href: '/risk-contribution',
    disabled: false,
  },
  {
    id: 'cma',
    name: 'Capital Market Assumptions',
    description: 'Forward-looking return and volatility projections',
    tooltip: 'Explore expected returns, risks, and correlations across asset classes by investment horizon, economic scenario, or currency denomination. Forward-looking assumptions for portfolio construction.',
    icon: 'Database',
    href: '/capital-market-assumptions',
    disabled: false,
  },
  {
    id: 'impact-analytics',
    name: 'Impact',
    description: 'Generate professional ESG impact reports. Upload portfolio data for sustainability metrics, climate analysis, and benchmark comparisons.',
    tooltip: 'Analyze single portfolios or compare two side-by-side. Includes carbon footprint, PAI indicators, and UN SDG alignment. Powered by Clarity AI.',
    icon: 'Leaf',
    href: '/impact-analytics',
    disabled: false,
    isImpact: true,
  },
  {
    id: 'client-assessment',
    name: 'Client Assessment',
    description: 'Analyze survey responses with interactive charts, filtering, and statistical analysis for structured client discovery.',
    tooltip: 'Qualtrics integration for client profiling. Understand preferences, risk tolerance, and investment goals.',
    icon: 'Users',
    href: '/client-assessment',
    disabled: false,
  },
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    description: 'Usage metrics, system health, and developer tools',
    tooltip: 'Internal analytics for monitoring tool usage, API performance, system health indicators, and recent calculations. Developer-focused metrics dashboard.',
    icon: 'BarChart2',
    href: '/analytics',
    disabled: false,
    isDev: true,
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const { phase, animationType, completeTransition } = useTransition();
  const [viewAsUser, setViewAsUser] = useState(false);

  // Check if current user is a developer
  const isDeveloper = user?.roles?.includes('developer') ?? false;

  // Determine if we're entering from a login transition
  const isTransitionEntrance = phase === 'homepage-enter' || phase === 'transition';

  // Animation delays - longer/more dramatic when coming from transition
  const baseDelay = isTransitionEntrance ? 0.3 : 0;
  const staggerDelay = isTransitionEntrance ? 0.15 : 0.1;

  // Complete transition after entrance animation
  useEffect(() => {
    if (phase === 'homepage-enter') {
      const timer = setTimeout(() => {
        completeTransition();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [phase, completeTransition]);

  // Filter tools based on view mode
  const visibleTools = TOOLS.filter(tool => {
    // If tool is dev-only and either user is not dev OR dev is viewing as user, hide it
    if (tool.isDev && (!isDeveloper || viewAsUser)) {
      return false;
    }
    return true;
  });

  // Split tools into rows (4 in first row, rest in second)
  const firstRowTools = visibleTools.slice(0, 4);
  const secondRowTools = visibleTools.slice(4);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Hero Section */}
      <section className="px-6 md:px-[60px]" style={{ paddingTop: '16px', paddingBottom: '8px' }}>
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: isTransitionEntrance ? 40 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: isTransitionEntrance ? 0.7 : 0.5, delay: baseDelay }}
                className="text-[#010203] mb-5"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: '52px',
                  fontWeight: 300,
                  lineHeight: 1.1,
                  letterSpacing: '-1px',
                }}
              >
                Risk and Portfolio Construction
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: isTransitionEntrance ? 30 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: isTransitionEntrance ? 0.6 : 0.5, delay: baseDelay + staggerDelay }}
                className="text-[#5b5b5b] max-w-[800px]"
                style={{
                  fontSize: '18px',
                  lineHeight: 1.65,
                  fontWeight: 300,
                }}
              >
                Quantitative portfolio analysis and risk modeling for wealth advisors.
                {isDeveloper && !viewAsUser ? ' Seven' : ' Six'} integrated tools for portfolio construction and client reporting.
              </motion.p>
            </div>

            {/* Dev View Toggle */}
            {isDeveloper && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200"
              >
                <button
                  onClick={() => setViewAsUser(false)}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    !viewAsUser
                      ? 'bg-[#00B5AD] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Developer
                </button>
                <button
                  onClick={() => setViewAsUser(true)}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    viewAsUser
                      ? 'bg-[#00B5AD] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  User
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Tool Cards Grid */}
      <section className="px-6 md:px-[60px] pt-2 pb-4">
        <div className="max-w-[1600px] mx-auto">
          {/* First Row - 4 cards */}
          <motion.div
            initial={{ opacity: 0, y: isTransitionEntrance ? 30 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: baseDelay + staggerDelay * 2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-4"
            style={{ gap: '20px' }}
          >
            {firstRowTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: isTransitionEntrance ? 25 : 20, scale: isTransitionEntrance ? 0.95 : 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: isTransitionEntrance ? 0.5 : 0.3,
                  delay: baseDelay + staggerDelay * 2 + index * staggerDelay
                }}
              >
                <ToolCard
                  id={tool.id}
                  name={tool.name}
                  description={tool.description}
                  tooltip={tool.tooltip}
                  icon={tool.icon}
                  href={tool.href}
                  disabled={tool.disabled}
                  isImpact={tool.isImpact}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Second Row - remaining cards */}
          <motion.div
            initial={{ opacity: 0, y: isTransitionEntrance ? 30 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: baseDelay + staggerDelay * 6 }}
            className={`grid grid-cols-1 ${
              secondRowTools.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
            }`}
            style={{ gap: '20px' }}
          >
            {secondRowTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: isTransitionEntrance ? 25 : 20, scale: isTransitionEntrance ? 0.95 : 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: isTransitionEntrance ? 0.5 : 0.3,
                  delay: baseDelay + staggerDelay * 6 + index * staggerDelay
                }}
              >
                <ToolCard
                  id={tool.id}
                  name={tool.name}
                  description={tool.description}
                  tooltip={tool.tooltip}
                  icon={tool.icon}
                  href={tool.href}
                  disabled={tool.disabled}
                  isImpact={tool.isImpact}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section / Footer */}
      <section
        className="mt-10"
        style={{
          background: 'linear-gradient(135deg, #0A2240 0%, #1a3a5a 100%)',
          borderTop: '3px solid #00f0db',
        }}
      >
        <div className="max-w-[1400px] mx-auto text-center py-16 px-6 md:px-[60px]">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-white mb-10"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '26px',
              fontWeight: 300,
              fontStyle: 'italic',
            }}
          >
            &ldquo;An investment in knowledge pays the best interest.&rdquo;
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-wrap justify-center gap-4 mt-10"
          >
            <a
              href="/downloads/AlTi_Risk_Dashboard_Documentation.pdf"
              download
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00f0db] text-[#010203] font-medium hover:bg-[#00d6c3] transition-colors"
            >
              <FileText size={18} />
              User Guide
            </a>
            <a
              href="/downloads/RPC_UseCases.pptx"
              download
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-[#00f0db] text-[#00f0db] font-medium hover:bg-[#00f0db] hover:text-[#010203] transition-colors"
            >
              <Presentation size={18} />
              Use Cases PPT
            </a>
            <button
              onClick={() => {
                const email = 'rpc-feedback@alti-global.com';
                const subject = encodeURIComponent('RPC Dashboard Feedback');
                const body = encodeURIComponent('Hi RPC Team,\n\nI have the following feedback:\n\n');
                window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-[#00f0db] text-[#00f0db] font-medium hover:bg-[#00f0db] hover:text-[#010203] transition-colors"
            >
              <MessageSquare size={18} />
              Send Feedback
            </button>
          </motion.div>

          {/* Copyright */}
          <div className="mt-12">
            <p className="text-white text-sm opacity-90 mb-2">
              © 2025 AlTi Global, Inc.
            </p>
            <p className="text-[#C3E6E3] text-xs opacity-80 max-w-[1000px] mx-auto">
              Risk and Portfolio Construction Dashboard.
              Quantitative portfolio analysis and risk modeling for wealth advisors.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
