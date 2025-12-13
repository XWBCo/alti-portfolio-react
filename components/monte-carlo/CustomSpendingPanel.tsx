'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import type { SpendingEvent, SpendingScheduleItem } from '@/lib/types';

interface CustomSpendingPanelProps {
  events: SpendingEvent[];
  durationYears: number;
  initialValue: number;
  onEventsChange: (events: SpendingEvent[]) => void;
}

export default function CustomSpendingPanel({
  events,
  durationYears,
  initialValue,
  onEventsChange,
}: CustomSpendingPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SpendingEvent | null>(null);

  // Form state for new/editing event
  const [formType, setFormType] = useState<'one-time' | 'recurring' | 'percentage'>('one-time');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formQuarter, setFormQuarter] = useState('1');
  const [formStartQuarter, setFormStartQuarter] = useState('1');
  const [formEndQuarter, setFormEndQuarter] = useState(String(durationYears * 4));
  const [formFrequency, setFormFrequency] = useState('4');
  const [formPercentage, setFormPercentage] = useState('');

  const totalQuarters = durationYears * 4;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate spending schedule from events
  const spendingSchedule: SpendingScheduleItem[] = useMemo(() => {
    const schedule: Map<number, { amount: number; sources: string[] }> = new Map();

    events.forEach((event) => {
      if (event.type === 'one-time' && event.quarter) {
        if (event.quarter >= 1 && event.quarter <= totalQuarters) {
          const existing = schedule.get(event.quarter) || { amount: 0, sources: [] };
          existing.amount += event.amount;
          existing.sources.push(event.description);
          schedule.set(event.quarter, existing);
        }
      } else if (event.type === 'recurring') {
        const start = event.startQuarter || 1;
        const end = Math.min(event.endQuarter || totalQuarters, totalQuarters);
        const freq = event.frequency || 1;

        for (let q = start; q <= end; q += freq) {
          const existing = schedule.get(q) || { amount: 0, sources: [] };
          existing.amount += event.amount;
          existing.sources.push(`${event.description} (recurring)`);
          schedule.set(q, existing);
        }
      }
      // Percentage-based events are handled dynamically during simulation
    });

    // Convert to array
    const items: SpendingScheduleItem[] = [];
    schedule.forEach((data, quarter) => {
      items.push({
        quarter,
        year: Math.floor((quarter - 1) / 4) + 1,
        quarterInYear: ((quarter - 1) % 4) + 1,
        amount: data.amount,
        source: data.sources.join(', '),
        isRecurring: data.sources.some((s) => s.includes('recurring')),
      });
    });

    // Add percentage events as summary (not quarter-specific)
    const percentageEvents = events.filter((e) => e.type === 'percentage');
    if (percentageEvents.length > 0) {
      // Add informational row
      items.push({
        quarter: -1,
        year: 0,
        quarterInYear: 0,
        amount: 0,
        source: percentageEvents.map((e) => `${e.description}: ${((e.percentage || 0) * 100).toFixed(1)}%`).join(', '),
        isRecurring: false,
      });
    }

    return items.sort((a, b) => a.quarter - b.quarter);
  }, [events, totalQuarters]);

  const resetForm = () => {
    setFormType('one-time');
    setFormAmount('');
    setFormDescription('');
    setFormQuarter('1');
    setFormStartQuarter('1');
    setFormEndQuarter(String(durationYears * 4));
    setFormFrequency('4');
    setFormPercentage('');
    setEditingEvent(null);
  };

  const handleAddEvent = () => {
    const newEvent: SpendingEvent = {
      id: editingEvent?.id || `event-${Date.now()}`,
      type: formType,
      amount: parseFloat(formAmount) || 0,
      description: formDescription || 'Untitled Event',
    };

    if (formType === 'one-time') {
      newEvent.quarter = parseInt(formQuarter) || 1;
    } else if (formType === 'recurring') {
      newEvent.startQuarter = parseInt(formStartQuarter) || 1;
      newEvent.endQuarter = parseInt(formEndQuarter) || totalQuarters;
      newEvent.frequency = parseInt(formFrequency) || 1;
    } else if (formType === 'percentage') {
      newEvent.percentage = parseFloat(formPercentage) / 100 || 0;
    }

    if (editingEvent) {
      // Update existing event
      onEventsChange(events.map((e) => (e.id === editingEvent.id ? newEvent : e)));
    } else {
      // Add new event
      onEventsChange([...events, newEvent]);
    }

    setShowAddForm(false);
    resetForm();
  };

  const handleDeleteEvent = (id: string) => {
    onEventsChange(events.filter((e) => e.id !== id));
  };

  const handleEditEvent = (event: SpendingEvent) => {
    setEditingEvent(event);
    setFormType(event.type);
    setFormAmount(String(event.amount));
    setFormDescription(event.description);

    if (event.type === 'one-time') {
      setFormQuarter(String(event.quarter || 1));
    } else if (event.type === 'recurring') {
      setFormStartQuarter(String(event.startQuarter || 1));
      setFormEndQuarter(String(event.endQuarter || totalQuarters));
      setFormFrequency(String(event.frequency || 4));
    } else if (event.type === 'percentage') {
      setFormPercentage(String((event.percentage || 0) * 100));
    }

    setShowAddForm(true);
  };

  // Calculate total impact
  const totalImpact = useMemo(() => {
    const fixedTotal = spendingSchedule
      .filter((item) => item.quarter > 0)
      .reduce((sum, item) => sum + item.amount, 0);

    const percentageTotal = events
      .filter((e) => e.type === 'percentage')
      .reduce((sum, e) => sum + (e.percentage || 0), 0);

    return { fixedTotal, percentageTotal };
  }, [spendingSchedule, events]);

  return (
    <div className="bg-white border border-[#e6e6e6] rounded-lg">
      <div className="p-6 border-b border-[#e6e6e6]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[17px] font-medium text-[#010203]">
            Custom Spending Events
          </h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#00f0db] text-[#010203] rounded hover:bg-[#00d6c3] transition-colors text-[13px] font-medium"
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>
        <p className="text-[13px] text-[#757575]">
          Define one-time withdrawals, recurring distributions, or percentage-based spending
        </p>
      </div>

      {/* Event List */}
      {events.length > 0 && (
        <div className="p-6 border-b border-[#e6e6e6]">
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between p-4 bg-[#f8f9fa] rounded border border-[#e6e6e6] hover:border-[#00f0db] transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`
                        px-2 py-1 rounded text-[11px] font-medium
                        ${event.type === 'one-time' ? 'bg-blue-100 text-blue-700' : ''}
                        ${event.type === 'recurring' ? 'bg-green-100 text-green-700' : ''}
                        ${event.type === 'percentage' ? 'bg-purple-100 text-purple-700' : ''}
                      `}
                    >
                      {event.type === 'one-time' ? 'One-Time' : event.type === 'recurring' ? 'Recurring' : 'Percentage'}
                    </span>
                    <p className="text-[15px] font-medium text-[#010203]">
                      {event.description}
                    </p>
                  </div>
                  <div className="text-[13px] text-[#757575]">
                    {event.type === 'one-time' && (
                      <>
                        {formatCurrency(event.amount)} in Q{event.quarter} (Year {Math.floor(((event.quarter || 1) - 1) / 4) + 1})
                      </>
                    )}
                    {event.type === 'recurring' && (
                      <>
                        {formatCurrency(event.amount)} every {event.frequency} quarter(s), Q{event.startQuarter} to Q{event.endQuarter}
                      </>
                    )}
                    {event.type === 'percentage' && (
                      <>
                        {((event.percentage || 0) * 100).toFixed(2)}% of portfolio value each quarter
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="px-3 py-1 text-[13px] text-[#00B5AD] hover:text-[#00918c] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-1 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="p-6 border-b border-[#e6e6e6] bg-[#f8f9fa]">
          <h4 className="text-[15px] font-medium text-[#010203] mb-4">
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </h4>

          <div className="space-y-4">
            {/* Event Type */}
            <div>
              <label className="block text-[13px] text-[#757575] mb-2">
                Event Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as 'one-time' | 'recurring' | 'percentage')}
                className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
              >
                <option value="one-time">One-Time Withdrawal</option>
                <option value="recurring">Recurring Withdrawal</option>
                <option value="percentage">Percentage-Based</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[13px] text-[#757575] mb-2">
                Description
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g., College tuition, Home purchase, etc."
                className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
              />
            </div>

            {/* One-Time Fields */}
            {formType === 'one-time' && (
              <>
                <div>
                  <label className="block text-[13px] text-[#757575] mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0"
                    min={0}
                    step={1000}
                    className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-[#757575] mb-2">
                    Quarter (1-{totalQuarters})
                  </label>
                  <input
                    type="number"
                    value={formQuarter}
                    onChange={(e) => setFormQuarter(e.target.value)}
                    min={1}
                    max={totalQuarters}
                    className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
                  />
                </div>
              </>
            )}

            {/* Recurring Fields */}
            {formType === 'recurring' && (
              <>
                <div>
                  <label className="block text-[13px] text-[#757575] mb-2">
                    Amount per Occurrence
                  </label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0"
                    min={0}
                    step={1000}
                    className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] text-[#757575] mb-2">
                      Start Quarter
                    </label>
                    <input
                      type="number"
                      value={formStartQuarter}
                      onChange={(e) => setFormStartQuarter(e.target.value)}
                      min={1}
                      max={totalQuarters}
                      className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#757575] mb-2">
                      End Quarter
                    </label>
                    <input
                      type="number"
                      value={formEndQuarter}
                      onChange={(e) => setFormEndQuarter(e.target.value)}
                      min={parseInt(formStartQuarter) || 1}
                      max={totalQuarters}
                      className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] text-[#757575] mb-2">
                    Frequency (Every N Quarters)
                  </label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
                  >
                    <option value="1">Every Quarter</option>
                    <option value="2">Every 2 Quarters (Semi-Annual)</option>
                    <option value="4">Every 4 Quarters (Annual)</option>
                    <option value="12">Every 12 Quarters (3 Years)</option>
                  </select>
                </div>
              </>
            )}

            {/* Percentage Fields */}
            {formType === 'percentage' && (
              <>
                <div>
                  <label className="block text-[13px] text-[#757575] mb-2">
                    Percentage of Portfolio (%)
                  </label>
                  <input
                    type="number"
                    value={formPercentage}
                    onChange={(e) => setFormPercentage(e.target.value)}
                    placeholder="0.00"
                    min={0}
                    max={100}
                    step={0.01}
                    className="w-full p-3 border border-[#e6e6e6] rounded bg-white text-[15px]"
                  />
                  <p className="text-[11px] text-[#757575] mt-1">
                    Applied every quarter based on current portfolio value
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded flex items-start gap-2">
                  <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[12px] text-blue-900">
                    Percentage-based withdrawals adjust automatically with portfolio value. Currently estimates {formatCurrency(initialValue * (parseFloat(formPercentage) || 0) / 100)} per quarter based on initial value.
                  </p>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddEvent}
                disabled={!formDescription || (formType !== 'percentage' && !formAmount)}
                className="flex-1 py-3 bg-[#00f0db] text-[#010203] rounded hover:bg-[#00d6c3] transition-colors font-medium disabled:bg-[#e6e6e6] disabled:text-[#757575] disabled:cursor-not-allowed"
              >
                {editingEvent ? 'Update Event' : 'Add Event'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="px-6 py-3 bg-white border border-[#e6e6e6] text-[#010203] rounded hover:bg-[#f8f9fa] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spending Schedule Table */}
      {spendingSchedule.length > 0 && (
        <div className="p-6">
          <h4 className="text-[15px] font-medium text-[#010203] mb-4">
            Spending Schedule
          </h4>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-[#f8f9fa] rounded">
            <div>
              <p className="text-[11px] text-[#757575] mb-1">Total Fixed Withdrawals</p>
              <p className="text-[17px] font-semibold text-[#010203]">
                {formatCurrency(totalImpact.fixedTotal)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#757575] mb-1">Additional % Withdrawals</p>
              <p className="text-[17px] font-semibold text-[#010203]">
                {(totalImpact.percentageTotal * 100).toFixed(2)}% per quarter
              </p>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="max-h-64 overflow-y-auto border border-[#e6e6e6] rounded">
            <table className="w-full text-[13px]">
              <thead className="bg-[#f8f9fa] sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium text-[#010203]">Quarter</th>
                  <th className="text-left p-3 font-medium text-[#010203]">Year</th>
                  <th className="text-right p-3 font-medium text-[#010203]">Amount</th>
                  <th className="text-left p-3 font-medium text-[#010203]">Source</th>
                </tr>
              </thead>
              <tbody>
                {spendingSchedule.map((item, idx) => {
                  if (item.quarter === -1) {
                    // Percentage summary row
                    return (
                      <tr key="percentage-summary" className="bg-purple-50">
                        <td colSpan={3} className="p-3 text-[#757575]">
                          All Quarters
                        </td>
                        <td className="p-3 text-purple-700 font-medium">
                          {item.source}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={idx} className="border-t border-[#e6e6e6] hover:bg-[#f8f9fa]">
                      <td className="p-3">Q{item.quarter}</td>
                      <td className="p-3">Year {item.year}</td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="p-3 text-[#757575]">{item.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && !showAddForm && (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f8f9fa] flex items-center justify-center">
            <Plus size={32} className="text-[#757575]" />
          </div>
          <p className="text-[15px] text-[#757575] mb-2">No custom spending events</p>
          <p className="text-[13px] text-[#757575] mb-6">
            Add withdrawals to model specific spending scenarios
          </p>
        </div>
      )}
    </div>
  );
}
