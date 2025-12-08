'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Animation types available
export type TransitionType = 'portal-zoom' | 'iris-reveal' | 'perspective-lift';

// Transition phases
export type TransitionPhase =
  | 'idle'           // No transition
  | 'login-exit'     // Login card animating out
  | 'transition'     // Main transition effect
  | 'homepage-enter' // Homepage animating in
  | 'complete';      // Animation finished

interface TransitionState {
  isTransitioning: boolean;
  phase: TransitionPhase;
  animationType: TransitionType;
  // Store login card rect for animations that need it
  loginCardRect: DOMRect | null;
}

interface TransitionContextType extends TransitionState {
  // Set the animation type before triggering
  setAnimationType: (type: TransitionType) => void;
  // Start the transition (called from login on successful auth)
  startTransition: (loginCardRect?: DOMRect) => void;
  // Advance to next phase
  advancePhase: () => void;
  // Reset to idle
  resetTransition: () => void;
  // Signal that homepage entrance is complete
  completeTransition: () => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

const PHASE_ORDER: TransitionPhase[] = ['idle', 'login-exit', 'transition', 'homepage-enter', 'complete'];

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TransitionState>({
    isTransitioning: false,
    phase: 'idle',
    animationType: 'portal-zoom', // Default animation
    loginCardRect: null,
  });

  const setAnimationType = useCallback((type: TransitionType) => {
    setState(s => ({ ...s, animationType: type }));
  }, []);

  const startTransition = useCallback((loginCardRect?: DOMRect) => {
    setState(s => ({
      ...s,
      isTransitioning: true,
      phase: 'login-exit',
      loginCardRect: loginCardRect || null,
    }));
  }, []);

  const advancePhase = useCallback(() => {
    setState(s => {
      const currentIndex = PHASE_ORDER.indexOf(s.phase);
      const nextIndex = Math.min(currentIndex + 1, PHASE_ORDER.length - 1);
      const nextPhase = PHASE_ORDER[nextIndex];

      return {
        ...s,
        phase: nextPhase,
        isTransitioning: nextPhase !== 'complete' && nextPhase !== 'idle',
      };
    });
  }, []);

  const resetTransition = useCallback(() => {
    setState(s => ({
      ...s,
      isTransitioning: false,
      phase: 'idle',
      loginCardRect: null,
    }));
  }, []);

  const completeTransition = useCallback(() => {
    setState(s => ({
      ...s,
      isTransitioning: false,
      phase: 'complete',
    }));
  }, []);

  return (
    <TransitionContext.Provider
      value={{
        ...state,
        setAnimationType,
        startTransition,
        advancePhase,
        resetTransition,
        completeTransition,
      }}
    >
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition(): TransitionContextType {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within TransitionProvider');
  }
  return context;
}
