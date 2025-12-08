'use client';

/**
 * TransitionOverlay
 *
 * Main component that renders the appropriate transition animation
 * based on the selected type. Placed at the root layout level.
 */

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useTransition } from '@/lib/transitions';
import PortalZoom from './PortalZoom';
import IrisReveal from './IrisReveal';
import PerspectiveLift from './PerspectiveLift';

export default function TransitionOverlay() {
  const router = useRouter();
  const { phase, animationType } = useTransition();

  // Called by animation components when it's time to navigate
  const handleNavigate = useCallback(() => {
    router.push('/');
  }, [router]);

  // Only render when a transition is active
  if (phase === 'idle' || phase === 'complete') {
    return null;
  }

  // Render the appropriate animation component
  switch (animationType) {
    case 'portal-zoom':
      return <PortalZoom onNavigate={handleNavigate} />;
    case 'iris-reveal':
      return <IrisReveal onNavigate={handleNavigate} />;
    case 'perspective-lift':
      return <PerspectiveLift onNavigate={handleNavigate} />;
    default:
      return <PortalZoom onNavigate={handleNavigate} />;
  }
}
