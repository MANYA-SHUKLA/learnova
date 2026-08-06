import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Learnova',
    template: '%s · Learnova',
  },
  description:
    'Enterprise AI learning platform — LMS, ERP, exams, coding labs, and analytics for modern institutions.',
  applicationName: 'Learnova',
  icons: {
    icon: [
      { url: '/icon', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: [{ url: '/icon', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen font-body antialiased">{children}</body>
    </html>
  );
}
