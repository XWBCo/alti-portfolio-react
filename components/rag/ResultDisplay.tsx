"use client";

import { motion } from "motion/react";
import { MessageSquare, FileStack } from "lucide-react";
import type { QueryResult } from "@/lib/rag-types";
import { SourceCard } from "./SourceCard";

interface ResultDisplayProps {
  result: QueryResult;
}

export function ResultDisplay({ result }: ResultDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Answer Section */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-[#00f0db]" />
          <h2 className="text-lg font-medium text-white">Answer</h2>
        </div>
        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {result.answer}
        </div>
      </div>

      {/* Sources Section */}
      {result.sources.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileStack className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Sources ({result.sources.length})
            </h3>
          </div>
          <div className="space-y-2">
            {result.sources.map((source, index) => (
              <SourceCard key={index} source={source} index={index} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
