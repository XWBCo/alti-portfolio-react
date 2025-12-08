'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { FileText, Loader2 } from 'lucide-react';
import ClientProfileCard from '@/components/client-assessment/ClientProfileCard';
import ArchetypeRadar from '@/components/client-assessment/ArchetypeRadar';
import ArchetypeCard from '@/components/client-assessment/ArchetypeCard';
import SurveyTable from '@/components/client-assessment/SurveyTable';
import { MOCK_CLIENTS, getTopArchetype } from '@/lib/client-assessment-mock-data';
import { ARCHETYPE_DETAILS } from '@/lib/client-assessment-types';
import type { ArchetypeId, ArchetypeScore } from '@/lib/client-assessment-types';

export default function ClientAssessmentPage() {
  const [selectedClientId, setSelectedClientId] = useState(MOCK_CLIENTS[0].id);
  const [isExporting, setIsExporting] = useState(false);

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

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `IPS_${selectedClientId}.docx`;

      // Download the file
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

  // Sort archetypes by rank for display
  const sortedArchetypes = useMemo(() => {
    return (
      Object.entries(selectedClient.archetypeScores) as [ArchetypeId, ArchetypeScore][]
    ).sort((a, b) => a[1].rank - b[1].rank);
  }, [selectedClient.archetypeScores]);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="flex h-[calc(100vh-122px)]">
        {/* Left Sidebar - Client Selector */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-[320px] bg-[#f8f9fa] p-6 h-full overflow-auto border-r border-[#e6e6e6]"
        >
          <h2 className="text-[22px] font-normal text-[#4A4A4A] mb-6 mt-4">
            Client Surveys:
          </h2>

          {/* Client Selector */}
          <div className="mb-8">
            <label className="block text-[14px] text-[#4A4A4A] mb-2">
              Select Client:
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full p-2 border border-[#ccc] rounded bg-white text-[14px] text-[#4A4A4A]"
            >
              {MOCK_CLIENTS.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.clientInfo.client} ({client.clientInfo.family})
                </option>
              ))}
            </select>
          </div>

          {/* Survey Info */}
          <div className="p-4 bg-white rounded border border-[#e6e6e6] mb-6">
            <h3 className="text-[14px] font-semibold text-[#074269] mb-2">
              Survey Details
            </h3>
            <div className="space-y-2 text-[12px] text-[#4A4A4A]">
              <p>
                <span className="text-[#757575]">Submitted:</span>{' '}
                {selectedClient.submittedDate}
              </p>
              <p>
                <span className="text-[#757575]">Questions:</span>{' '}
                {selectedClient.questions.length}
              </p>
              <p>
                <span className="text-[#757575]">Top Match:</span>{' '}
                <span className="font-medium" style={{ color: ARCHETYPE_DETAILS[topArchetype].color }}>
                  {ARCHETYPE_DETAILS[topArchetype].name}
                </span>
              </p>
            </div>
          </div>

          {/* Export IPS Button */}
          <button
            className={`w-full p-3 border rounded text-[14px] transition-colors flex items-center justify-center gap-2 ${
              isExporting
                ? 'bg-[#e1e1e1] text-[#757575] border-[#ccc] cursor-wait'
                : 'bg-[#00F0DB] text-[#010203] border-[#00D4C1] hover:bg-[#00D4C1]'
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
                Export IPS Document
              </>
            )}
          </button>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Page Title */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[28px] text-[#010203] mb-6"
            style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}
          >
            Client Impact Archetype Profile
          </motion.h1>

          {/* Client Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6"
          >
            <ClientProfileCard client={selectedClient.clientInfo} />
          </motion.div>

          {/* Radar Chart and Top 2 Archetype Cards */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ArchetypeRadar scores={selectedClient.archetypeScores} />
            </motion.div>

            {/* Top 2 Archetype Cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="col-span-2 space-y-4"
            >
              {sortedArchetypes.slice(0, 2).map(([id, score]) => (
                <ArchetypeCard
                  key={id}
                  archetype={ARCHETYPE_DETAILS[id]}
                  score={score}
                  isTopMatch={score.rank === 1}
                />
              ))}
            </motion.div>
          </div>

          {/* Bottom 2 Archetype Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="grid grid-cols-2 gap-6 mb-6"
          >
            {sortedArchetypes.slice(2, 4).map(([id, score]) => (
              <ArchetypeCard
                key={id}
                archetype={ARCHETYPE_DETAILS[id]}
                score={score}
                isTopMatch={false}
              />
            ))}
          </motion.div>

          {/* Survey Responses Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <h2
              className="text-[20px] text-[#010203] mb-4"
              style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}
            >
              Survey Responses
            </h2>
            <SurveyTable questions={selectedClient.questions} />
          </motion.div>

          {/* Info Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="mt-6 p-4 bg-[#074269]/5 rounded-lg"
          >
            <p className="text-[12px] text-[#074269]">
              <strong>About this tool:</strong> The Client Assessment analyzes Qualtrics survey
              responses to determine impact investment archetype matches. Scores are calculated
              using a proprietary algorithm that weights responses across climate, social, and
              portfolio preference dimensions. The recommended archetype guides portfolio
              construction aligned with client values.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
