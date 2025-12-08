'use client';

import { MetricsCard, MetricsData } from './MetricsCard';
import { SourceTags, Source } from './SourceTags';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  metrics?: MetricsData;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`mb-9 animate-fadeUp ${isUser ? 'flex justify-end' : ''}`}
    >
      <div
        className={`max-w-[75%] px-6 py-5 text-base leading-relaxed ${
          isUser
            ? 'bg-emerald-600 text-white rounded-3xl rounded-br-md'
            : 'bg-[#f8faf9] border border-emerald-200 rounded-3xl rounded-bl-md text-gray-900'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {message.metrics && (
          <MetricsCard data={message.metrics} />
        )}

        {message.sources && message.sources.length > 0 && (
          <SourceTags sources={message.sources} />
        )}
      </div>
    </div>
  );
}
