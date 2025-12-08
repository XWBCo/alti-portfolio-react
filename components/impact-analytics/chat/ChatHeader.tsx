'use client';

interface ChatHeaderProps {
  reportsIndexed?: number;
}

export function ChatHeader({ reportsIndexed = 42 }: ChatHeaderProps) {
  return (
    <div className="px-10 py-7 border-b border-emerald-200 flex items-center gap-5">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 flex items-center justify-center">
          <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
            <circle cx="20" cy="20" r="18" stroke="#10b981" strokeWidth="1.5" />
            <path
              d="M20 8 L20 20 L28 28"
              stroke="#14b8a6"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="20" cy="20" r="3" fill="#10b981" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-serif text-xl font-medium text-emerald-500 tracking-tight">
            Prism
          </span>
          <span className="text-xs font-normal text-gray-500 uppercase tracking-widest mt-0.5">
            Impact Research
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 text-gray-500 text-xs">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        <span>{reportsIndexed} reports indexed</span>
      </div>
    </div>
  );
}
