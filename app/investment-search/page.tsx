"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Search,
  Database,
  AlertCircle,
  Sparkles,
  TrendingUp,
  PieChart,
  FileText,
} from "lucide-react";
import { SearchInput, ResultDisplay } from "@/components/rag";
import type { QueryResult, HealthResponse } from "@/lib/rag-types";

const EXAMPLE_QUERIES = [
  {
    icon: TrendingUp,
    query: "What are the expected returns for equities?",
    label: "CMA Returns",
  },
  {
    icon: PieChart,
    query: "Show me the top holdings in the portfolio",
    label: "Portfolio Holdings",
  },
  {
    icon: FileText,
    query: "What is the correlation between bonds and equities?",
    label: "Correlations",
  },
];

export default function InvestmentSearchPage() {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  // Check RAG service health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/rag/health");
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch {
        // Service not available - that's okay, user will see message
      }
    };
    checkHealth();
  }, []);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode: "compact",
          top_k: 5,
          min_similarity: 0.3,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Query failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (query: string) => {
    handleSearch(query);
  };

  return (
    <main className="min-h-screen bg-[#010203]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[#00f0db]/10 text-[#00f0db] px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Research</span>
          </div>

          <h1
            className="text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Investment Research
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Ask questions about portfolios, capital market assumptions, fund
            holdings, and more. Powered by RAG technology.
          </p>
        </motion.div>

        {/* Service Status */}
        {health ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-4 mb-8"
          >
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Database className="h-4 w-4" />
              <span>
                {health.collection_count.toLocaleString()} documents indexed
              </span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{health.document_types.length} document types</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mb-8 text-amber-500 text-sm"
          >
            <AlertCircle className="h-4 w-4" />
            <span>
              RAG service not connected. Start the Python backend on port 8000.
            </span>
          </motion.div>
        )}

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <SearchInput onSearch={handleSearch} isLoading={isLoading} />
        </motion.div>

        {/* Example Queries */}
        {!result && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <p className="text-gray-500 text-sm mb-4 text-center">
              Try an example:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {EXAMPLE_QUERIES.map(({ icon: Icon, query, label }) => (
                <button
                  key={label}
                  onClick={() => handleExampleClick(query)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg
                             bg-[#1a1a1a] border border-[#2a2a2a]
                             text-gray-400 text-sm
                             hover:border-[#00f0db]/50 hover:text-white
                             disabled:opacity-50 transition-all"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <h3 className="text-red-400 font-medium mb-1">Search Error</h3>
                <p className="text-red-300/80 text-sm">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Display */}
        {result && <ResultDisplay result={result} />}

        {/* Empty State */}
        {!result && !error && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16"
          >
            <Search className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">
              Enter a question to search your investment documents
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
