import localFont from 'next/font/local';

/** Font trang trọng riêng cho chứng chỉ (Playfair Display + Work Sans) — KHÁC font thương hiệu
 * toàn site (Outfit/Plus Jakarta Sans ở `app/layout.tsx`), theo đúng yêu cầu giữ nguyên font của
 * bản demo `doc/feat/Main-html/Main.dc.html`. Tự lưu trữ `.ttf` (không dùng `next/font/google`
 * hay CDN) — cùng lý do đã ghi ở `app/layout.tsx`: CI không có đường ra `fonts.gstatic.com`.
 *
 * Chỉ 3 style Playfair (Bold thẳng, Italic 500, Bold Italic) + 2 weight Work Sans (Regular,
 * SemiBold) được nhúng — đúng tập hợp thực tế dùng trong `CertificatePreview.tsx`, không nhúng
 * dư các weight khác không xuất hiện trên chứng chỉ. */
export const certificatePlayfair = localFont({
  src: [
    { path: '../../app/fonts/playfair-display-bold.ttf', weight: '700', style: 'normal' },
    { path: '../../app/fonts/playfair-display-italic.ttf', weight: '500', style: 'italic' },
    { path: '../../app/fonts/playfair-display-bold-italic.ttf', weight: '700', style: 'italic' },
  ],
  variable: '--font-certificate-playfair',
  display: 'swap',
  preload: false,
});

export const certificateWorkSans = localFont({
  src: [
    { path: '../../app/fonts/work-sans-regular.ttf', weight: '400', style: 'normal' },
    { path: '../../app/fonts/work-sans-semibold.ttf', weight: '600', style: 'normal' },
  ],
  variable: '--font-certificate-worksans',
  display: 'swap',
  preload: false,
});
