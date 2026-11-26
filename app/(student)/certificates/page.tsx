'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MyLearningTabs } from '@/components/course/MyLearningTabs';
import { useMyCertificates } from '@/hooks/useCertificates';

/** "Chứng chỉ của tôi" (doc/DacTa_ChucNangChungChi.md, mục 7) — danh sách chứng chỉ đã cấp,
 * mới nhất lên đầu (`CertificateRepository.findByStudent_IdOrderByIssuedAtDesc`). Chi tiết/tải
 * PDF/chia sẻ nằm ở trang con `/certificates/{certificateCode}`. (26/11/2026) Là 1 tab của trang
 * "Học tập" cùng Khoá học của tôi / Yêu thích (UDEMY_LAYOUT_ANALYSIS mục 11). */
export default function MyCertificatesPage() {
  const t = useTranslations('myCourses.certificates');
  const { data: certificates, isLoading } = useMyCertificates();

  return (
    <div>
      <div className="border-b border-line bg-surface">
        <div className="shell pb-0 pt-8">
          <MyLearningTabs active="certificates" />
        </div>
      </div>
      <div className="shell py-10">
        <p className="mb-6 text-sm text-ink-muted">{t('subtitle')}</p>

        {isLoading ? (
          <div className="text-sm text-ink-muted">{t('loading')}</div>
        ) : !certificates || certificates.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-muted">{t('empty')}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <Link
                key={cert.certificateCode}
                href={`/certificates/${cert.certificateCode}`}
                className="card-interactive flex flex-col gap-3 p-5 no-underline hover:no-underline"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Award className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <span className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-ink">
                  {cert.courseTitle}
                </span>
                <span className="text-xs text-ink-muted">
                  {t('issuedOn', { date: format(new Date(cert.issuedAt), 'dd/MM/yyyy') })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
