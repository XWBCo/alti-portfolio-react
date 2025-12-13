'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  IconPortfolioEvaluation,
  IconMonteCarlo,
  IconRiskContribution,
  IconCapitalMarket,
  IconImpactAnalytics,
  IconClientAssessment,
  IconAnalytics,
  IconInvestmentResearch,
  IconPrism,
  IconAnalyzePortfolio,
  IconComparePortfolios,
} from '@/components/icons/AltiIcons';
import { ALTI_COLORS, FONT_FAMILY } from '@/lib/theme';

// Sample financial data
const SAMPLE_FINANCIAL_DATA = [
  { asset: 'US Equities', value: 250000, weight: 35.7, ytdReturn: 12.5, oneYearReturn: 18.2 },
  { asset: 'International Equities', value: 150000, weight: 21.4, ytdReturn: 8.3, oneYearReturn: 11.5 },
  { asset: 'Fixed Income', value: 200000, weight: 28.6, ytdReturn: -2.1, oneYearReturn: -0.8 },
  { asset: 'Real Estate', value: 75000, weight: 10.7, ytdReturn: 6.8, oneYearReturn: 9.2 },
  { asset: 'Commodities', value: 25000, weight: 3.6, ytdReturn: 15.2, oneYearReturn: 22.1 },
];

const SUMMARY_METRICS = {
  'Total Portfolio Value': '$700,000',
  'YTD Performance': '+7.8%',
  'Sharpe Ratio': '1.42',
  'Max Drawdown': '-8.3%',
  'Beta': '0.92',
};

