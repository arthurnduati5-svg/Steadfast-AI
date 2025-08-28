import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SteadfastCopilot } from '@/components/steadfast-copilot';

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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <div className="flex min-h-screen w-full flex-col">
          {children}
          <SteadfastCopilot />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
