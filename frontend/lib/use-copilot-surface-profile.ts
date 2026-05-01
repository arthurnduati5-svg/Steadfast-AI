'use client';

import type { RefObject } from 'react';
import { useEffect, useState } from 'react';
import { resolveCopilotSurfaceProfile } from '@/lib/copilot-surface';
import type { CopilotSurfaceProfile } from '@/lib/types';

export function useCopilotSurfaceProfile(
  ref: RefObject<HTMLElement | null>,
  fallback: CopilotSurfaceProfile = 'comfortable'
) {
  const [surfaceProfile, setSurfaceProfile] = useState<CopilotSurfaceProfile>(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateProfile = () => {
      const rect = element.getBoundingClientRect();
      setSurfaceProfile(resolveCopilotSurfaceProfile(rect.width));
    };

    updateProfile();
    const observer = new ResizeObserver(() => updateProfile());
    observer.observe(element);
    return () => observer.disconnect();
  }, [fallback, ref]);

  return surfaceProfile;
}
