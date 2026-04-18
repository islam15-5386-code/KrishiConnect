import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'KrishiConnect — Digital Agriculture Platform',
  description: 'Bangladesh\'s premier digital agriculture marketplace. Connect farmers, officers, companies and vendors.',
  keywords: 'agriculture, Bangladesh, farming, krishiconnect, crop marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-krishi-surface text-krishi-dark`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
