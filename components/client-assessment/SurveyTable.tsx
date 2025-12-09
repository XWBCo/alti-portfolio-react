'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { SurveyQuestion } from '@/lib/client-assessment-types';
import { QUESTION_CATEGORIES } from '@/lib/client-assessment-types';

interface SurveyTableProps {
  questions: SurveyQuestion[];
  defaultExpanded?: boolean;
}

function formatResponse(question: SurveyQuestion): string {
  if (question.responseType === 'text') {
    return question.response as string;
  }

  if (question.responseType === 'multiselect') {
    return (question.response as string[]).join(', ');
  }

  if (question.responseType === 'ranking') {
    const rankings = question.response as { option: string; rank: number }[];
    return rankings
      .sort((a, b) => a.rank - b.rank)
      .map((r) => `${r.rank}. ${r.option}`)
      .join('\n');
  }

  return String(question.response);
}

export default function SurveyTable({ questions, defaultExpanded = false }: SurveyTableProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredQuestions =
    selectedCategory === 'All'
      ? questions
      : questions.filter((q) => q.category === selectedCategory);

  const categories = ['All', ...QUESTION_CATEGORIES];

  return (
    <div className="bg-white border border-[#e6e6e6] rounded overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-[#fafafa] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-medium text-[#010203]">
            Survey Responses
          </span>
          <span className="text-[12px] text-[#757575] bg-[#f0f0f0] px-2 py-0.5 rounded-full">
            {questions.length} questions
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#757575]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#757575]" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <>
          {/* Category Filter Pills */}
          <div className="p-4 border-t border-[#e6e6e6] flex items-center gap-2 bg-[#fafafa]">
            <span className="text-[12px] text-[#757575] mr-2">Filter:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[12px] transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#074269] text-white'
                    : 'bg-white text-[#4A4A4A] hover:bg-[#e6e6e6] border border-[#e6e6e6]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-auto" style={{ maxHeight: '400px' }}>
            <table className="w-full text-[14px]">
              <thead className="sticky top-0 bg-[#f8f9fa]">
                <tr className="border-b border-[#e6e6e6]">
                  <th className="p-3 text-left text-[12px] font-semibold text-[#757575] uppercase tracking-wide w-[60px]">
                    Q#
                  </th>
                  <th className="p-3 text-left text-[12px] font-semibold text-[#757575] uppercase tracking-wide w-[120px]">
                    Category
                  </th>
                  <th className="p-3 text-left text-[12px] font-semibold text-[#757575] uppercase tracking-wide">
                    Question
                  </th>
                  <th className="p-3 text-left text-[12px] font-semibold text-[#757575] uppercase tracking-wide">
                    Response
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q, idx) => (
                  <tr
                    key={`${q.qNumber}-${idx}`}
                    className="border-b border-[#e6e6e6] hover:bg-[#fafafa]"
                  >
                    <td className="p-3 text-[#4A4A4A]">Q{q.qNumber}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#f0f0f0] text-[#4A4A4A] text-[11px] rounded">
                        {q.category}
                      </span>
                    </td>
                    <td className="p-3 text-[#010203]">{q.question}</td>
                    <td className="p-3 text-[#010203] whitespace-pre-line">
                      {formatResponse(q)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[#e6e6e6] text-[11px] text-[#757575] bg-[#fafafa]">
            Showing {filteredQuestions.length} of {questions.length} responses
          </div>
        </>
      )}
    </div>
  );
}
