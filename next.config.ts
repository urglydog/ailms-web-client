import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Tắt việc Next.js tự fetch font từ Google Fonts lúc build time.
   * Trong môi trường CI không có internet, việc này gây lỗi timeout.
   * Font vẫn hoạt động bình thường ở runtime qua Google Fonts CDN.
   */
  optimizeFonts: false,

  /**
   * Chặn build khi có lỗi TypeScript hoặc ESLint.
   * Quy chuẩn dự án là zero `any` nên không được nới hai mục này.
   */
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  images: {
    remotePatterns: [
      // Ảnh bìa khoá học và avatar nằm trên Backblaze B2 sau Cloudflare CDN
      { protocol: 'https', hostname: '*.backblazeb2.com' },
      { protocol: 'https', hostname: '*.cloudflarestorage.com' },
      // Thumbnail của video YouTube (Lesson.videoSource = YOUTUBE)
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      // Placeholder data
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default nextConfig;
