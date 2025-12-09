'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  User,
  Building2,
  MapPin,
  Wallet,
  Calendar
} from 'lucide-react';
import ArchetypeRadar from '@/components/client-assessment-v2/ArchetypeRadar';
import SurveyTable from '@/components/client-assessment-v2/SurveyTable';
import { MOCK_CLIENTS, getTopArchetype } from '@/lib/client-assessment-mock-data';
import { ARCHETYPE_DETAILS } from '@/lib/client-assessment-types';
import type { ArchetypeId, ArchetypeScore } from '@/lib/client-assessment-types';

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

  const topArchetype = getTopArchetype(selectedClient.archetypeScores);
  const topArchetypeDetails = ARCHETYPE_DETAILS[topArchetype];
  const topScore = selectedClient.archetypeScores[topArchetype];

  const sortedArchetypes = useMemo(() => {
    return (
      Object.entries(selectedClient.archetypeScores) as [ArchetypeId, ArchetypeScore][]
    ).sort((a, b) => a[1].rank - b[1].rank);
  }, [selectedClient.archetypeScores]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header Bar */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1
              className="text-[24px] text-[#0A2240]"
              style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
            >
              Client Assessment
            </h1>
            <div className="h-6 w-px bg-[#E5E5E5]" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="px-4 py-2 border border-[#C3E6E3] rounded-lg bg-white text-[14px] text-[#0A2240] focus:outline-none focus:ring-2 focus:ring-[#00F0DB]/30 focus:border-[#00F0DB] transition-all"
            >
              {MOCK_CLIENTS.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.clientInfo.client} — {client.clientInfo.family}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(`/impact-analytics/research?archetype=${topArchetype}&source=assessment`, '_blank')}
              className="px-4 py-2 border border-[#10B981] rounded-lg text-[14px] text-[#10B981] hover:bg-[#ECFDF5] transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Research in Prism
            </button>
            <button
              className={`px-5 py-2 rounded-lg text-[14px] font-medium transition-all flex items-center gap-2 ${
                isExporting
                  ? 'bg-[#E5E5E5] text-[#737373] cursor-wait'
                  : 'bg-[#00F0DB] text-[#0A2240] hover:bg-[#00D6C3]'
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

        {/* Hero Section - Archetype Verdict */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div
            className="bg-white rounded-xl p-8 border-l-4"
            style={{ borderLeftColor: topArchetypeDetails.color }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-[11px] font-medium text-[#737373] uppercase tracking-[0.1em] mb-2">
                  Recommended Impact Archetype
                </p>
                <h2
                  className="text-[36px] mb-3"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontWeight: 400,
                    color: topArchetypeDetails.color
                  }}
                >
                  {topArchetypeDetails.name}
                </h2>
                <p className="text-[16px] text-[#525252] max-w-2xl leading-relaxed">
                  {topArchetypeDetails.description}
                </p>

                {/* Match Confidence */}
                <div className="mt-6 flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-[#737373]">Match Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
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
                  </div>
                </div>
              </div>

              {/* Client Quick Info */}
              <div className="ml-8 p-5 bg-[#FAFAFA] rounded-lg min-w-[260px]">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[14px]">
                    <User className="w-4 h-4 text-[#0B6D7B]" />
                    <span className="text-[#525252]">{selectedClient.clientInfo.client}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[14px]">
                    <Building2 className="w-4 h-4 text-[#0B6D7B]" />
                    <span className="text-[#525252]">{selectedClient.clientInfo.family}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[14px]">
                    <Wallet className="w-4 h-4 text-[#0B6D7B]" />
                    <span className="text-[#525252]">{selectedClient.clientInfo.portfolioValue}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[14px]">
                    <MapPin className="w-4 h-4 text-[#0B6D7B]" />
                    <span className="text-[#525252]">{selectedClient.clientInfo.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[14px]">
                    <Calendar className="w-4 h-4 text-[#0B6D7B]" />
                    <span className="text-[#525252]">Survey: {selectedClient.submittedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Two Column Layout - Radar + AI Panel */}
        <div className="grid grid-cols-5 gap-6 mb-8">

          {/* Radar Chart + Archetype Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="col-span-3 bg-white rounded-xl p-6 border border-[#E5E5E5]"
          >
            <h3
              className="text-[18px] text-[#0A2240] mb-6"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Archetype Analysis
            </h3>

            <div className="flex gap-8">
              {/* Radar */}
              <div className="flex-1">
                <ArchetypeRadar scores={selectedClient.archetypeScores} />
              </div>

              {/* Archetype Breakdown */}
              <div className="w-[280px] space-y-3">
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

          {/* Prism AI Panel - Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="col-span-2 bg-gradient-to-br from-[#ECFDF5] to-white rounded-xl p-6 border border-[#D1FAE5]"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#10B981]" />
              <h3
                className="text-[18px] text-[#0A2240]"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Prism AI Insights
              </h3>
            </div>

            <div className="space-y-4">
              <p className="text-[14px] text-[#525252] leading-relaxed">
                Based on {selectedClient.clientInfo.client}'s <strong>{topArchetypeDetails.name}</strong> profile,
                Prism AI can help identify:
              </p>

              <ul className="space-y-2">
                {topArchetypeDetails.areasOfAlignment.slice(0, 3).map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[13px] text-[#525252]">
                    <span className="text-[#10B981] mt-0.5">•</span>
                    {area}
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t border-[#D1FAE5]">
                <button
                  onClick={() => window.open(`/impact-analytics/research?archetype=${topArchetype}&client=${selectedClientId}`, '_blank')}
                  className="w-full py-3 bg-[#10B981] text-white rounded-lg text-[14px] font-medium hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Launch Prism Research
                </button>
                <p className="text-[11px] text-[#737373] text-center mt-2">
                  Get AI-powered portfolio recommendations
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Why This Archetype Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-8 bg-white rounded-xl p-6 border border-[#E5E5E5]"
        >
          <h3
            className="text-[18px] text-[#0A2240] mb-5"
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

        {/* Survey Responses - Collapsible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden"
        >
          <button
            onClick={() => setShowSurveyResponses(!showSurveyResponses)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
          >
            <div className="flex items-center gap-3">
              <h3
                className="text-[18px] text-[#0A2240]"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Survey Responses
              </h3>
              <span className="px-2 py-0.5 bg-[#E5F5F3] text-[#0B6D7B] text-[12px] rounded">
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

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-6 text-[12px] text-[#A3A3A3] text-center"
        >
          Archetype scores calculated from Qualtrics survey responses using proprietary impact preference algorithm.
        </motion.p>
      </div>
    </div>
  );
}
