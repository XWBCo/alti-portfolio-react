# Agent Handoff: Prism RAG System Enhancement

**Date**: December 8, 2025
**Project**: AlTi Impact Analytics - Prism AI Chatbot
**Status**: Sprint 2 Complete, Sprint 3-4 Pending

---

## Executive Summary

We're upgrading AlTi's "Prism" RAG chatbot from a basic LlamaIndex implementation to a cutting-edge 2025 agentic RAG system using LangGraph. The goal is to help financial advisors explore Impact/ESG investment offerings through guided conversational flows.

### What Was Accomplished
- **Sprint 1**: LangGraph backend architecture + React guided flow components
- **Sprint 2**: API routes, Cohere reranker integration, streaming endpoint

### What Remains
- **Sprint 3**: Wire up flows, test hybrid retrieval, UX polish
- **Sprint 4**: PostgreSQL memory, production deployment

---

## Project Context

### The Business
- **Company**: AlTi (Alternative Investment firm)
- **Product**: Impact investing platform for wealth advisors
- **Users**: Financial advisors helping clients invest in ESG-aligned portfolios

### The Three Use Cases

1. **Qualtrics → Archetype Flow**
   - Advisor completes external survey in Qualtrics app
   - Survey determines which "archetype" (investment model) matches client
   - Advisor lands in Prism with archetype pre-selected
   - Can explore holdings, performance, ESG outcomes of that archetype

2. **Pipeline Exploration**
   - Advisors explore 2025 upcoming investment opportunities
   - Filter by region (US/International) and archetype(s)
   - Multi-select archetypes supported
   - Data source: `/Users/xavi_court/Downloads/Impact Pipeline 2025.xlsx`

3. **Clarity AI Education**
   - Learn about 20 ESG metrics (carbon intensity, financed emissions, etc.)
   - Understand calculations with real-world examples
   - Learn about Clarity AI as a data provider

### Key Data Structures

**Archetypes** (Investment Models):
- Integrated Best Ideas (IBI) - ESG-integrated returns focus
- Impact 100% - Comprehensive measurable impact
- Climate Sustainability - Environmental focus
- Inclusive Innovation - Social equity focus

**Asset Classes**:
- Stability (Fixed Income)
- Diversified
- Growth-Public (Equities)
- Growth-Private (PE/PC)
- Catalytic Debt (no sub-classes)
- Catalytic Equity (no sub-classes)

**Risk Levels**: CON, BAL, MG, GRO, LTG

**Region Tabs**:
- `All Models` (US)
- `All Models (INT)` (International)

---

## Technical Architecture

### Current Stack (Before Enhancement)
```
Frontend: Next.js 14 (alti-portfolio-react)
Backend:  FastAPI + LlamaIndex + ChromaDB (alti-rag-service)
LLM:      GPT-4o-mini via OpenAI
Embeddings: text-embedding-3-small
```

### Target Stack (After Enhancement)
```
Frontend: Next.js 14 + Guided Flow Components
Backend:  FastAPI + LangGraph + ChromaDB
Features: Hybrid retrieval, CRAG, Self-RAG, Cohere reranking
Memory:   PostgreSQL (LangGraph checkpointer)
```

### Repository Locations
```
/Users/xavi_court/claude_code/alti-portfolio-react/  (Frontend)
/Users/xavi_court/claude_code/alti-rag-service/      (Backend)
```

---

## What Was Built (Sprints 1-2)

### Backend: LangGraph Workflow

**Location**: `/Users/xavi_court/claude_code/alti-rag-service/graph/`

```
graph/
├── __init__.py
├── state.py          # PrismState TypedDict (messages, archetype, region, intent, etc.)
├── workflow.py       # LangGraph StateGraph definition
├── nodes/
│   ├── __init__.py
│   ├── route.py      # Intent classification (archetype/pipeline/clarity/general)
│   ├── retrieve.py   # Hybrid BM25 + semantic retrieval
│   ├── grade.py      # CRAG document grading + Cohere reranking
│   └── generate.py   # Intent-specific response generation
└── prompts/
    └── __init__.py
```

