'use client';

/**
 * Portal Zoom Transition
 *
 * Effect: Login card fades out, then the camera smoothly zooms deep into the
 * AlTi background photo. As zoom intensifies, a soft white vignette grows from
 * the edges, eventually enveloping the view and revealing the homepage.
 *
 * Total duration: ~2.5s
 * - Card fade: 0.4s
 * - Zoom: 1.8s (continuous, deep zoom to 4x scale)
 * - Cross-fade: starts at 60% zoom progress, completes with zoom
 */

import { useEffect, useRef } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { useTransition } from '@/lib/transitions';
import Image from 'next/image';

interface PortalZoomProps {
  onNavigate: () => void;
}

export default function PortalZoom({ onNavigate }: PortalZoomProps) {
  const { phase, advancePhase } = useTransition();
  const zoomControls = useAnimationControls();
  const vignetteControls = useAnimationControls();
  const fadeControls = useAnimationControls();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (phase === 'login-exit' && !hasStarted.current) {
      hasStarted.current = true;

      // Start the zoom animation sequence
      const runAnimation = async () => {
        // Small delay for card to start fading
        await new Promise(resolve => setTimeout(resolve, 200));

        // Start all animations simultaneously with different timings
        zoomControls.start({
          scale: 10,
          transition: {
            duration: 2.8,
            ease: [0.25, 0.1, 0.25, 1], // Smooth cinematic ease
          },
        });

        vignetteControls.start({
          opacity: 1,
          transition: {
            duration: 2.4,
            delay: 0.4,
            ease: [0.4, 0, 0.2, 1],
          },
        });

        // Fade to white - must be fully opaque BEFORE we navigate
        fadeControls.start({
          opacity: 1,
          transition: {
            duration: 0.6,
            delay: 1.6,
            ease: [0.4, 0, 0.2, 1],
          },
        });

        // Advance phase partway through
        setTimeout(() => {
          advancePhase(); // Move to 'transition'
        }, 500);

        // Navigate while overlay is opaque (fade complete at 2.2s)
        setTimeout(() => {
          onNavigate();
        }, 2400);

        // Hide overlay after homepage has rendered
        setTimeout(() => {
          advancePhase(); // Move to 'homepage-enter'
        }, 2550);
      };

      runAnimation();
    }
  }, [phase, advancePhase, onNavigate, zoomControls, vignetteControls, fadeControls]);

  // Only render during active transition phases
  if (phase !== 'login-exit' && phase !== 'transition') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      {/* Homepage background color - base layer */}
      <div className="absolute inset-0 bg-[#f8f9fa]" />

      {/* White fade overlay - fades in on top of everything */}
      <motion.div
        className="absolute inset-0 bg-[#f8f9fa] z-30"
        initial={{ opacity: 0 }}
        animate={fadeControls}
      />

      {/* Vignette overlay - grows from edges */}
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={vignetteControls}
        style={{
          background: `radial-gradient(ellipse 80% 80% at center,
            transparent 0%,
            transparent 20%,
            rgba(248,249,250,0.3) 40%,
            rgba(248,249,250,0.7) 60%,
            rgba(248,249,250,0.95) 80%,
            rgb(248,249,250) 100%
          )`,
        }}
      />

      {/* Zooming background image */}
      <motion.div
        className="absolute inset-0 z-10"
        initial={{ scale: 1 }}
        animate={zoomControls}
        style={{
          transformOrigin: '50% 45%', // Slightly above center for more natural feel
          willChange: 'transform',
        }}
      >
        <Image
          src="/login-bg.jpg"
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: 'center center' }}
          priority
        />
      </motion.div>
    </div>
  );
}
