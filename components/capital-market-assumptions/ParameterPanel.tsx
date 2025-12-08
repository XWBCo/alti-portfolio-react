'use client';

import type { CMAParams, Currency, Scenario } from '@/lib/cma-types';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP'];
const SCENARIOS: Scenario[] = [
  'Base Case',
  'Mild Recession',
  'Stagflation',
  'Disinflationary Boom',
  'Policy Overkill',
];

interface ParameterPanelProps {
  params: CMAParams;
  onParamsChange: (params: CMAParams) => void;
  onDownloadExcel: () => void;
  onDownloadCSV: () => void;
}

export default function ParameterPanel({
  params,
  onParamsChange,
  onDownloadExcel,
  onDownloadCSV,
}: ParameterPanelProps) {
  return (
    <div
      className="w-[320px] bg-[#f8f9fa] p-6 h-full overflow-auto border-r border-[#e6e6e6]"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      <h2 className="text-[22px] font-normal text-[#4A4A4A] mb-10 mt-4">
        Parameters:
      </h2>

      {/* Currency Selector */}
      <div className="mb-10">
        <label className="block text-[14px] text-[#4A4A4A] mb-2">
          Select Currency:
        </label>
        <select
          value={params.currency}
          onChange={(e) =>
            onParamsChange({ ...params, currency: e.target.value as Currency })
          }
          className="w-full p-2 border border-[#ccc] rounded bg-white text-[14px] text-[#4A4A4A]"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Scenario Selector */}
      <div className="mb-10">
        <label className="block text-[14px] text-[#4A4A4A] mb-2">
          Select Scenario:
        </label>
        <select
          value={params.scenario}
          onChange={(e) =>
            onParamsChange({ ...params, scenario: e.target.value as Scenario })
          }
          className="w-full p-2 border border-[#ccc] rounded bg-white text-[14px] text-[#4A4A4A]"
        >
          {SCENARIOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Download Buttons */}
      <button
        onClick={onDownloadExcel}
        className="w-full p-3 mb-4 bg-[#e1e1e1] text-[#4A4A4A] border border-[#ccc] rounded text-[14px] hover:bg-[#d5d5d5] transition-colors"
      >
        Download CMA Excel
      </button>

      <button
        onClick={onDownloadCSV}
        className="w-full p-3 mb-4 bg-[#e1e1e1] text-[#4A4A4A] border border-[#ccc] rounded text-[14px] hover:bg-[#d5d5d5] transition-colors"
      >
        Download Return Series
      </button>

      {/* Methodology Link */}
      <a
        href="/downloads/AlTi CMA Update 2025.pdf"
        download
        className="block w-full p-3 bg-[#00f0db] text-[#010203] border border-[#00d6c3] rounded text-[14px] text-center font-medium hover:bg-[#00d6c3] transition-colors no-underline"
      >
        Download Methodology PDF
      </a>

      {/* Scenario Description */}
      <div className="mt-10 p-4 bg-white rounded border border-[#e6e6e6]">
        <h3 className="text-[14px] font-semibold text-[#074269] mb-2">
          Scenario Info
        </h3>
        <p className="text-[12px] text-[#757575] leading-relaxed">
          {params.scenario === 'Base Case' && (
            <>Base case assumptions using current market conditions and historical trends.</>
          )}
          {params.scenario === 'Mild Recession' && (
            <>Returns reduced by 20%, volatility increased by 15%. Reflects moderate economic contraction.</>
          )}
          {params.scenario === 'Stagflation' && (
            <>Returns reduced by 30%, volatility increased by 30%. Reflects persistent inflation with stagnant growth.</>
          )}
          {params.scenario === 'Disinflationary Boom' && (
            <>Returns increased by 20%, volatility reduced by 15%. Reflects strong growth with declining inflation.</>
          )}
          {params.scenario === 'Policy Overkill' && (
            <>Returns reduced by 40%, volatility increased by 50%. Reflects aggressive monetary tightening causing recession.</>
          )}
        </p>
      </div>
    </div>
  );
}