**Workflow Flow**:
```
route_intent → retrieve → grade → rerank → generate → END
                                    ↓
                              (Cohere or BGE fallback)
```

### Backend: API Routes

**Location**: `/Users/xavi_court/claude_code/alti-rag-service/api/routes.py`

New V2 endpoints (lines 330-531):
- `POST /api/v1/v2/query` - Agentic RAG query
- `POST /api/v1/v2/query/stream` - SSE streaming
- `GET /api/v1/v2/health` - LangGraph health check

V1 endpoints preserved for backward compatibility.

### Frontend: Guided Flow Components

**Location**: `/Users/xavi_court/claude_code/alti-portfolio-react/components/impact-analytics/chat/flows/`

```
flows/
├── index.ts
├── IntentRouter.tsx      # 3-category selector (Archetype/Pipeline/Clarity)
├── MultiSelectChips.tsx  # Reusable chip selection component
├── ArchetypeFlow.tsx     # Progressive archetype exploration
├── PipelineFlow.tsx      # Multi-select wizard for pipeline
└── ClarityFlow.tsx       # ESG metrics explorer
```

### Frontend: Updated Research Page

**Location**: `/Users/xavi_court/claude_code/alti-portfolio-react/app/impact-analytics/research/page.tsx`

Features:
- URL param support (`?archetype=X&region=US&source=qualtrics`)
- Flow state machine (welcome → intent → specific flow → chat)
- Region selector at entry
- Qualtrics context integration

### Dependencies Added

**Backend** (`requirements.txt`):
```
langgraph>=0.2.0
langchain>=0.3.0
langchain-openai>=0.2.0
langchain-chroma>=0.1.0
langchain-community>=0.3.0
langchain-cohere>=0.3.0
rank-bm25>=0.2.0
```

---

## Current Status

### V2 Endpoint Status
```bash
curl http://localhost:8000/api/v1/v2/health
# Returns: {"status": "fallback", "message": "LangGraph not available..."}
```

**Reason**: Dependencies not yet installed in venv.

### V1 Endpoint Status
```bash
curl http://localhost:8000/api/v1/health
# Returns: {"status": "healthy", "collection_count": 167, ...}
```

**Working with**: 167 documents indexed (fund profiles, allocations, etc.)

---

## What Needs to Be Done

### Immediate: Activate LangGraph

```bash
cd /Users/xavi_court/claude_code/alti-rag-service
source venv/bin/activate
pip install langgraph langchain langchain-openai langchain-chroma langchain-community langchain-cohere rank-bm25
```

Then restart server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Sprint 3: UX Flows & Testing

1. **Test the guided flows**
   - Navigate to `http://localhost:3000/impact-analytics/research`
   - Test each flow (Archetype, Pipeline, Clarity)
   - Verify Qualtrics context: `?archetype=integrated_best_ideas&region=US&source=qualtrics`

2. **Ingest Pipeline Data**
   - Create loader for `/Users/xavi_court/Downloads/Impact Pipeline 2025.xlsx`
   - Add to `/Users/xavi_court/claude_code/alti-rag-service/ingestion/loaders.py`
   - Columns: Region (C), Archetype numbers (E), Asset Class, Min Contribution, etc.

3. **Test Hybrid Retrieval**
   - Verify BM25 catches exact terms ("IBI", "CON")
   - Verify semantic catches meaning ("climate investments")
   - Compare V1 vs V2 answer quality

4. **Add Cohere API Key**
   - Get key from Cohere dashboard
   - Add to `.env`: `COHERE_API_KEY=xxx`

### Sprint 4: Production Readiness

1. **PostgreSQL Memory**
   ```python
   from langgraph.checkpoint.postgres import PostgresSaver
   checkpointer = PostgresSaver.from_conn_string(DATABASE_URL)
   ```

2. **Streaming in Frontend**
   - Create `/app/impact-analytics/api/research/stream/route.ts`
   - Implement SSE consumption in React

3. **Self-RAG Activation**
   - Uncomment hallucination checking in `workflow.py`
   - Add conditional edge from `generate` to `check_hallucination`

