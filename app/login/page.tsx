'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/lib/auth';
import { useTransition } from '@/lib/transitions';
import Image from 'next/image';

const isDev = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const router = useRouter();
  const { login, devBypass, isAuthenticated, isLoading } = useAuth();
  const { phase, startTransition } = useTransition();

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cardVisible, setCardVisible] = useState(true);

  // Ref to capture the login card's position
  const cardRef = useRef<HTMLDivElement>(null);

  // Redirect if already authenticated (only if not transitioning)
  useEffect(() => {
    if (isAuthenticated && !isLoading && phase === 'idle') {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, phase, router]);

  // Handle card visibility during transition
  useEffect(() => {
    if (phase === 'login-exit') {
      // Fade out the card
      setCardVisible(false);
    }
  }, [phase]);

  // Trigger the transition after successful auth
  const triggerTransition = () => {
    const rect = cardRef.current?.getBoundingClientRect();
    startTransition(rect || undefined);
  };

  const handleDevBypass = async () => {
    setSubmitting(true);
    setError('');
    const result = await devBypass();
    if (result.success) {
      triggerTransition();
    } else {
      setError(result.error || 'Dev bypass failed');
    }
    setSubmitting(false);
  };

  const handleGuestLogin = async () => {
    setSubmitting(true);
    setError('');
    const result = await login({ email: 'guest@alti-global.com', password: 'guest', isGuest: true });
    if (result.success) {
      triggerTransition();
    } else {
      setError(result.error || 'Guest login failed');
    }
    setSubmitting(false);
  };

  const handleSSOClick = () => {
    setError('SSO not yet configured');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen w-full relative flex items-center justify-center overflow-hidden bg-gray-200">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
          style={{ objectPosition: 'center center' }}
        />
      </div>

      {/* Login Card with animation */}
      <AnimatePresence>
        {cardVisible && (
          <motion.div
            ref={cardRef}
            className="relative z-10 w-full max-w-md mx-4"
            initial={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 1.02,
              transition: { duration: 0.4, ease: 'easeOut' },
            }}
          >
            <div className="bg-white shadow-2xl p-10">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <Image
                  src="/alti-logo.jpg"
                  alt="AlTi Tiedemann Global"
                  width={200}
                  height={65}
                  priority
                />
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 text-red-600 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Dev Bypass - Always visible for testing */}
              <div className="mb-4">
                  <button
                    onClick={handleDevBypass}
                    disabled={submitting}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-teal-500 to-cyan-500
                             text-white font-medium
                             hover:from-teal-600 hover:to-cyan-600
                             transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Signing in...' : 'Dev Bypass'}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-1">
                    Development only
                  </p>
                </div>

              {/* SSO Login - Primary AlTi teal */}
              <div className="mb-3">
                <button
                  onClick={handleSSOClick}
                  className="w-full py-3.5 px-6 bg-[#00B5AD] text-white
                           font-medium hover:bg-[#009A94]
                           transition-colors duration-200 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
                    <path d="M10 0H0V10H10V0Z" fill="#F25022"/>
                    <path d="M21 0H11V10H21V0Z" fill="#7FBA00"/>
                    <path d="M10 11H0V21H10V11Z" fill="#00A4EF"/>
                    <path d="M21 11H11V21H21V11Z" fill="#FFB900"/>
                  </svg>
                  SSO Login
                </button>
              </div>

              {/* Guest Login - Secondary */}
              <div>
                <button
                  onClick={handleGuestLogin}
                  disabled={submitting}
                  className="w-full py-3.5 px-6 border-2 border-[#00B5AD] text-[#00B5AD]
                           font-medium hover:bg-[#00B5AD]/5
                           transition-colors duration-200 disabled:opacity-50"
                >
                  Guest Login
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
