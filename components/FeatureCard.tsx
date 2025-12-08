'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Info, ChevronRight } from 'lucide-react';
import { useState, ComponentType } from 'react';

interface IconProps {
  className?: string;
}

interface FeatureCardProps {
  name: string;
  description: string;
  tooltip?: string;
  href: string;
  icon: ComponentType<IconProps>;
  disabled?: boolean;
  featured?: boolean;
  accentColor?: string;
  ctaText?: string;
}

export default function FeatureCard({
  name,
  description,
  tooltip,
  href,
  icon: Icon,
  disabled = false,
  featured = false,
  accentColor = '#10B981',
  ctaText = 'Get Started',
}: FeatureCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth spring config matching ToolCard
  const springConfig = { type: 'spring' as const, stiffness: 120, damping: 18 };

  // Glow color derived from accent
  const glowColor = `${accentColor}26`; // ~15% opacity

  const cardContent = (
    <motion.div
      onHoverStart={() => !disabled && setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={false}
      animate={{
        y: isHovered ? -6 : 0,
        boxShadow: isHovered
          ? `0 20px 40px ${glowColor}, 0 0 0 1px ${accentColor}20`
          : '0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px #e6e6e6',
      }}
      transition={springConfig}
      className={`
        relative bg-white
        ${featured ? 'min-h-[320px]' : 'min-h-[280px]'} flex flex-col
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{ padding: featured ? '48px 40px' : '40px 32px' }}
    >
      {/* Subtle gradient overlay on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${accentColor}08 0%, transparent 50%)` }}
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      <div className={`flex flex-col ${featured ? 'items-center text-center' : 'items-start'}`}>
        {/* Icon with scale + color animation */}
        <motion.div
          className={featured ? 'mb-6' : 'mb-5'}
          initial={false}
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ ...springConfig, stiffness: 300 }}
        >
          <div
            className={`
              ${featured ? 'w-24 h-24' : 'w-[72px] h-[72px]'}
              rounded-full flex items-center justify-center transition-all duration-300
              ${isHovered ? '' : 'bg-gradient-to-br from-gray-50 to-gray-100'}
            `}
            style={isHovered ? {
              background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}25 100%)`,
            } : undefined}
          >
            <motion.div
              initial={false}
              animate={{
                color: disabled
                  ? '#A3A3A3'
                  : isHovered
                    ? accentColor
                    : '#6b7280',
              }}
              transition={{ duration: 0.15 }}
            >
              <Icon className={featured ? 'w-16 h-16' : 'w-12 h-12'} />
            </motion.div>
          </div>
        </motion.div>

        {/* Title row with optional info icon */}
        <div className={`flex items-start ${featured ? 'justify-center' : 'justify-between'} w-full mb-3`}>
          <h2
            className={`
              ${featured ? 'text-3xl' : 'text-2xl'}
              font-normal text-gray-900 leading-tight
            `}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {name}
          </h2>

          {/* Info icon with tooltip (only if tooltip provided) */}
          {tooltip && !featured && (
            <div className="relative ml-2">
              <button
                className="text-gray-900 opacity-40 hover:opacity-100 transition-opacity duration-150"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={(e) => e.preventDefault()}
              >
                <Info className="w-4 h-4" />
              </button>

              {/* Tooltip with animation */}
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{
                  opacity: showTooltip ? 1 : 0,
                  y: showTooltip ? 0 : -4,
                  scale: showTooltip ? 1 : 0.95,
                }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-6 z-50 w-[280px] p-3 bg-gray-900 text-white text-[13px] rounded-lg shadow-xl pointer-events-none"
                style={{ lineHeight: 1.5 }}
              >
                {tooltip}
                <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 rotate-45" />
              </motion.div>
            </div>
          )}
        </div>

        {/* Description */}
        <p className={`
          text-gray-500 leading-relaxed flex-grow
          ${featured ? 'text-sm max-w-lg mb-6' : 'text-sm mb-6'}
        `}>
          {description}
        </p>

        {/* CTA with arrow animation */}
        <motion.div
          className="flex items-center gap-2 text-sm font-medium mt-auto"
          initial={false}
          animate={{
            color: isHovered && !disabled ? accentColor : '#9ca3af',
          }}
          transition={{ duration: 0.15 }}
        >
          <span>{ctaText}</span>
          <motion.div
            initial={false}
            animate={{
              x: isHovered ? 4 : 0,
            }}
            transition={springConfig}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom accent bar - slides in from left */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: accentColor, transformOrigin: 'left' }}
        initial={false}
        animate={{
          scaleX: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </motion.div>
  );

  if (disabled) {
    return <div>{cardContent}</div>;
  }

  return (
    <Link href={href} className="block">
      {cardContent}
    </Link>
  );
}