---

## Key Files Reference

### Backend Critical Files
| File | Purpose |
|------|---------|
| `alti-rag-service/graph/state.py` | State schema, archetype aliases, asset classes |
| `alti-rag-service/graph/workflow.py` | LangGraph StateGraph, invoke functions |
| `alti-rag-service/graph/nodes/retrieve.py` | Hybrid BM25+semantic retrieval |
| `alti-rag-service/graph/nodes/grade.py` | CRAG grading + Cohere reranking |
| `alti-rag-service/api/routes.py` | FastAPI endpoints (V1 + V2) |
| `alti-rag-service/config.py` | Settings (chroma path, models, etc.) |

### Frontend Critical Files
| File | Purpose |
|------|---------|
| `app/impact-analytics/research/page.tsx` | Main Prism UI with flow routing |
| `components/impact-analytics/chat/flows/` | All guided flow components |
| `lib/client-assessment-types.ts` | Archetype type definitions |
| `app/impact-analytics/api/research/route.ts` | API proxy to backend |

### Documentation
| File | Purpose |
|------|---------|
| `/Users/xavi_court/.claude/plans/eager-moseying-starlight.md` | Full implementation plan |
| `alti-rag-service/AGENT_PROMPT_RAG_OVERHAUL.md` | Previous RAG overhaul notes |

---

## Technical Decisions Made

1. **LangGraph over LlamaIndex Workflows**: Better state machine support, memory, streaming
2. **Hybrid Retrieval**: BM25 (40%) + Semantic (60%) via EnsembleRetriever
3. **Cohere Reranker**: `rerank-english-v3.0` with BGE fallback for no-API scenarios
4. **CRAG over basic RAG**: Document grading reduces hallucinations by ~52%
5. **Multi-select for Pipeline**: Advisors can filter by multiple archetypes
6. **Region-first UX**: User selects US/INT before exploring content

---

## Environment Variables Needed

```bash
# Backend (.env in alti-rag-service/)
OPENAI_API_KEY=xxx
COHERE_API_KEY=xxx  # Optional, for reranking
DATABASE_URL=xxx    # Optional, for PostgreSQL memory

# Frontend (.env.local in alti-portfolio-react/)
RAG_SERVICE_URL=http://localhost:8000
USE_LANGGRAPH=true  # Set to false to force V1 endpoint
```

---

## Testing Commands

```bash
# Check V1 health
curl http://localhost:8000/api/v1/health

# Check V2 health
curl http://localhost:8000/api/v1/v2/health

# Test V2 query
curl -X POST http://localhost:8000/api/v1/v2/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What funds are in IBI?", "region": "US"}'

# Test legacy V1 query
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What funds are in IBI?", "mode": "compact"}'
```

---

## Sources & Research

The implementation is based on 2025 RAG best practices:
- [Eden AI RAG Guide 2025](https://www.edenai.co/post/the-2025-guide-to-retrieval-augmented-generation-rag)
- [LangGraph CRAG Tutorial](https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_crag/)
- [LangGraph Self-RAG Tutorial](https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_self_rag/)
- [Superlinked: Hybrid Search & Reranking](https://superlinked.com/vectorhub/articles/optimizing-rag-with-hybrid-search-reranking)
- [Chatbot UX Design 2025](https://www.parallelhq.com/blog/chatbot-ux-design)

---

## Contact & Context

- **User**: Xavi (xavi_court)
- **Employer**: AlTi
- **Project Hub**: [Notion](https://www.notion.so/2a6a6e6e5eed8108bc5ff3b978930a7a)
- **Global CLAUDE.md**: `/Users/xavi_court/CLAUDE.md`

---

## Quick Start for Next Agent

1. Read this document
2. Read the plan: `/Users/xavi_court/.claude/plans/eager-moseying-starlight.md`
3. Install dependencies (see "Activate LangGraph" section)
4. Test V2 endpoint health
5. Continue with Sprint 3 tasks

**Priority**: Get LangGraph activated and test the guided flows end-to-end.
