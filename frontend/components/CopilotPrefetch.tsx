'use client';

import { useEffect, useRef } from 'react';
import api from '@/lib/api';

let prefetchPromise: Promise<void> | null = null;

const preloadOnce = async () => {
  await Promise.allSettled([api.preferences.get()]);
};

export function CopilotPrefetch() {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (!prefetchPromise) {
      prefetchPromise = preloadOnce().finally(() => {
        prefetchPromise = null;
      });
    }
  }, []);

  return null;
}
