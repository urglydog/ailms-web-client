import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/siteUrl';

/** Cho công cụ tìm kiếm lập chỉ mục trang công khai; chặn khu quản trị/giảng viên/thanh toán (Giai đoạn D, 11/11/2026). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/instructor/', '/checkout/', '/payments', '/disputes/', '/profile', '/exam/', '/api/'],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
