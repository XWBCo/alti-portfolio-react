'use client';

import { Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ChipOption {
  id: string;
  label: string;
  description?: string;
}

interface MultiSelectChipsProps {
  options: ChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allowMultiple?: boolean;
  className?: string;
}

export function MultiSelectChips({
  options,
  selected,
  onChange,
  allowMultiple = true,
  className = '',
}: MultiSelectChipsProps) {
  const handleToggle = (id: string) => {
    if (allowMultiple) {
      if (selected.includes(id)) {
        onChange(selected.filter((s) => s !== id));
      } else {
        onChange([...selected, id]);
      }
    } else {
      onChange([id]);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option, index) => {
        const isSelected = selected.includes(option.id);

        return (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            onClick={() => handleToggle(option.id)}
            className={`
              inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
              transition-all duration-200
              ${isSelected
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white text-gray-700 border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'
              }
            `}
            title={option.description}
          >
            {isSelected && <Check className="w-4 h-4" />}
            <span>{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// Single-select variant
interface SingleSelectChipsProps {
  options: ChipOption[];
  selected: string | null;
  onChange: (selected: string) => void;
  className?: string;
}

export function SingleSelectChips({
  options,
  selected,
  onChange,
  className = '',
}: SingleSelectChipsProps) {
  return (
    <MultiSelectChips
      options={options}
      selected={selected ? [selected] : []}
      onChange={(values) => onChange(values[0] || '')}
      allowMultiple={false}
      className={className}
    />
  );
}
