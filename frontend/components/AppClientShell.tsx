'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from '@/components/ui/toaster';
import { UserProfileProvider } from '@/contexts/UserProfileContext';

const SteadfastCopilot = dynamic(
  () => import('@/components/steadfast-copilot').then((mod) => mod.SteadfastCopilot),
  { ssr: false }
);
const CopilotWidget = dynamic(
  () => import('@/components/CopilotWidget').then((mod) => mod.CopilotWidget),
  { ssr: false }
);
const CopilotPrefetch = dynamic(
  () => import('@/components/CopilotPrefetch').then((mod) => mod.CopilotPrefetch),
  { ssr: false }
);

export function AppClientShell({ children }: { children: React.ReactNode }) {
  return (
    <UserProfileProvider>
      <div className="flex min-h-screen min-h-dvh w-full flex-col">
        {children}
        <SteadfastCopilot />
        <CopilotWidget />
        <CopilotPrefetch />
      </div>
      <Toaster />
    </UserProfileProvider>
  );
}
