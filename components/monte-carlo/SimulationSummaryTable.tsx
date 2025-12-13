'use client';

import { formatCurrency, formatPercent } from '@/lib/simulation';
import type { SimulationResult, SimulationSlotParams } from '@/lib/types';

interface SimulationSummaryTableProps {
  slot1: SimulationSlotParams;
  slot2: SimulationSlotParams;
  slot3: SimulationSlotParams;
  results: {
    slot1: SimulationResult | null;
    slot2: SimulationResult | null;
    slot3: SimulationResult | null;
  };
  initialValue: number;
}

const SLOT_COLORS = {
  slot1: '#621368',
  slot2: '#074269',
  slot3: '#0B6D7B',
};

export default function SimulationSummaryTable({
  slot1,
  slot2,
  slot3,
  results,
  initialValue,
}: SimulationSummaryTableProps) {
  const hasAnyResult = results.slot1 || results.slot2 || results.slot3;

  if (!hasAnyResult) {
    return null;
  }

  const getSlotData = (
    slot: SimulationSlotParams,
    result: SimulationResult | null,
    color: string
  ) => {
    if (!result) return null;

    const finalMedian = result.median[result.median.length - 1];
    const finalP5 = result.percentile5[result.percentile5.length - 1];
    const finalP95 = result.percentile95[result.percentile95.length - 1];
    const years = slot.durationQuarters / 4;

    // Calculate annualized return from median
    const cagr = Math.pow(finalMedian / initialValue, 1 / years) - 1;

    return {
      name: slot.name,
      color,
      duration: `${years} years`,
      initialReturn: formatPercent(slot.returnInitial),
      initialVol: formatPercent(slot.volInitial),
      medianFinal: formatCurrency(finalMedian),
      p5Final: formatCurrency(finalP5),
      p95Final: formatCurrency(finalP95),
      cagr: formatPercent(cagr),
      probOutperform: formatPercent(result.probabilities.outperformInflation),
      probDepletion: formatPercent(result.probabilities.portfolioDepletion),
      probMaintain: formatPercent(result.probabilities.maintainValue),
    };
  };

  const slots = [
    getSlotData(slot1, results.slot1, SLOT_COLORS.slot1),
    getSlotData(slot2, results.slot2, SLOT_COLORS.slot2),
    getSlotData(slot3, results.slot3, SLOT_COLORS.slot3),
  ].filter(Boolean);

  if (slots.length === 0) return null;

  return (
    <div className="bg-white rounded border border-[#e6e6e6] p-4">
      <h3
        className="text-[16px] font-light text-[#010203] mb-4"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        Simulation Comparison Summary
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e6e6e6]">
              <th className="text-left py-2 px-3 font-medium text-[#757575]">Metric</th>
              {slots.map((slot, i) => (
                <th key={i} className="text-right py-2 px-3 font-medium" style={{ color: slot!.color }}>
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slot!.color }} />
                    {slot!.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Duration */}
            <tr className="border-b border-[#f0f0f0]">
              <td className="py-2 px-3 text-[#4A4A4A]">Duration</td>
              {slots.map((slot, i) => (
                <td key={i} className="py-2 px-3 text-right font-mono">{slot!.duration}</td>
              ))}
            </tr>

            {/* Initial Return */}
            <tr className="border-b border-[#f0f0f0]">
              <td className="py-2 px-3 text-[#4A4A4A]">Initial Return</td>
              {slots.map((slot, i) => (
                <td key={i} className="py-2 px-3 text-right font-mono">{slot!.initialReturn}</td>
              ))}
            </tr>

            {/* Initial Volatility */}
            <tr className="border-b border-[#f0f0f0]">
              <td className="py-2 px-3 text-[#4A4A4A]">Initial Volatility</td>
              {slots.map((slot, i) => (
                <td key={i} className="py-2 px-3 text-right font-mono">{slot!.initialVol}</td>
              ))}
            </tr>

            {/* Divider */}
            <tr>
              <td colSpan={slots.length + 1} className="py-1">
                <div className="border-t border-[#e6e6e6]" />
              </td>
            </tr>

            {/* Median Final Value */}
            <tr className="border-b border-[#f0f0f0] bg-[#f8f9fa]">
              <td className="py-2 px-3 text-[#4A4A4A] font-medium">Median Final Value</td>
              {slots.map((slot, i) => (
                <td key={i} className="py-2 px-3 text-right font-mono font-semibold" style={{ color: slot!.color }}>
                  {slot!.medianFinal}
                </td>
              ))}
            </tr>

            {/* 5th Percentile */}
            <tr className="border-b border-[#f0f0f0]">
              <td className="py-2 px-3 text-[#4A4A4A]">5th Percentile (Worst)</td>
              {slots.map((slot, i) => (
                <td key={i} className="py-2 px-3 text-right font-mono text-[#EF4444]">{slot!.p5Final}</td>
              ))}
            </tr>

            {/* 95th Percentile */}
            <tr className="border-b border-[#f0f0f0]">
              <td className="py-2 px-3 text-[#4A4A4A]">95th Percentile (Best)</td>
              {slots.map((slot, i) => (
                <td key={i} className="py-2 px-3 text-right font-mono text-[#22C55E]">{slot!.p95Final}</td>
              ))}
            </tr>

            {/* CAGR */}
            <tr className="border-b border-[#f0f0f0]">
              <td className="py-2 px-3 text-[#4A4A4A]">Median CAGR</td>
              {slots.map((slot, i) => (
                <td key={i} className="py-2 px-3 text-right font-mono">{slot!.cagr}</td>
              ))}
            </tr>

            {/* Divider */}
            <tr>
              <td colSpan={slots.length + 1} className="py-1">
                <div className="border-t border-[#e6e6e6]" />
              </td>
            </tr>

            {/* Probability: Outperform Inflation */}
            <tr className="border-b border-[#f0f0f0]">
              <td className="py-2 px-3 text-[#4A4A4A]">P(Outperform Inflation)</td>
              {slots.map((slot, i) => (
                <td key={i} className="py-2 px-3 text-right font-mono">{slot!.probOutperform}</td>
              ))}
            </tr>

            {/* Probability: Maintain Value */}
            <tr className="border-b border-[#f0f0f0]">
              <td className="py-2 px-3 text-[#4A4A4A]">P(Maintain Initial Value)</td>
              {slots.map((slot, i) => (
                <td key={i} className="py-2 px-3 text-right font-mono">{slot!.probMaintain}</td>
              ))}
            </tr>

            {/* Probability: Depletion */}
            <tr>
              <td className="py-2 px-3 text-[#4A4A4A]">P(Portfolio Depletion)</td>
              {slots.map((slot, i) => (
                <td key={i} className="py-2 px-3 text-right font-mono text-[#EF4444]">{slot!.probDepletion}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
