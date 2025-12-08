'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { AltiIconMap } from './icons/AltiIcons';

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  icon: string;
  href: string;
  disabled?: boolean;
  devOnly?: boolean;
  isImpact?: boolean;
}

export default function ToolCard({
  id,
  name,
  description,
  tooltip,
  href,
  disabled = false,
  devOnly = false,
  isImpact = false,
}: ToolCardProps) {
  const CustomIcon = AltiIconMap[id as keyof typeof AltiIconMap];
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Accent colors - turquoise for standard, emerald for Impact
  const accentColor = isImpact ? '#34E5B8' : '#00f0db';
  const borderColor = isImpact ? '#34E5B8' : '#00f0db';

  const cardContent = (
    <motion.div
      onHoverStart={() => !disabled && setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={false}
      animate={{
        y: isHovered ? -4 : 0,
        boxShadow: isHovered
          ? '0 12px 24px rgba(0, 0, 0, 0.12)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        borderColor: isHovered ? borderColor : '#e0e0e0',
        borderWidth: isHovered ? '2px' : '1px',
      }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`
        relative bg-white rounded-lg
        h-full flex flex-col
        border border-solid
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{ padding: '32px 28px' }}
    >
      {/* Dev badge */}
      {devOnly && (
        <span className="absolute top-4 right-4 text-[11px] font-medium px-2 py-0.5 bg-[#f8f9fa] text-[#757575] rounded">
          DEV
        </span>
      )}

      {/* SVG Icon - color change only, no scale */}
      <div className="mb-[38px] mx-auto" style={{ width: '120px', height: '120px' }}>
        {CustomIcon ? (
          <motion.div
            initial={false}
            animate={{
              color: disabled
                ? '#A3A3A3'
                : isHovered
                  ? accentColor
                  : isImpact
                    ? '#1A9E76' // Vibrant emerald-green for Impact
                    : '#2980B9', // Vibrant azure-blue for standard icons
            }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <CustomIcon
              className="w-full h-full"
              accentColor={isHovered && !disabled ? accentColor : undefined}
            />
          </motion.div>
        ) : (
          <div className={`w-full h-full rounded-lg flex items-center justify-center bg-gray-100
            ${disabled ? 'text-[#A3A3A3]' : 'text-[#3A6082]'}
          `}>
            <span className="text-3xl">?</span>
          </div>
        )}
      </div>

      {/* Title row with info icon */}
      <div className="flex items-start justify-between mb-3">
        <h3
          className="text-[21px] font-normal text-[#010203] leading-tight flex-1"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {name}
        </h3>

        {/* Info icon with tooltip */}
        <div className="relative">
          <button
            className="text-[#010203] opacity-60 hover:opacity-100 transition-opacity duration-200"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => e.preventDefault()}
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{
              opacity: showTooltip ? 1 : 0,
              y: showTooltip ? 0 : -4,
              scale: showTooltip ? 1 : 0.95,
            }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-6 z-50 w-[280px] p-4 bg-[#010203] text-white text-[14px] rounded-md shadow-xl pointer-events-none"
            style={{ lineHeight: 1.6 }}
          >
            {tooltip}
            <div className="absolute -top-1 right-2 w-2 h-2 bg-[#010203] rotate-45" />
          </motion.div>
        </div>
      </div>

      {/* Description */}
      <p className="text-[15px] text-[#757575] leading-relaxed mb-6 flex-grow">
        {description}
      </p>

      {/* Arrow indicator */}
      <div className="text-center mt-auto">
        <motion.span
          className={`text-[22px] inline-block ${disabled ? 'text-[#A3A3A3]' : 'text-[#010203]'}`}
          initial={false}
          animate={{
            x: isHovered ? 6 : 0,
            color: isHovered && !disabled ? accentColor : disabled ? '#A3A3A3' : '#010203',
          }}
          transition={{ duration: 0.3 }}
        >
          →
        </motion.span>
      </div>
    </motion.div>
  );

  if (disabled) {
    return <div className="h-full">{cardContent}</div>;
  }

  return (
    <Link href={href} className="block h-full" style={{ textDecoration: 'none' }}>
      {cardContent}
    </Link>
  );
}
