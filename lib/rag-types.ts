/**
 * Type definitions for RAG service integration.
 */

export interface Source {
  file_name: string;
  document_type: string;
  relevance_score: number;
  page_number?: number;
  chunk_text: string;
}

export interface QueryResult {
  answer: string;
  sources: Source[];
  query: string;
}

export interface QueryRequest {
  query: string;
  mode?: "compact" | "tree_summarize" | "refine" | "simple_summarize";
  top_k?: number;
  min_similarity?: number;
}

export interface SearchRequest {
  query: string;
  top_k?: number;
}

export interface HealthResponse {
  status: string;
  collection_count: number;
  document_types: string[];
}

export interface RAGStats {
  collection_name: string;
  document_count: number;
  document_types: string[];
  embedding_model: string;
  llm_model: string;
}

export type DocumentType =
  | "portfolio_summary"
  | "portfolio_holdings"
  | "cma_assumptions"
  | "cma_correlation"
  | "cma_data"
  | "returns_summary"
  | "fund_holdings_summary"
  | "fund_holdings_detail"
  | "pdf_document"
  | "survey_response";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  portfolio_summary: "Portfolio Summary",
  portfolio_holdings: "Portfolio Holdings",
  cma_assumptions: "CMA Assumptions",
  cma_correlation: "Correlation Matrix",
  cma_data: "CMA Data",
  returns_summary: "Returns Summary",
  fund_holdings_summary: "Fund Holdings",
  fund_holdings_detail: "Fund Details",
  pdf_document: "PDF Document",
  survey_response: "Survey Response",
};
