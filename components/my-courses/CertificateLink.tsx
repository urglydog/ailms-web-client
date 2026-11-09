'use client';

import Link from 'next/link';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** Nút "Xem chứng chỉ" (nền xanh lá nhạt, có biểu tượng) — hành động RIÊNG, tách khỏi việc bấm thân thẻ để vào
 * khóa học. Lớp `cert-link` để thẻ cha tắt hiệu ứng nâng khi rê chuột vào đây (`has-[.cert-link:hover]`).
 * Dùng `hover:text-white` vì luật toàn cục `a:hover` đổi màu chữ liên kết. */
export function CertificateLink({ href }: { href: string }) {
  const t = useTranslations('myCourses.card');
  return (
    <Link
      href={href}
      title={t('certificateTooltip')}
      className="cert-link inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-success/30 bg-success-tint px-2.5 py-1 text-xs font-medium text-success-ink no-underline transition-colors duration-150 hover:border-success hover:bg-success hover:text-white hover:no-underline"
    >
      <Award size={14} aria-hidden />
      {t('viewCertificate')}
    </Link>
  );
}
