'use client';

import { FileText } from 'lucide-react';

export interface Source {
  name: string;
  url?: string;
}

interface SourceTagsProps {
  sources: Source[];
}

export function SourceTags({ sources }: SourceTagsProps) {
  return (
    <div className="flex gap-2.5 mt-5 flex-wrap">
      {sources.map((source, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 rounded-full text-xs font-medium text-emerald-700"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
          {source.name}
        </span>
      ))}
    </div>
  );
}
