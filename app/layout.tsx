import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import LinkWatch from '@/components/dev/LinkWatch';
import { ThemeProvider } from '@/components/ui/theme-provider';
import NeuralBG from '@/components/olvg/NeuralBG';
import InsightDock from '@/components/olvg/InsightDock';
import GlobalHeader from '@/components/GlobalHeader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OLV Intelligent Prospect v2',
  description: 'Plataforma de Prospecção & Inteligência B2B com dados reais — OLV.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className + ' min-h-screen bg-olv-ink text-slate-200 antialiased'}>
        <ThemeProvider>
          <NeuralBG />
          <GlobalHeader />
          <main className="mx-auto max-w-7xl px-4 py-8">
            {process.env.NODE_ENV !== 'production' ? (
              <LinkWatch>{children}</LinkWatch>
            ) : (
              children
            )}
          </main>
          <InsightDock />
        </ThemeProvider>
      </body>
    </html>
  );
}
