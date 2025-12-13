'use client';

import { X } from 'lucide-react';
import CustomSpendingPanel from './CustomSpendingPanel';
import type { SpendingEvent } from '@/lib/types';

interface CustomSpendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: SpendingEvent[];
  durationYears: number;
  initialValue: number;
  onEventsChange: (events: SpendingEvent[]) => void;
}

export default function CustomSpendingModal({
  isOpen,
  onClose,
  events,
  durationYears,
  initialValue,
  onEventsChange,
}: CustomSpendingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e6e6e6]">
          <div>
            <h2
              className="text-[#010203]"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: '24px',
                fontWeight: 400,
              }}
            >
              Custom Spending Events
            </h2>
            <p className="text-[13px] text-[#757575] mt-1">
              Model specific withdrawal scenarios beyond regular spending
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f8f9fa] rounded transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-[#757575]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <CustomSpendingPanel
            events={events}
            durationYears={durationYears}
            initialValue={initialValue}
            onEventsChange={onEventsChange}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-[#e6e6e6] p-6 bg-[#f8f9fa]">
          <div className="flex justify-between items-center">
            <p className="text-[13px] text-[#757575]">
              {events.length} event{events.length !== 1 ? 's' : ''} configured
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#00f0db] text-[#010203] rounded hover:bg-[#00d6c3] transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
