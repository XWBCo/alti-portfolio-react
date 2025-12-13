'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Loader2,
  Sparkles,
  ChevronDown,
  User,
  Building2,
  MapPin,
  Wallet,
  Calendar,
  TrendingUp,
  Shield,
  Clock,
  Droplets,
  Bot,
  Mail,
} from 'lucide-react';
import ArchetypeRadar from '@/components/client-assessment-v2/ArchetypeRadar';
import SurveyTable from '@/components/client-assessment-v2/SurveyTable';
import { MOCK_CLIENTS, getTopArchetype } from '@/lib/client-assessment-mock-data';
import { ARCHETYPE_DETAILS } from '@/lib/client-assessment-types';
import type { ArchetypeId, ArchetypeScore } from '@/lib/client-assessment-types';
import {
  RISK_PROFILES,
  getPortfolioModel,
  type RiskProfileId,
} from '@/lib/portfolio-models';

export default function ClientAssessmentPage() {
  const [selectedClientId, setSelectedClientId] = useState(MOCK_CLIENTS[0].id);
  const [isExporting, setIsExporting] = useState(false);
  const [showSurveyResponses, setShowSurveyResponses] = useState(false);

  const handleExportIPS = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/ips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClientId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate IPS');
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `IPS_${selectedClientId}.docx`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export IPS document');
    } finally {
      setIsExporting(false);
    }
  }, [selectedClientId]);

  const selectedClient = useMemo(
    () => MOCK_CLIENTS.find((c) => c.id === selectedClientId) || MOCK_CLIENTS[0],
    [selectedClientId]
  );

  // Impact client data
  const topArchetype = selectedClient.isImpactClient
    ? getTopArchetype(selectedClient.archetypeScores)
    : undefined;
  const topArchetypeDetails = topArchetype ? ARCHETYPE_DETAILS[topArchetype] : undefined;
  const topScore = topArchetype && selectedClient.archetypeScores
    ? selectedClient.archetypeScores[topArchetype]
    : undefined;

  const sortedArchetypes = useMemo(() => {
    if (!selectedClient.archetypeScores) return [];
    return (
      Object.entries(selectedClient.archetypeScores) as [ArchetypeId, ArchetypeScore][]
    ).sort((a, b) => a[1].rank - b[1].rank);
  }, [selectedClient.archetypeScores]);

  // Non-impact client data
  const riskProfile = selectedClient.riskProfile;
  const riskProfileDetails = riskProfile ? RISK_PROFILES[riskProfile.riskTolerance] : undefined;
  const portfolioModel = riskProfile
    ? getPortfolioModel(riskProfile.riskTolerance, riskProfile.portfolioType)
    : undefined;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Toolbar */}
      <div className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="px-4 py-2 border border-[#E5E5E5] rounded-lg bg-white text-[14px] text-[#0A2240] focus:outline-none focus:ring-2 focus:ring-[#00F0DB]/30 focus:border-[#00F0DB] transition-all min-w-[300px]"
            >
              {MOCK_CLIENTS.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.clientInfo.client} — {client.clientInfo.family}
                  {!client.isImpactClient && ' (Traditional)'}
                </option>
              ))}
            </select>
            <span
              className={`px-3 py-1 rounded-full text-[12px] font-medium ${
                selectedClient.isImpactClient
                  ? 'bg-[#ECFDF5] text-[#10B981]'
                  : 'bg-[#F0F9FF] text-[#0369A1]'
              }`}
            >
              {selectedClient.isImpactClient ? 'Impact' : 'Traditional'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 ${
                isExporting
                  ? 'bg-[#E5E5E5] text-[#737373] cursor-wait'
                  : 'bg-[#0A2240] text-white hover:bg-[#0A2240]/90'
              }`}
              onClick={handleExportIPS}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Export IPS
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* Top Cards Row - Always 3 cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-3 gap-6 mb-8"
        >
          {/* Card 1: Client Info */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E5E5]">
            <p className="text-[11px] font-medium text-[#737373] uppercase tracking-[0.1em] mb-4">
              Client
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[#0B6D7B]" />
                <span className="text-[15px] font-medium text-[#0A2240]">
                  {selectedClient.clientInfo.client}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-[#737373]" />
                <span className="text-[14px] text-[#525252]">
                  {selectedClient.clientInfo.family}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4 text-[#737373]" />
                <span className="text-[14px] text-[#525252]">
                  {selectedClient.clientInfo.portfolioValue}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#737373]" />
                <span className="text-[14px] text-[#525252]">
                  {selectedClient.clientInfo.location}
                </span>
              </div>
              <div className="pt-3 mt-3 border-t border-[#F5F5F5]">
                <div className="flex items-center gap-3 text-[13px] text-[#737373]">
                  <Mail className="w-4 h-4" />
                  {selectedClient.clientInfo.advisor}
                </div>
                <div className="flex items-center gap-3 text-[13px] text-[#737373] mt-2">
                  <Calendar className="w-4 h-4" />
                  Survey: {selectedClient.submittedDate}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Profile (Impact: Archetype / Non-Impact: Risk) */}
          {selectedClient.isImpactClient && topArchetypeDetails && topScore ? (
            <div
              className="bg-white rounded-xl p-6 border-l-4"
              style={{ borderLeftColor: topArchetypeDetails.color, borderTopColor: '#E5E5E5', borderRightColor: '#E5E5E5', borderBottomColor: '#E5E5E5', borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1 }}
            >
              <p className="text-[11px] font-medium text-[#737373] uppercase tracking-[0.1em] mb-4">
                Top Archetype
              </p>
              <h2
                className="text-[24px] mb-2"
                style={{ fontFamily: 'Georgia, serif', fontWeight: 400, color: topArchetypeDetails.color }}
              >
                {topArchetypeDetails.name}
              </h2>
              <p className="text-[13px] text-[#525252] mb-4 line-clamp-2">
                {topArchetypeDetails.description}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: topArchetypeDetails.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${topScore.percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
                <span
                  className="text-[18px] font-semibold"
                  style={{ color: topArchetypeDetails.color }}
                >
                  {topScore.percentage}%
                </span>
              </div>
              <p className="text-[12px] text-[#737373] mt-2">
                Rank #1 of 4 archetypes
              </p>
            </div>
          ) : riskProfileDetails ? (
            <div className="bg-white rounded-xl p-6 border-l-4 border-l-[#0369A1] border-t border-r border-b border-[#E5E5E5]">
              <p className="text-[11px] font-medium text-[#737373] uppercase tracking-[0.1em] mb-4">
                Risk Profile
              </p>
              <h2
                className="text-[24px] text-[#0369A1] mb-4"
                style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
              >
                {riskProfileDetails.name}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0369A1]" />
                  <div>
                    <p className="text-[11px] text-[#737373]">Growth</p>
                    <p className="text-[16px] font-semibold text-[#0369A1]">
                      {riskProfileDetails.growthPercentage}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#0B6D7B]" />
                  <div>
                    <p className="text-[11px] text-[#737373]">Stability</p>
                    <p className="text-[16px] font-semibold text-[#0B6D7B]">
                      {riskProfileDetails.stabilityPercentage}%
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-[#737373] mt-3">
                Tail Risk: {riskProfileDetails.tailRisk} • Target: CPI+{riskProfileDetails.cpiPlus}%
              </p>
            </div>
          ) : null}

          {/* Card 3: AI Assistant - Beta */}
          <div
            className={`rounded-xl p-6 border-2 relative overflow-hidden flex flex-col ${
              selectedClient.isImpactClient
                ? 'bg-gradient-to-br from-[#ECFDF5] via-white to-[#F0FDFA] border-[#10B981]/30'
                : 'bg-gradient-to-br from-[#F0F9FF] via-white to-[#ECFEFF] border-[#0369A1]/30'
            }`}
          >
            {/* Beta badge */}
            <div className="absolute top-3 right-3">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                selectedClient.isImpactClient
                  ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                  : 'bg-[#0369A1]/10 text-[#0369A1] border border-[#0369A1]/20'
              }`}>
                Beta
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              {selectedClient.isImpactClient ? (
                <Sparkles className="w-5 h-5 text-[#10B981]" />
              ) : (
                <Bot className="w-5 h-5 text-[#0369A1]" />
              )}
              <p className="text-[11px] font-medium text-[#737373] uppercase tracking-[0.1em]">
                AI {selectedClient.isImpactClient ? 'Impact Engine' : 'Advisor'}
              </p>
            </div>

            {/* Tagline */}
            <p className={`text-[11px] mb-4 ${
              selectedClient.isImpactClient ? 'text-[#10B981]/70' : 'text-[#0369A1]/70'
            }`}>
              {selectedClient.isImpactClient
                ? 'RAG & Gen AI - powered'
                : 'ML-driven portfolio optimization'
              }
            </p>

            <ul className="space-y-1.5 mb-auto">
              {selectedClient.isImpactClient ? (
                <>
                  <li className="flex items-start gap-2 text-[12px] text-[#525252]">
                    <span className="text-[#10B981]">•</span>
                    Archetype-aligned manager discovery
                  </li>
                  <li className="flex items-start gap-2 text-[12px] text-[#525252]">
                    <span className="text-[#10B981]">•</span>
                    Impact portfolio construction
                  </li>
                  <li className="flex items-start gap-2 text-[12px] text-[#525252]">
                    <span className="text-[#10B981]">•</span>
                    Values & exclusions analysis
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2 text-[12px] text-[#525252]">
                    <span className="text-[#0369A1]">•</span>
                    Risk-adjusted portfolio construction
                  </li>
                  <li className="flex items-start gap-2 text-[12px] text-[#525252]">
                    <span className="text-[#0369A1]">•</span>
                    Manager selection & due diligence
                  </li>
                  <li className="flex items-start gap-2 text-[12px] text-[#525252]">
                    <span className="text-[#0369A1]">•</span>
                    Tax-loss harvesting strategies
                  </li>
                </>
              )}
            </ul>
            <button
              onClick={() => {
                const url = selectedClient.isImpactClient
                  ? `/impact-analytics/research?archetype=${topArchetype}&client=${selectedClient.id}`
                  : `/portfolio-advisor?profile=${riskProfile?.riskTolerance}&type=${riskProfile?.portfolioType}&client=${selectedClient.id}`;
                window.open(url, '_blank');
              }}
              className={`w-full py-2.5 rounded-lg text-[13px] font-medium transition-all flex items-center justify-center gap-2 shadow-sm mt-4 ${
                selectedClient.isImpactClient
                  ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:shadow-md hover:shadow-[#10B981]/25'
                  : 'bg-gradient-to-r from-[#0369A1] to-[#0284C7] text-white hover:shadow-md hover:shadow-[#0369A1]/25'
              }`}
            >
              {selectedClient.isImpactClient ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
              Launch
            </button>
          </div>
        </motion.div>

        {/* Content Section - Differs by client type */}
        {selectedClient.isImpactClient && topArchetypeDetails ? (
          <ImpactContentSection
            selectedClient={selectedClient}
            topArchetypeDetails={topArchetypeDetails}
            sortedArchetypes={sortedArchetypes}
          />
        ) : riskProfile && riskProfileDetails && portfolioModel ? (
          <NonImpactContentSection
            riskProfile={riskProfile}
            riskProfileDetails={riskProfileDetails}
            portfolioModel={portfolioModel}
          />
        ) : null}

        {/* Survey Responses - Always at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden"
        >
          <button
            onClick={() => setShowSurveyResponses(!showSurveyResponses)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
          >
            <div className="flex items-center gap-3">
              <h3
                className="text-[16px] text-[#0A2240]"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Survey Responses
              </h3>
              <span className="px-2 py-0.5 bg-[#F5F5F5] text-[#525252] text-[12px] rounded">
                {selectedClient.questions.length} questions
              </span>
            </div>
            <motion.div
              animate={{ rotate: showSurveyResponses ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-[#737373]" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showSurveyResponses && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="px-6 pb-6">
                  <SurveyTable questions={selectedClient.questions} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <p className="mt-6 text-[12px] text-[#A3A3A3] text-center">
          {selectedClient.isImpactClient
            ? 'Archetype scores calculated from Qualtrics survey responses using proprietary impact preference algorithm.'
            : 'Risk profile and portfolio recommendations based on Qualtrics survey responses and AlTi Investment Objectives (December 2025).'}
        </p>
      </div>
    </div>
  );
}

// Impact Client Content Section
function ImpactContentSection({
  selectedClient,
  topArchetypeDetails,
  sortedArchetypes,
}: {
  selectedClient: (typeof MOCK_CLIENTS)[0];
  topArchetypeDetails: (typeof ARCHETYPE_DETAILS)[ArchetypeId];
  sortedArchetypes: [ArchetypeId, ArchetypeScore][];
}) {
  return (
    <>
      {/* Archetype Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-xl p-6 border border-[#E5E5E5] mb-6"
      >
        <h3
          className="text-[16px] text-[#0A2240] mb-6"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Archetype Analysis
        </h3>

        <div className="grid grid-cols-2 gap-8">
          {/* Radar Chart */}
          <div>
            <ArchetypeRadar scores={selectedClient.archetypeScores!} />
          </div>

          {/* Ranking List */}
          <div className="space-y-3">
            {sortedArchetypes.map(([id, score], index) => {
              const details = ARCHETYPE_DETAILS[id];
              const isTop = index === 0;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  className={`p-4 rounded-lg border transition-all ${
                    isTop
                      ? 'border-l-4 bg-[#FAFAFA]'
                      : 'border-[#E5E5E5] hover:border-[#C3E6E3]'
                  }`}
                  style={{ borderLeftColor: isTop ? details.color : undefined }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
                        style={{ backgroundColor: details.color }}
                      >
                        {score.rank}
                      </span>
                      <span className={`text-[14px] font-medium ${isTop ? 'text-[#0A2240]' : 'text-[#525252]'}`}>
                        {details.name}
                      </span>
                    </div>
                    <span
                      className="text-[16px] font-semibold"
                      style={{ color: details.color }}
                    >
                      {score.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: details.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score.percentage}%` }}
                      transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Why This Archetype */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-xl p-6 border border-[#E5E5E5] mb-6"
      >
        <h3
          className="text-[16px] text-[#0A2240] mb-5"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Why {topArchetypeDetails.name}?
        </h3>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-[11px] font-medium text-[#0B6D7B] uppercase tracking-[0.1em] mb-3">
              Key Alignment Factors
            </p>
            <ul className="space-y-2">
              {topArchetypeDetails.whyMatch.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[14px] text-[#525252]">
                  <span className="text-[#0B6D7B] font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#0A2240] uppercase tracking-[0.1em] mb-3">
              Areas of Focus
            </p>
            <ul className="space-y-2">
              {topArchetypeDetails.areasOfAlignment.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[14px] text-[#525252]">
                  <span className="text-[#0A2240]">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Non-Impact Client Content Section
function NonImpactContentSection({
  riskProfile,
  riskProfileDetails,
  portfolioModel,
}: {
  riskProfile: NonNullable<(typeof MOCK_CLIENTS)[0]['riskProfile']>;
  riskProfileDetails: (typeof RISK_PROFILES)[RiskProfileId];
  portfolioModel: NonNullable<ReturnType<typeof getPortfolioModel>>;
}) {
  return (
    <>
      {/* Investment Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-xl p-6 border border-[#E5E5E5] mb-6"
      >
        <h3
          className="text-[16px] text-[#0A2240] mb-6"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Investment Profile
        </h3>

        <div className="grid grid-cols-2 gap-8">
          {/* Client Preferences */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#F0F9FF] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#0369A1]" />
                <span className="text-[12px] font-medium text-[#0369A1]">Time Horizon</span>
              </div>
              <p className="text-[14px] text-[#0A2240]">{riskProfile.timeHorizon}</p>
            </div>
            <div className="p-4 bg-[#F0F9FF] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-4 h-4 text-[#0369A1]" />
                <span className="text-[12px] font-medium text-[#0369A1]">Liquidity Needs</span>
              </div>
              <p className="text-[14px] text-[#0A2240]">{riskProfile.liquidityNeeds}</p>
            </div>
            <div className="p-4 bg-[#F0F9FF] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-[#0369A1]" />
                <span className="text-[12px] font-medium text-[#0369A1]">Portfolio Type</span>
              </div>
              <p className="text-[14px] text-[#0A2240]">
                {riskProfile.portfolioType === 'traditional' ? 'Traditional' : 'Endowment'}
              </p>
            </div>
            <div className="p-4 bg-[#F0F9FF] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#0369A1]" />
                <span className="text-[12px] font-medium text-[#0369A1]">Tax Status</span>
              </div>
              <p className="text-[14px] text-[#0A2240]">
                {riskProfile.taxStatus === 'taxable' ? 'Taxable' : 'Tax-Exempt'}
              </p>
            </div>
          </div>

          {/* Allocation Summary */}
          <div className="p-4 border border-[#E5E5E5] rounded-lg">
            <p className="text-[12px] font-medium text-[#0A2240] uppercase tracking-[0.1em] mb-4">
              Target Allocation
            </p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[13px] text-[#525252]">Stability</span>
                  <span className="text-[13px] font-medium text-[#0B6D7B]">
                    {(portfolioModel.totalStability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#0B6D7B]"
                    initial={{ width: 0 }}
                    animate={{ width: `${portfolioModel.totalStability * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[13px] text-[#525252]">Diversified</span>
                  <span className="text-[13px] font-medium text-[#F59E0B]">
                    {(portfolioModel.totalDiversified * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#F59E0B]"
                    initial={{ width: 0 }}
                    animate={{ width: `${portfolioModel.totalDiversified * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[13px] text-[#525252]">Growth</span>
                  <span className="text-[13px] font-medium text-[#0369A1]">
                    {(portfolioModel.totalGrowth * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#0369A1]"
                    initial={{ width: 0 }}
                    animate={{ width: `${portfolioModel.totalGrowth * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Portfolio Model Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-xl p-6 border border-[#E5E5E5] mb-6"
      >
        <h3
          className="text-[16px] text-[#0A2240] mb-5"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Recommended Portfolio Model
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E5E5]">
                <th className="text-left py-3 px-4 text-[#737373] font-medium">Category</th>
                <th className="text-left py-3 px-4 text-[#737373] font-medium">Subcategory</th>
                <th className="text-left py-3 px-4 text-[#737373] font-medium">Fund</th>
                <th className="text-left py-3 px-4 text-[#737373] font-medium">Ticker</th>
                <th className="text-right py-3 px-4 text-[#737373] font-medium">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {portfolioModel.allocations.map((alloc, idx) => (
                <tr
                  key={idx}
                  className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors"
                >
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-[11px] font-medium ${
                        alloc.category === 'Stability'
                          ? 'bg-[#E0F2FE] text-[#0B6D7B]'
                          : alloc.category === 'Diversified'
                          ? 'bg-[#FEF3C7] text-[#D97706]'
                          : 'bg-[#DBEAFE] text-[#0369A1]'
                      }`}
                    >
                      {alloc.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#525252]">{alloc.subcategory}</td>
                  <td className="py-3 px-4 text-[#0A2240]">{alloc.fund}</td>
                  <td className="py-3 px-4 text-[#737373] font-mono">{alloc.ticker || '—'}</td>
                  <td className="py-3 px-4 text-right font-medium text-[#0A2240]">
                    {(alloc.allocation * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}
