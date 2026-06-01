import type { Metadata, Viewport } from 'next';
import { DM_Sans, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { Providers } from '@/components/providers';
import { getAppUrl } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  metadataBase: getAppUrl(),
  title: {
    default: 'FudiMenu — Tu menú online en segundos',
    template: '%s | FudiMenu',
  },
  description: 'Crea y comparte un menú online rápido para tu restaurante, sin PDFs lentos.',
  applicationName: 'FudiMenu',
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'FudiMenu',
    title: 'FudiMenu — Tu menú online en segundos',
    description: 'Crea y comparte un menú online rápido para tu restaurante, sin PDFs lentos.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FudiMenu — Tu menú online en segundos',
    description: 'Crea y comparte un menú online rápido para tu restaurante, sin PDFs lentos.',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F4B400',
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
