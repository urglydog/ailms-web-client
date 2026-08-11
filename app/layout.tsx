import type { Metadata } from 'next';
import Script from 'next/script';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from './providers';

/**
 * Font tự lưu trữ (`.woff2` trong `app/fonts/`) thay vì `next/font/google`: file build ra
 * KHÔNG BAO GIỜ cần tải gì từ `fonts.gstatic.com` nữa — CI (GitHub Actions) không có đường ra
 * tới domain đó nên `next/font/google` từng làm `next build` fail toàn bộ (retry đủ 3 lần vẫn
 * lỗi, không phải flake mạng tạm thời). File nguồn: lấy trực tiếp từ Google Fonts CSS2 API,
 * subset `latin` (khớp đúng phạm vi ký tự mà cấu hình cũ đã dùng, không đổi hành vi hiển thị).
 */
const outfit = localFont({
  src: './fonts/outfit-variable.woff2',
  weight: '500 800',
  variable: '--font-outfit',
  display: 'swap',
  preload: false,
});

const jakarta = localFont({
  src: './fonts/plus-jakarta-sans-variable.woff2',
  weight: '400 700',
  variable: '--font-jakarta',
  display: 'swap',
  preload: false,
});

const plexMono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-400.woff2', weight: '400' },
    { path: './fonts/ibm-plex-mono-500.woff2', weight: '500' },
  ],
  variable: '--font-plex-mono',
  display: 'swap',
  preload: false,
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
