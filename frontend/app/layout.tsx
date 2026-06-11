
import type { Metadata } from 'next';
import './globals.css';

/* Style system — foundations */
import '@/styles/foundations/app-tokens.css';
import '@/styles/foundations/base.css';

/* Theme contract + theme index */
import '@/styles/themes/theme-contract.css';
import '@/styles/themes/themes.index.css';

/* Copilot — destination + study mode overrides */
import '@/styles/copilot/copilot-theme.destinations.css';
import '@/styles/copilot/copilot-theme.study-modes.css';

/* Copilot — component styles */
import '@/styles/copilot/copilot-animations.css';
import '@/styles/copilot/copilot-voice.css';
import '@/styles/copilot/copilot-markdown.css';
import '@/styles/copilot/copilot-chat.css';
import '@/styles/copilot/copilot-sidebar.css';
import '@/styles/copilot/copilot-revision.css';

import { AppClientShell } from '@/components/AppClientShell';

export const metadata: Metadata = {
  title: 'Steadfast Copilot AI',
  description: 'Your personal AI learning assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AppClientShell>{children}</AppClientShell>
      </body>
    </html>
  );
}
