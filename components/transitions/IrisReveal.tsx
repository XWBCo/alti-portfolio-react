'use client';

/**
 * Iris Reveal Transition
 *
 * Effect: Login card fades, AlTi logo stays centered and pulses slightly.
 * A circular mask originates from the logo and expands outward like an iris
 * opening, revealing the homepage beneath. Logo fades as content appears.
 *
 * Phases:
 * 1. login-exit: Card fades, logo remains centered
 * 2. transition: Circular mask expands from logo center, logo fades
 * 3. homepage-enter: Homepage content fades in
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTransition } from '@/lib/transitions';
import Image from 'next/image';

interface IrisRevealProps {
  onNavigate: () => void;
}

export default function IrisReveal({ onNavigate }: IrisRevealProps) {
  const { phase, advancePhase } = useTransition();
  const [showIris, setShowIris] = useState(false);
  const [logoScale, setLogoScale] = useState(1);

  // Calculate the max radius needed to cover the entire viewport
  const maxRadius =
    typeof window !== 'undefined'
      ? Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2))
      : 2000;

  useEffect(() => {
    if (phase === 'login-exit') {
      // Logo pulses slightly before iris opens
      setLogoScale(1.1);
      const timer = setTimeout(() => {
        setShowIris(true);
        advancePhase(); // Move to 'transition'
      }, 500);
      return () => clearTimeout(timer);
    }

    if (phase === 'transition') {
      // Fade logo as iris expands
      const logoTimer = setTimeout(() => {
        setLogoScale(0.9);
      }, 200);

      // Navigate and advance after iris expands
      const navTimer = setTimeout(() => {
        onNavigate();
        advancePhase(); // Move to 'homepage-enter'
      }, 900);

      return () => {
        clearTimeout(logoTimer);
        clearTimeout(navTimer);
      };
    }
  }, [phase, advancePhase, onNavigate]);

  return (
    <AnimatePresence>
      {/* Background layer with gradient - visible during transition */}
      {(phase === 'login-exit' || phase === 'transition') && (
        <motion.div
          key="iris-bg"
          className="fixed inset-0 z-40"
          style={{
            background: 'linear-gradient(135deg, #0A2240 0%, #1a3a5a 50%, #0A2240 100%)',
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* AlTi Background Image */}
          <Image
            src="/login-bg.jpg"
            alt=""
            fill
            className="object-cover opacity-60"
            style={{ objectPosition: 'center center' }}
          />
        </motion.div>
      )}

      {/* Centered Logo - the "iris" center */}
      {(phase === 'login-exit' || phase === 'transition') && (
        <motion.div
          key="iris-logo"
          className="fixed z-50 flex items-center justify-center"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            opacity: phase === 'transition' ? 0 : 1,
            scale: logoScale,
          }}
          transition={{
            opacity: { duration: 0.5, delay: phase === 'transition' ? 0.3 : 0 },
            scale: { duration: 0.4, ease: 'easeOut' },
          }}
        >
          <div className="bg-white p-6 shadow-2xl">
            <Image
              src="/alti-logo.jpg"
              alt="AlTi Tiedemann Global"
              width={200}
              height={65}
              priority
            />
          </div>
        </motion.div>
      )}

      {/* Iris mask - circular reveal expanding from center */}
      {showIris && (
        <motion.div
          key="iris-mask"
          className="fixed z-45 bg-[#f8f9fa]"
          style={{
            left: '50%',
            top: '50%',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          initial={{
            width: 100,
            height: 100,
            opacity: 0.8,
          }}
          animate={{
            width: maxRadius * 2.5,
            height: maxRadius * 2.5,
            opacity: 1,
          }}
          transition={{
            duration: 0.9,
            ease: [0.25, 0.1, 0.25, 1], // Smooth iris opening
          }}
        />
      )}
    </AnimatePresence>
  );
}
