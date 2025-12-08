"use client";

import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { Source } from "@/lib/rag-types";

interface SourceCardProps {
  source: Source;
  index: number;
}

const DOCUMENT_TYPE_COLORS: Record<string, string> = {
  portfolio_summary: "bg-blue-500/20 text-blue-400",
  portfolio_holdings: "bg-blue-500/20 text-blue-400",
  cma_assumptions: "bg-purple-500/20 text-purple-400",
  cma_correlation: "bg-purple-500/20 text-purple-400",
  cma_data: "bg-purple-500/20 text-purple-400",
  returns_summary: "bg-green-500/20 text-green-400",
  fund_holdings_summary: "bg-amber-500/20 text-amber-400",
  fund_holdings_detail: "bg-amber-500/20 text-amber-400",
  pdf_document: "bg-red-500/20 text-red-400",
  survey_response: "bg-cyan-500/20 text-cyan-400",
};

export function SourceCard({ source, index }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeColor =
    DOCUMENT_TYPE_COLORS[source.document_type] ||
    "bg-gray-500/20 text-gray-400";

  const relevancePercent = Math.round(source.relevance_score * 100);

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#222] transition-colors"
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00f0db]/20 text-[#00f0db] text-sm font-medium">
          {index + 1}
        </span>

        <FileText className="h-4 w-4 text-gray-500" />

        <div className="flex-1 text-left">
          <span className="text-white text-sm">{source.file_name}</span>
          {source.page_number && (
            <span className="text-gray-500 text-sm ml-2">
              p.{source.page_number}
            </span>
          )}
        </div>

        <span className={`px-2 py-0.5 rounded text-xs ${typeColor}`}>
          {source.document_type.replace(/_/g, " ")}
        </span>

        <span className="text-gray-500 text-sm w-12 text-right">
          {relevancePercent}%
        </span>

        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[#2a2a2a]">
          <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
            {source.chunk_text}
          </p>
        </div>
      )}
    </div>
  );
}
