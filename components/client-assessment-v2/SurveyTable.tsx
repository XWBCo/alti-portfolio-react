'use client';

import { useState } from 'react';
import type { SurveyQuestion } from '@/lib/client-assessment-types';
import { QUESTION_CATEGORIES } from '@/lib/client-assessment-types';

interface SurveyTableProps {
  questions: SurveyQuestion[];
}

function formatResponse(question: SurveyQuestion): React.ReactNode {
  if (question.responseType === 'text') {
    return <span>{question.response as string}</span>;
  }

  if (question.responseType === 'multiselect') {
    const items = question.response as string[];
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 bg-[#E5F5F3] text-[#0B6D7B] text-[12px] rounded"
          >
            {item}
          </span>
        ))}
      </div>
    );
  }

  if (question.responseType === 'ranking') {
    const rankings = question.response as { option: string; rank: number }[];
    return (
      <ol className="space-y-1">
        {rankings
          .sort((a, b) => a.rank - b.rank)
          .map((r, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[13px]">
              <span className="w-5 h-5 rounded-full bg-[#0B6D7B] text-white text-[11px] flex items-center justify-center flex-shrink-0">
                {r.rank}
              </span>
              <span className="text-[#525252]">{r.option}</span>
            </li>
          ))}
      </ol>
    );
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

  // Group by category for better scanning
  const questionsByCategory = filteredQuestions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {} as Record<string, SurveyQuestion[]>);

  return (
    <div>
      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#E5E5E5]">
        <span className="text-[12px] text-[#737373] mr-2">Filter:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-[#0A2240] text-white'
                : 'bg-[#F5F5F5] text-[#525252] hover:bg-[#E5E5E5]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Responses Grid */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {selectedCategory === 'All' ? (
          // Grouped view - category shown as header, not on each row
          Object.entries(questionsByCategory).map(([category, qs]) => (
            <div key={category} className="space-y-3">
              <h4
                className="text-[13px] font-semibold text-[#0A2240] uppercase tracking-wide sticky top-0 bg-white py-2"
              >
                {category}
              </h4>
              {qs.map((q, idx) => (
                <QuestionRow key={`${q.qNumber}-${idx}`} question={q} />
              ))}
            </div>
          ))
        ) : (
          // Flat view for single category
          filteredQuestions.map((q, idx) => (
            <QuestionRow key={`${q.qNumber}-${idx}`} question={q} />
          ))
        )}
      </div>

    </div>
  );
}

function QuestionRow({ question }: { question: SurveyQuestion }) {
  return (
    <div className="p-4 rounded-lg border border-[#E5E5E5] hover:border-[#C3E6E3] transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <span className="text-[12px] font-mono text-[#737373]">Q{question.qNumber}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-[#0A2240] mb-3">{question.question}</p>
          <div className="text-[14px] text-[#525252]">
            {formatResponse(question)}
          </div>
        </div>
      </div>
    </div>
  );
}
