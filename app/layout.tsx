import type { Metadata } from 'next';
import { Fraunces, Outfit } from 'next/font/google';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
});

const sans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Entrybook',
    template: '%s · Entrybook',
  },
  description:
    'Admin panel for Merchant Cashflow & Ledger. Subscriptions are enabled after payment and the end date is set here.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Entrybook',
    description: 'Admin panel for Merchant Cashflow & Ledger.',
    url: SITE_URL,
    siteName: 'Entrybook',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} font-[family-name:var(--font-sans)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