export default function ComponentsPreviewPage() {
  const [selectedTab, setSelectedTab] = useState<'colors' | 'icons' | 'buttons' | 'forms' | 'tables'>('colors');

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal text-[#010203] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Component Library
          </h1>
          <p className="text-lg text-[#757575]">
            AlTi Risk & Portfolio Construction - Design System
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {['colors', 'icons', 'buttons', 'forms', 'tables'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as typeof selectedTab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                selectedTab === tab
                  ? 'text-[#00f0db] border-b-2 border-[#00f0db]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Color Palette */}
        {selectedTab === 'colors' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Primary Colors</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries({
                  'Turquoise (Primary)': ALTI_COLORS.primary,
                  'Secondary': ALTI_COLORS.secondary,
                  'Dark (Text)': ALTI_COLORS.dark,
                  'Gray (Muted)': ALTI_COLORS.gray,
                }).map(([name, color]) => (
                  <div key={name} className="text-center">
                    <div
                      className="h-20 rounded-lg mb-2 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-sm font-medium text-gray-700">{name}</p>
                    <p className="text-xs text-gray-500 font-mono">{color}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Accent Colors</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries({
                  'Light Teal': ALTI_COLORS.lightTeal,
                  'Mid Teal': ALTI_COLORS.midTeal,
                  'Light Gray': ALTI_COLORS.lightGray,
                  'Gray 100': ALTI_COLORS.gray100,
                  'Gray 200': ALTI_COLORS.gray200,
                }).map(([name, color]) => (
                  <div key={name} className="text-center">
                    <div
                      className="h-16 rounded-lg mb-2 border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-sm font-medium text-gray-700">{name}</p>
                    <p className="text-xs text-gray-500 font-mono">{color}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Typography</h2>
              <div className="space-y-4 bg-white p-6 rounded-lg border border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Heading 1 (Georgia, 32px)</p>
                  <h1 style={{ fontFamily: FONT_FAMILY.heading, fontSize: '32px' }}>
                    The quick brown fox jumps
                  </h1>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Heading 2 (Georgia, 26px)</p>
                  <h2 style={{ fontFamily: FONT_FAMILY.heading, fontSize: '26px' }}>
                    Portfolio Analysis Dashboard
                  </h2>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Body (Arial, 15px)</p>
                  <p style={{ fontFamily: FONT_FAMILY.body, fontSize: '15px' }}>
                    Risk-adjusted returns are calculated using the Sharpe ratio methodology, comparing excess returns against portfolio volatility.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Monospace (Monaco, 13px)</p>
                  <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    annualReturn: 0.07, volatility: 0.12
                  </code>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Icons */}
        {selectedTab === 'icons' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Tool Icons</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { name: 'Portfolio Evaluation', Icon: IconPortfolioEvaluation },
                  { name: 'Monte Carlo', Icon: IconMonteCarlo },
                  { name: 'Risk Contribution', Icon: IconRiskContribution },
                  { name: 'Capital Market', Icon: IconCapitalMarket },
                  { name: 'Impact Analytics', Icon: IconImpactAnalytics },
                  { name: 'Client Assessment', Icon: IconClientAssessment },
                  { name: 'Analytics', Icon: IconAnalytics },
                  { name: 'Investment Research', Icon: IconInvestmentResearch },
                ].map(({ name, Icon }) => (
                  <div key={name} className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="w-20 h-20 mx-auto mb-3 text-[#2980B9]">
                      <Icon className="w-full h-full" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">{name}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Special Icons</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { name: 'AI Chat', Icon: IconPrism, color: '#10B981' },
                  { name: 'Analyze Portfolio', Icon: IconAnalyzePortfolio, color: '#10B981' },
                  { name: 'Compare Portfolios', Icon: IconComparePortfolios, color: '#10B981' },
                ].map(({ name, Icon, color }) => (
                  <div key={name} className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="w-20 h-20 mx-auto mb-3" style={{ color }}>
                      <Icon className="w-full h-full" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">{name}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Icon Hover States</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { name: 'Default', color: '#2980B9', accent: undefined },
                  { name: 'Turquoise Hover', color: '#00f0db', accent: '#00f0db' },
                  { name: 'Emerald Hover', color: '#34E5B8', accent: '#34E5B8' },
                  { name: 'Disabled', color: '#A3A3A3', accent: undefined },
                ].map(({ name, color, accent }) => (
                  <div key={name} className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="w-16 h-16 mx-auto mb-3" style={{ color }}>
                      <IconMonteCarlo className="w-full h-full" accentColor={accent} />
                    </div>
                    <p className="text-sm font-medium text-gray-700">{name}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Buttons */}
        {selectedTab === 'buttons' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Primary Buttons</h2>
              <div className="flex flex-wrap gap-4 bg-white p-6 rounded-lg border border-gray-200">
                <button className="px-6 py-3 bg-[#00f0db] text-[#010203] font-semibold rounded-lg hover:bg-[#00d4c1] transition-colors">
                  Run Simulation
                </button>
                <button className="px-6 py-3 bg-[#074269] text-white font-semibold rounded-lg hover:bg-[#053050] transition-colors">
                  Add to Analysis
                </button>
                <button className="px-6 py-3 bg-[#10B981] text-white font-semibold rounded-lg hover:bg-[#059669] transition-colors">
                  Generate Report
                </button>
                <button className="px-6 py-3 bg-gray-200 text-gray-400 font-semibold rounded-lg cursor-not-allowed" disabled>
                  Disabled
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Secondary Buttons</h2>
              <div className="flex flex-wrap gap-4 bg-white p-6 rounded-lg border border-gray-200">
                <button className="px-6 py-3 border-2 border-[#00f0db] text-[#00f0db] font-medium rounded-lg hover:bg-[#00f0db] hover:text-[#010203] transition-colors">
                  Download CSV
                </button>
                <button className="px-6 py-3 border-2 border-[#074269] text-[#074269] font-medium rounded-lg hover:bg-[#074269] hover:text-white transition-colors">
                  View Details
                </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Button Sizes</h2>
              <div className="flex flex-wrap items-center gap-4 bg-white p-6 rounded-lg border border-gray-200">
                <button className="px-3 py-1.5 text-sm bg-[#00f0db] text-[#010203] font-medium rounded">
                  Small
                </button>
                <button className="px-4 py-2 bg-[#00f0db] text-[#010203] font-medium rounded-lg">
                  Medium
                </button>
                <button className="px-6 py-3 text-lg bg-[#00f0db] text-[#010203] font-semibold rounded-lg">
                  Large
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Forms */}
        {selectedTab === 'forms' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Input Fields</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Text Input
                  </label>
                  <input
                    type="text"
                    placeholder="Enter value..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00f0db] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Number Input
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00f0db] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Select Dropdown
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00f0db] focus:border-transparent">
                    <option>Select an option...</option>
                    <option>Core Assets</option>
                    <option>Core + Private</option>
                    <option>Unconstrained</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Disabled Input
                  </label>
                  <input
                    type="text"
                    value="Read only value"
                    disabled
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Range Sliders</h2>
              <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Duration: 30 years
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    defaultValue="30"
                    className="w-full accent-[#00f0db]"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>5 years</span>
                    <span>50 years</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Checkboxes & Toggles</h2>
              <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-gray-300 text-[#00f0db] focus:ring-[#00f0db]"
                  />
                  <span className="text-sm text-gray-700">Use EWMA Covariance</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#00f0db] focus:ring-[#00f0db]"
                  />
                  <span className="text-sm text-gray-700">Compare to Benchmark</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-gray-300 text-[#00f0db] focus:ring-[#00f0db]"
                  />
                  <span className="text-sm text-gray-700">Run Stress Scenarios</span>
                </label>
              </div>
            </section>
          </div>
        )}

        {/* Tables */}
        {selectedTab === 'tables' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Financial Data Table</h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Asset</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Value</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Weight %</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">YTD Return</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">1Y Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_FINANCIAL_DATA.map((row, idx) => (
                      <tr key={row.asset} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="py-3 px-4 text-sm font-medium text-gray-700">{row.asset}</td>
                        <td className="py-3 px-4 text-sm text-right font-mono text-gray-600">
                          ${row.value.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-mono text-gray-600">
                          {row.weight.toFixed(1)}%
                        </td>
                        <td className={`py-3 px-4 text-sm text-right font-mono ${row.ytdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {row.ytdReturn >= 0 ? '+' : ''}{row.ytdReturn.toFixed(1)}%
                        </td>
                        <td className={`py-3 px-4 text-sm text-right font-mono ${row.oneYearReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {row.oneYearReturn >= 0 ? '+' : ''}{row.oneYearReturn.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Summary Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(SUMMARY_METRICS).map(([label, value]) => (
                  <div key={label} className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                    <p className={`text-xl font-semibold ${
                      value.startsWith('+') ? 'text-green-600' :
                      value.startsWith('-') ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#010203] mb-4">Info Cards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#074269]/5 rounded-lg border border-[#074269]/20">
                  <p className="text-sm text-[#074269]">
                    <strong>Info:</strong> Risk analysis uses LASSO regression for factor betas and EWMA for time-varying covariance estimation.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">
                    <strong>Success:</strong> Portfolio optimization completed successfully. 30 efficient frontier points generated.
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700">
                    <strong>Warning:</strong> Some assets have limited historical data. Results may be less reliable.
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">
                    <strong>Error:</strong> Unable to connect to risk service. Please try again later.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>AlTi Risk & Portfolio Construction Dashboard - Component Library v2.0</p>
        </div>
      </div>
    </div>
  );
}
