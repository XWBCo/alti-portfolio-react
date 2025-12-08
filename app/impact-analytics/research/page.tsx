'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, ChatInput, Message, Source } from '@/components/impact-analytics/chat';
import { IconPrism } from '@/components/icons/AltiIcons';
import {
  IntentRouter,
  ArchetypeFlow,
  PipelineFlow,
  ClarityFlow,
  SingleSelectChips,
  type Intent,
} from '@/components/impact-analytics/chat/flows';

type FlowState = 'welcome' | 'intent' | 'archetype' | 'pipeline' | 'clarity' | 'chat';

interface RAGResponse {
  answer: string;
  sources: Array<{ title?: string; source?: string; file?: string; file_name?: string }>;
  query: string;
}

interface PrismContext {
  archetype: string | null;
  region: 'US' | 'INT';
  source: 'qualtrics' | 'direct' | null;
}

const REGION_OPTIONS = [
  { id: 'US', label: 'US' },
  { id: 'INT', label: 'International' },
];

function ResearchPageContent() {
  const searchParams = useSearchParams();

  // Flow state
  const [flowState, setFlowState] = useState<FlowState>('welcome');
  const [context, setContext] = useState<PrismContext>({
    archetype: null,
    region: 'US',
    source: null,
  });

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Initialize from URL params (Qualtrics flow)
  useEffect(() => {
    const archetypeParam = searchParams.get('archetype');
    const regionParam = searchParams.get('region') as 'US' | 'INT' | null;
    const sourceParam = searchParams.get('source');

    if (archetypeParam) {
      setContext({
        archetype: archetypeParam,
        region: regionParam || 'US',
        source: sourceParam === 'qualtrics' ? 'qualtrics' : 'direct',
      });
      // Skip to archetype flow if coming from Qualtrics
      setFlowState('archetype');
    }
  }, [searchParams]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendQuery = async (query: string, additionalContext?: Record<string, unknown>): Promise<RAGResponse> => {
    const response = await fetch('/impact-analytics/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        mode: 'compact',
        top_k: 5,
        min_similarity: 0.3,
        // Pass context for better retrieval
        archetype: context.archetype,
        region: context.region,
        ...additionalContext,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from RAG service');
    }

    return response.json();
  };

  const handleFlowQuery = async (query: string, flowContext: Record<string, unknown>) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
    };
    setMessages((prev) => [...prev, userMessage]);
    setFlowState('chat');
    setIsLoading(true);

    try {
      const response = await sendQuery(query, flowContext);
      const sources: Source[] = response.sources?.map((s) => ({
        name: s.title || s.source || s.file || s.file_name || 'Document',
        url: undefined,
      })) || [];

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer || 'No results found. Try rephrasing your question.',
        sources: sources.length > 0 ? sources : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to the research database. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendQuery(userMessage.content);
      const sources: Source[] = response.sources?.map((s) => ({
        name: s.title || s.source || s.file || s.file_name || 'Document',
        url: undefined,
      })) || [];

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer || 'No results found. Try rephrasing your question.',
        sources: sources.length > 0 ? sources : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to the research database. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntentSelect = (intent: Intent) => {
    if (intent === 'archetype') {
      setFlowState('archetype');
    } else if (intent === 'pipeline') {
      setFlowState('pipeline');
    } else if (intent === 'clarity') {
      setFlowState('clarity');
    }
  };

  const handleRegionSelect = (region: string) => {
    setContext((prev) => ({ ...prev, region: region as 'US' | 'INT' }));
    setFlowState('intent');
  };

  const handleBackToIntent = () => {
    setFlowState('intent');
  };

  const handleBackToWelcome = () => {
    setFlowState('welcome');
    setContext({ archetype: null, region: 'US', source: null });
  };

  const hasMessages = messages.length > 0;

  // Render based on flow state
  const renderFlowContent = () => {
    switch (flowState) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center pt-[10vh] px-10"
          >
            {/* Animated Prism Icon */}
            <motion.div
              animate={{
                filter: [
                  'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))',
                  'drop-shadow(0 0 16px rgba(16, 185, 129, 0.5))',
                  'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-4"
            >
              <IconPrism className="w-20 h-20 text-emerald-500" />
            </motion.div>

            <h2 className="font-serif text-2xl text-gray-900 mb-2">Prism AI</h2>
            <p className="text-gray-500 mb-8 text-center">
              Your Impact investment research assistant
            </p>

            {/* Region selector */}
            <div className="mb-8">
              <p className="text-gray-600 text-center mb-3">Which region are you focused on?</p>
              <SingleSelectChips
                options={REGION_OPTIONS}
                selected={context.region}
                onChange={handleRegionSelect}
              />
            </div>
          </motion.div>
        );

      case 'intent':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col items-center pt-[8vh] px-10"
          >
            <IconPrism className="w-12 h-12 text-emerald-500 mb-4" />
            <IntentRouter onSelectIntent={handleIntentSelect} />

            <button
              onClick={handleBackToWelcome}
              className="mt-8 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Change region
            </button>
          </motion.div>
        );

      case 'archetype':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 px-10 py-8"
          >
            {context.source === 'qualtrics' && context.archetype && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-sm text-emerald-700">
                  Based on your survey results, <strong>{context.archetype}</strong> resonates most
                  with your client. Let&apos;s explore it.
                </p>
              </div>
            )}
            <ArchetypeFlow
              archetype={context.archetype || 'integrated_best_ideas'}
              region={context.region}
              onQuery={handleFlowQuery}
              onBack={handleBackToIntent}
            />
          </motion.div>
        );

      case 'pipeline':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 px-10 py-8"
          >
            <PipelineFlow onQuery={handleFlowQuery} onBack={handleBackToIntent} />
          </motion.div>
        );

      case 'clarity':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 px-10 py-8"
          >
            <ClarityFlow onQuery={handleFlowQuery} onBack={handleBackToIntent} />
          </motion.div>
        );

      case 'chat':
        return (
          <>
            <div ref={chatAreaRef} className="flex-1 overflow-y-auto px-10 py-8">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isLoading && (
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <span>Researching...</span>
                </div>
              )}
            </div>

            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col">
      <main className="flex-1 flex flex-col max-w-[960px] w-full mx-auto bg-white border-x border-emerald-200">
        {hasMessages && flowState !== 'chat' ? (
          // Show chat if there are messages
          <>
            <div ref={chatAreaRef} className="flex-1 overflow-y-auto px-10 py-8">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isLoading && (
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <span>Researching...</span>
                </div>
              )}
            </div>

            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </>
        ) : (
          <AnimatePresence mode="wait">{renderFlowContent()}</AnimatePresence>
        )}
      </main>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
            <span
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      }
    >
      <ResearchPageContent />
    </Suspense>
  );
}
