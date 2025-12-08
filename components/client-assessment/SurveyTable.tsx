'use client';

import { useState } from 'react';
import type { SurveyQuestion, QuestionCategory } from '@/lib/client-assessment-types';
import { QUESTION_CATEGORIES } from '@/lib/client-assessment-types';

interface SurveyTableProps {
  questions: SurveyQuestion[];
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

export default function SurveyTable({ questions }: SurveyTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredQuestions =
    selectedCategory === 'All'
      ? questions
      : questions.filter((q) => q.category === selectedCategory);

  const categories = ['All', ...QUESTION_CATEGORIES];

  return (
    <div className="bg-white border border-[#e6e6e6] rounded">
      {/* Category Filter Pills */}
      <div className="p-4 border-b border-[#e6e6e6] flex items-center gap-2">
        <span className="text-[12px] text-[#757575] mr-2">Filter:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-[12px] transition-colors ${
              selectedCategory === cat
                ? 'bg-[#074269] text-white'
                : 'bg-[#f0f0f0] text-[#4A4A4A] hover:bg-[#e6e6e6]'
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
      <div className="p-3 border-t border-[#e6e6e6] text-[11px] text-[#757575]">
        Showing {filteredQuestions.length} of {questions.length} responses
      </div>
    </div>
  );
}
