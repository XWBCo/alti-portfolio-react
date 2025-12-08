'use client';

/**
 * Perspective Lift Transition
 *
 * Effect: The entire login card lifts up and away in 3D space (z-axis + rotation),
 * shrinking as if being physically picked up and removed. The homepage slides in
 * from below, revealed underneath like removing a cover sheet.
 *
 * Phases:
 * 1. login-exit: Card lifts with perspective transform
 * 2. transition: Homepage slides up from bottom
 * 3. homepage-enter: Homepage content settles
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTransition } from '@/lib/transitions';
import Image from 'next/image';

interface PerspectiveLiftProps {
  onNavigate: () => void;
}

export default function PerspectiveLift({ onNavigate }: PerspectiveLiftProps) {
  const { phase, loginCardRect, advancePhase } = useTransition();
  const [cardState, setCardState] = useState<'visible' | 'lifting' | 'gone'>('visible');

  // Card dimensions from the actual login card
  const cardDimensions = loginCardRect
    ? {
        left: loginCardRect.left,
        top: loginCardRect.top,
        width: loginCardRect.width,
        height: loginCardRect.height,
      }
    : {
        left: typeof window !== 'undefined' ? (window.innerWidth - 400) / 2 : 200,
        top: typeof window !== 'undefined' ? (window.innerHeight - 500) / 2 : 100,
        width: 400,
        height: 500,
      };

  useEffect(() => {
    if (phase === 'login-exit') {
      // Start the lift animation
      setCardState('lifting');

      const timer = setTimeout(() => {
        setCardState('gone');
        advancePhase(); // Move to 'transition'
      }, 600);
      return () => clearTimeout(timer);
    }

    if (phase === 'transition') {
      // Navigate and advance after the lift completes
      const timer = setTimeout(() => {
        onNavigate();
        advancePhase(); // Move to 'homepage-enter'
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [phase, advancePhase, onNavigate]);

  return (
    <AnimatePresence>
      {/* Background image - fades as card lifts */}
      {(phase === 'login-exit' || phase === 'transition') && (
        <motion.div
          key="lift-bg"
          className="fixed inset-0 z-40"
          initial={{ opacity: 1 }}
          animate={{
            opacity: cardState === 'lifting' ? 0.4 : cardState === 'gone' ? 0 : 1,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/login-bg.jpg"
            alt=""
            fill
            className="object-cover"
            style={{ objectPosition: 'center center' }}
          />
        </motion.div>
      )}

      {/* Homepage preview sliding up from below */}
      {(cardState === 'lifting' || cardState === 'gone') && (
        <motion.div
          key="lift-homepage"
          className="fixed inset-0 z-41 bg-[#f8f9fa]"
          initial={{ y: '100%' }}
          animate={{ y: cardState === 'gone' ? '0%' : '30%' }}
          transition={{
            duration: 0.7,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      )}

      {/* Lifting card with 3D perspective */}
      {cardState !== 'gone' && (phase === 'login-exit' || phase === 'transition') && (
        <motion.div
          key="lift-card"
          className="fixed z-50"
          style={{
            perspective: '1500px',
            perspectiveOrigin: 'center center',
          }}
          initial={{
            left: cardDimensions.left,
            top: cardDimensions.top,
            width: cardDimensions.width,
          }}
          animate={{
            left: cardState === 'lifting' ? cardDimensions.left - 50 : cardDimensions.left,
            top: cardState === 'lifting' ? -300 : cardDimensions.top,
            width: cardDimensions.width,
          }}
          transition={{
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <motion.div
            className="bg-white shadow-2xl p-10"
            initial={{
              rotateX: 0,
              rotateY: 0,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              rotateX: cardState === 'lifting' ? -15 : 0,
              rotateY: cardState === 'lifting' ? 5 : 0,
              scale: cardState === 'lifting' ? 0.85 : 1,
              opacity: cardState === 'lifting' ? 0.8 : 1,
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: cardState === 'lifting'
                ? '0 50px 100px -20px rgba(0,0,0,0.4), 0 30px 60px -30px rgba(0,0,0,0.3)'
                : '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            {/* Logo inside the lifting card */}
            <div className="flex justify-center mb-8">
              <Image
                src="/alti-logo.jpg"
                alt="AlTi Tiedemann Global"
                width={200}
                height={65}
                priority
              />
            </div>

            {/* Fake button placeholders */}
            <div className="space-y-3">
              <div className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-sm" />
              <div className="w-full h-12 bg-[#00B5AD] rounded-sm" />
              <div className="w-full h-12 border-2 border-[#00B5AD] rounded-sm" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
