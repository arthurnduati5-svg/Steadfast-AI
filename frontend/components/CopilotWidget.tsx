'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  DEFAULT_WIDGET_NAVIGATION_STYLE,
  resolveCopilotSurfaceProfile,
} from '@/lib/copilot-surface';

const RAW_EMBED_ORIGIN =
  process.env.NEXT_PUBLIC_COPILOT_EMBED_ORIGIN ||
  process.env.COPILOT_EMBED_ORIGIN ||
  '';
const RAW_EMBED_URL =
  process.env.NEXT_PUBLIC_COPILOT_EMBED_URL ||
  process.env.COPILOT_EMBED_URL ||
  '';

const resolveOrigin = (value: string) => {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, '');
  }
};

const EMBED_ORIGIN = resolveOrigin(RAW_EMBED_ORIGIN || RAW_EMBED_URL);
const EMBED_URL = RAW_EMBED_URL || (EMBED_ORIGIN ? `${EMBED_ORIGIN}/embed` : '');

export function CopilotWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [surfaceProfile, setSurfaceProfile] = useState<'compact' | 'cozy' | 'comfortable' | 'expanded'>(
    'comfortable'
  );
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const initInFlightRef = useRef(false);
  const initDoneRef = useRef(false);
  const initRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptsRef = useRef(0);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    closePanel();
  }, [pathname, closePanel]);

  const fetchHandoffToken = useCallback(async () => {
    try {
      const data = await api.auth.fetchHandoffToken();
      return data?.token || null;
    } catch {
      return null;
    }
  }, []);

  const sendInit = useCallback(async () => {
    if (!iframeRef.current?.contentWindow || !EMBED_ORIGIN || !EMBED_URL) return;
    if (initDoneRef.current || initInFlightRef.current) return;
    initInFlightRef.current = true;
    try {
      const token = await fetchHandoffToken();
      if (!token) return;
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'COPILOT_INIT',
          token,
          surfaceKind: 'widget',
          surfaceProfile,
          navigationStyle: DEFAULT_WIDGET_NAVIGATION_STYLE,
        },
        EMBED_ORIGIN
      );
      initDoneRef.current = true;
    } finally {
      initInFlightRef.current = false;
    }
  }, [fetchHandoffToken, surfaceProfile]);

  const postSurfaceContract = useCallback(() => {
    if (!iframeRef.current?.contentWindow || !EMBED_ORIGIN) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: 'COPILOT_SURFACE_CONTRACT',
        surfaceKind: 'widget',
        surfaceProfile,
        navigationStyle: DEFAULT_WIDGET_NAVIGATION_STYLE,
      },
      EMBED_ORIGIN
    );
  }, [surfaceProfile]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!EMBED_ORIGIN || event.origin !== EMBED_ORIGIN) return;
      if (event.data?.type === 'COPILOT_READY') {
        setIsReady(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (isReady) {
      sendInit();
    }
  }, [isReady, sendInit]);

  useEffect(() => {
    if (isReady) sendInit();
  }, [isReady, sendInit]);

  useEffect(() => {
    if (!isReady || !isOpen) return;
    postSurfaceContract();
  }, [isOpen, isReady, postSurfaceContract]);

  const clearRetryTimer = useCallback(() => {
    if (initRetryRef.current) {
      clearTimeout(initRetryRef.current);
      initRetryRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearRetryTimer();
    retryAttemptsRef.current = 0;
    if (!isReady) return;
    const attempt = async () => {
      if (initDoneRef.current) return;
      await sendInit();
      if (!initDoneRef.current && retryAttemptsRef.current < 5) {
        retryAttemptsRef.current += 1;
        initRetryRef.current = setTimeout(attempt, 2000);
      }
    };
    attempt();
  }, [isReady, sendInit, clearRetryTimer]);

  useEffect(() => {
    initDoneRef.current = false;
    initInFlightRef.current = false;
    setIsReady(false);
    clearRetryTimer();
  }, [iframeKey]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === 'undefined') return;

    const updateSurfaceProfile = () => {
      const width = panel.getBoundingClientRect().width;
      setSurfaceProfile(resolveCopilotSurfaceProfile(width));
    };

    updateSurfaceProfile();
    const observer = new ResizeObserver(updateSurfaceProfile);
    observer.observe(panel);

    return () => observer.disconnect();
  }, [isOpen]);

  if (!EMBED_URL || !EMBED_ORIGIN) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[10000]">
        <button
          type="button"
          aria-label={isOpen ? 'Close copilot' : 'Open copilot'}
          onClick={() => setIsOpen(prev => !prev)}
          className={cn(
            'h-12 w-12 rounded-full shadow-lg transition-all flex items-center justify-center',
            'bg-white text-slate-900 border border-slate-200 hover:scale-[1.03] active:scale-[0.98]',
            'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700'
          )}
        >
          {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          'fixed z-[9999] transition-all duration-200',
          'left-0 right-0 bottom-0 px-4 pb-4',
          'md:left-auto md:right-6 md:bottom-20 md:px-0 md:pb-0',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div
          ref={panelRef}
          data-copilot-surface-profile={surfaceProfile}
          className={cn(
            'relative rounded-2xl shadow-2xl border border-black/10 bg-white overflow-hidden',
            'dark:bg-slate-950 dark:border-white/10',
            'w-full h-[90vh]',
            'md:w-[400px] md:h-[620px]'
          )}
          style={{ isolation: 'isolate' }}
        >
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={EMBED_URL}
            title="Steadfast Copilot"
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </div>
    </>
  );
}
