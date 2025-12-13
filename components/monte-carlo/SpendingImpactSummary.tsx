'use client';

import { useMemo } from 'react';
import { TrendingDown, DollarSign, Percent, Calendar } from 'lucide-react';
import type { SpendingEvent } from '@/lib/types';
import { calculateTotalSpendingImpact } from '@/lib/custom-spending';

interface SpendingImpactSummaryProps {
  events: SpendingEvent[];
  durationYears: number;
  initialValue: number;
}

export default function SpendingImpactSummary({
  events,
  durationYears,
  initialValue,
}: SpendingImpactSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const impact = useMemo(() => {
    const totalQuarters = durationYears * 4;
    return calculateTotalSpendingImpact(events, totalQuarters, initialValue);
  }, [events, durationYears, initialValue]);

  const breakdownByType = useMemo(() => {
    const oneTime = events.filter((e) => e.type === 'one-time').reduce((sum, e) => sum + e.amount, 0);
    const recurring = events.filter((e) => e.type === 'recurring');

    let recurringTotal = 0;
    recurring.forEach((event) => {
      const start = event.startQuarter || 1;
      const end = Math.min(event.endQuarter || durationYears * 4, durationYears * 4);
      const frequency = event.frequency || 1;
      const occurrences = Math.floor((end - start) / frequency) + 1;
      recurringTotal += event.amount * occurrences;
    });

    const percentage = events.filter((e) => e.type === 'percentage').reduce((sum, e) => sum + (e.percentage || 0), 0);

    return { oneTime, recurring: recurringTotal, percentage };
  }, [events, durationYears]);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-[#074269] to-[#0B6D7B] text-white rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown size={20} className="text-[#00f0db]" />
        <h4 className="text-[15px] font-semibold">Custom Spending Impact</h4>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/10 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-[#00f0db]" />
            <p className="text-[10px] uppercase tracking-wide opacity-80">Fixed Total</p>
          </div>
          <p className="text-[18px] font-bold">{formatCurrency(impact.totalFixed)}</p>
        </div>

        <div className="bg-white/10 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <Percent size={14} className="text-[#00f0db]" />
            <p className="text-[10px] uppercase tracking-wide opacity-80">Variable %</p>
          </div>
          <p className="text-[18px] font-bold">{(impact.totalPercentage * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-white/10 rounded p-3 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={14} className="text-[#00f0db]" />
          <p className="text-[10px] uppercase tracking-wide opacity-80">Estimated Total</p>
        </div>
        <p className="text-[20px] font-bold">{formatCurrency(impact.estimatedTotal)}</p>
        <p className="text-[10px] opacity-70 mt-1">Over {durationYears} years</p>
      </div>

      {/* Breakdown */}
      <div className="border-t border-white/20 pt-3 space-y-2">
        <p className="text-[10px] uppercase tracking-wide opacity-70 mb-2">Breakdown by Type</p>

        {breakdownByType.oneTime > 0 && (
          <div className="flex justify-between text-[12px]">
            <span className="opacity-80">One-time events</span>
            <span className="font-medium">{formatCurrency(breakdownByType.oneTime)}</span>
          </div>
        )}

        {breakdownByType.recurring > 0 && (
          <div className="flex justify-between text-[12px]">
            <span className="opacity-80">Recurring events</span>
            <span className="font-medium">{formatCurrency(breakdownByType.recurring)}</span>
          </div>
        )}

        {breakdownByType.percentage > 0 && (
          <div className="flex justify-between text-[12px]">
            <span className="opacity-80">Percentage-based</span>
            <span className="font-medium">{(breakdownByType.percentage * 100).toFixed(2)}% per quarter</span>
          </div>
        )}
      </div>

      <div className="mt-3 p-2 bg-[#00f0db]/10 rounded text-[10px] leading-relaxed">
        <strong className="text-[#00f0db]">Note:</strong> Percentage estimates use initial portfolio value. Actual withdrawals vary with portfolio performance.
      </div>
    </div>
  );
}
