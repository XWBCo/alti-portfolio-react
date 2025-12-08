"use client";

import { Search, Loader2 } from "lucide-react";
import { useState, KeyboardEvent } from "react";

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function SearchInput({
  onSearch,
  isLoading,
  placeholder = "Ask about portfolios, CMA assumptions, fund holdings...",
}: SearchInputProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = () => {
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl pl-12 pr-4 py-4
                     text-white placeholder-gray-500
                     focus:border-[#00f0db] focus:outline-none focus:ring-1 focus:ring-[#00f0db]/30
                     disabled:opacity-50 transition-all"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={isLoading || !query.trim()}
        className="bg-[#00f0db] text-black px-8 py-4 rounded-xl font-medium
                   hover:bg-[#00d4c1] disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors flex items-center gap-2 min-w-[140px] justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Searching
          </>
        ) : (
          "Search"
        )}
      </button>
    </div>
  );
}
