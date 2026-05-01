'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Purpose of 'cn':
// This utility (typically using clsx and tailwind-merge) allows us to:
// 1. Conditionally apply tailwind classes (e.g., { 'bg-red-500': hasError })
// 2. Safely merge tailwind classes, ensuring that classes passed via props 
//    successfully override or complement default styles without conflicts.

interface AssistantLogoProps {
    size?: number;
    className?: string;
}

export function AssistantLogo({ size = 32, className }: AssistantLogoProps) {
    const [imageFailed, setImageFailed] = useState(false);

    return (
        <div className={cn(
            "relative shrink-0 rounded-xl overflow-hidden border border-border/40 shadow-sm bg-white p-1.5",
            className
        )} style={{ width: size, height: size }}>
            {imageFailed ? (
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-[var(--copilot-accent-soft)] text-[var(--copilot-accent-text)] font-bold">
                    S
                </div>
            ) : (
                <Image
                    src="/favicon.ico"
                    alt="Assistant Logo"
                    width={size}
                    height={size}
                    className="object-contain w-full h-full"
                    onError={() => setImageFailed(true)}
                />
            )}
        </div>
    );
}
