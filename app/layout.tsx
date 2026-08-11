import type { Metadata } from 'next';
import Script from 'next/script';
import { IBM_Plex_Mono, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

/**
 * Font nạp qua `next/font` thay vì thẻ `<link>` Google Fonts: Next tự self-host,
 * nên không có request sang domain ngoài, không nhấp nháy font và không phụ thuộc
 * mạng của người dùng.
 */
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'LinguaLearn — Học không giới hạn ngôn ngữ',
    template: '%s | LinguaLearn',
  },
  description:
    'Nền tảng học tập cá nhân hoá với lồng tiếng AI đa ngôn ngữ và trợ lý Socratic AI Tutor.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${outfit.variable} ${jakarta.variable} ${plexMono.variable}`}>
      <head>
        <Script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
