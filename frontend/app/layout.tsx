
import type { Metadata } from 'next';
import './globals.css';
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
