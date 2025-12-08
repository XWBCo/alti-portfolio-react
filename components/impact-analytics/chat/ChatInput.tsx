'use client';

import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  suggestions = [],
  onSuggestionClick,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="px-10 py-7 border-t border-emerald-200 bg-white">
      <div className="flex gap-3.5 bg-white border border-emerald-500 rounded-2xl p-1.5 transition-all focus-within:border-teal-500 focus-within:shadow-[0_0_0_3px_rgba(20,184,166,0.1)]">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about ESG metrics, climate data, or impact analysis..."
          className="flex-1 px-5 py-4 bg-transparent border-none text-base text-gray-900 outline-none placeholder:text-gray-400"
          disabled={isLoading}
        />
        <button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className="px-7 py-4 bg-emerald-500 rounded-xl text-white text-sm font-medium flex items-center gap-2 transition-colors hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{isLoading ? 'Sending...' : 'Send'}</span>
          <Send className="w-4 h-4" />
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="flex gap-2.5 mt-4">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick?.(suggestion)}
              className="px-4.5 py-2.5 bg-transparent border border-emerald-200 rounded-full text-sm text-emerald-700 transition-all hover:bg-emerald-500/10 hover:border-emerald-500"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
