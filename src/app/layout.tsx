import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FA Meeting Manager | FutureSolutions AI',
  description: 'Financial Adviser Meeting Notes & Template Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased flex h-screen overflow-hidden`} suppressHydrationWarning>
        <Providers>
          <Sidebar />
          <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-900/50">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
