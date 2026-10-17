'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ArrowLeft, BadgeCheck, Check, Copy, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCertificateDetail } from '@/hooks/useCertificates';
import { certificatesApi } from '@/lib/api/certificates';
import { CertificatePreview } from '@/components/certificate/CertificatePreview';
import { ApiError } from '@/lib/api/client';

/** Chi tiết 1 chứng chỉ — xem trước, tải PDF, "Thêm vào LinkedIn", sao chép link xác thực
 * (doc/DacTa_ChucNangChungChi.md, mục 7). */
export default function CertificateDetailPage() {
  const t = useTranslations('certificate');
  const params = useParams<{ certificateCode: string }>();
  const { data: certificate, isLoading, error } = useCertificateDetail(params.certificateCode);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    if (!certificate || isDownloading) return;
    setIsDownloading(true);
    try {
      const blob = await certificatesApi.downloadPdf(certificate.certificateCode);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chung-chi-${certificate.certificateCode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('downloadError'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!certificate) return;
    try {
      await navigator.clipboard.writeText(certificate.verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('copyError'));
    }
  };

  if (isLoading) return <div className="shell py-10 text-center text-sm text-ink-muted">{t('loading')}</div>;

  if (error || !certificate) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="shell py-10 text-center text-sm text-ink-muted">
        {notFound ? t('notFound') : t('loadError')}
      </div>
    );
  }

  const completedDate = new Date(certificate.completedAt);
  const linkedInUrl = buildLinkedInAddUrl(certificate, completedDate);

  return (
    <div className="shell py-8">
      <Link
        href="/my-courses"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark no-underline hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('back')}
      </Link>

      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-tint px-3 py-1 text-xs font-bold text-success-ink">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          {t('valid')}
        </span>
      </div>
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">{t('congrats')}</h1>
      <p className="mb-6 text-sm text-ink-muted">&ldquo;{certificate.courseTitle}&rdquo;</p>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <CertificatePreview certificate={certificate} />

        <div className="flex flex-col gap-3">
          <dl className="rounded-xl border border-line bg-white p-4 text-sm">
            <InfoRow label={t('recipient')} value={certificate.studentName} />
            <InfoRow label={t('instructor')} value={certificate.instructorName} />
            <InfoRow label={t('completedOn')} value={format(completedDate, 'dd/MM/yyyy')} />
            <InfoRow label={t('code')} value={certificate.certificateCode} mono />
          </dl>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            <Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {isDownloading ? t('downloading') : t('download')}
          </button>

          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full border border-accent px-5 py-3 text-sm font-bold text-accent-dark no-underline hover:bg-surface hover:text-accent-dark"
          >
            {t('linkedin')}
          </a>

          <div className="rounded-xl border border-line bg-surface-raised p-3">
            <label htmlFor="verify-url" className="mb-1.5 block text-xs font-semibold text-ink-muted">
              {t('verifyLink')}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="verify-url"
                readOnly
                value={certificate.verifyUrl}
                className="w-full min-w-0 truncate rounded-lg border border-line bg-white px-2.5 py-2 text-xs text-ink-muted"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink/85"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copied ? t('copied') : t('copy')}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-ink-muted">{t('linkedinHint')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line-soft py-2 last:border-b-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={`text-right font-semibold text-ink ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

/** Định dạng "Add to Profile" chuẩn công khai của LinkedIn (Coursera/Udemy/Credly dùng chung) —
 * xem doc/DacTa_ChucNangChungChi.md mục 7. Không cần LinkedIn duyệt tổ chức trước ở bước này. */
function buildLinkedInAddUrl(
  certificate: { courseTitle: string; certificateCode: string; verifyUrl: string },
  completedDate: Date,
): string {
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: certificate.courseTitle,
    organizationName: 'LinguaLearn',
    issueYear: String(completedDate.getFullYear()),
    issueMonth: String(completedDate.getMonth() + 1),
    certUrl: certificate.verifyUrl,
    certId: certificate.certificateCode,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
