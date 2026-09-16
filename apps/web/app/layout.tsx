import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { company } from '@/config/company';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import { themeInitScript } from '@/lib/theme';

import '@/styles/globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const description = `${company.legalName} is a founder-led web development firm in Dhaka, Bangladesh. ${company.tagline}.`;

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${company.legalName} — ${company.tagline}`,
    template: `%s | ${company.legalName}`,
  },
  description,
  applicationName: company.legalName,
  authors: [{ name: company.founder.name }],
  creator: company.legalName,
  openGraph: {
    type: 'website',
    siteName: company.legalName,
    title: company.legalName,
    description,
    locale: 'en',
  },
  twitter: {
    card: 'summary_large_image',
    title: company.legalName,
    description,
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    // suppressHydrationWarning: the theme script changes <html> class/style before hydration.
    <html lang="en" className={cn(geistSans.variable, geistMono.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/*
       * suppressHydrationWarning: a browser extension (not this app) injects a
       * `__processed_<uuid>__="true"` attribute onto <body> after the server response is
       * generated — confirmed by the UUID differing on every page load, which nothing in this
       * codebase can produce (no Math.random/Date.now/locale formatting/window branch anywhere
       * in apps/web). There is no application-side fix for third-party DOM mutation, so this
       * only silences the resulting, unactionable warning — it must not be used to hide a real
       * mismatch.
       */}
      <body suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:inline-flex focus:min-h-12 focus:items-center focus:rounded-btn focus:border focus:border-default focus:bg-surface focus:px-4 focus:font-semibold focus:text-primary"
        >
          Skip to main content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
