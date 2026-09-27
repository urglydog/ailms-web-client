'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Download, Copy, Check } from 'lucide-react';
import { useCertificateDetail } from '@/hooks/useCertificates';
import { certificatesApi } from '@/lib/api/certificates';
import { CertificatePreview } from '@/components/certificate/CertificatePreview';
import { ApiError } from '@/lib/api/client';

/** Chi tiết 1 chứng chỉ — xem trước, tải PDF, "Thêm vào LinkedIn", sao chép link xác thực
 * (doc/DacTa_ChucNangChungChi.md, mục 7). */
export default function CertificateDetailPage() {
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
      toast.error('Có lỗi khi tải chứng chỉ, vui lòng thử lại.');
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
      toast.error('Không sao chép được, vui lòng thử lại.');
    }
  };

  if (isLoading) return <div className="shell py-10 text-center text-sm text-ink-muted">Đang tải...</div>;

  if (error || !certificate) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="shell py-10 text-center text-sm text-ink-muted">
        {notFound ? 'Không tìm thấy chứng chỉ này.' : 'Không tải được chứng chỉ, thử lại sau.'}
      </div>
    );
  }

  const completedDate = new Date(certificate.completedAt);
  const linkedInUrl = buildLinkedInAddUrl(certificate, completedDate);

  return (
    <div className="shell py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          Đã hoàn thành
        </span>
      </div>
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Chúc mừng bạn đã hoàn thành khóa học!</h1>
      <p className="mb-6 text-sm text-ink-muted">&ldquo;{certificate.courseTitle}&rdquo;</p>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <CertificatePreview certificate={certificate} />

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            {isDownloading ? 'Đang tải...' : 'Tải PDF'}
          </button>

          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-bold text-ink no-underline hover:bg-surface"
          >
            Thêm vào LinkedIn
          </a>

          <div className="rounded-xl border border-line bg-surface-raised p-3">
            <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Liên kết xác thực</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={certificate.verifyUrl}
                className="w-full min-w-0 truncate rounded-lg border border-line bg-white px-2.5 py-2 text-xs text-ink-muted"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink/85"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-ink-faint">
              Dán liên kết này vào mục Licenses &amp; Certifications trên LinkedIn hoặc phần Certifications trong CV.
            </p>
          </div>

          <div className="rounded-xl border border-line-soft p-3 text-xs text-ink-muted">
            <p>Giảng viên: {certificate.instructorName}</p>
            <p>Ngày hoàn thành: {format(completedDate, 'dd/MM/yyyy')}</p>
            <p>Mã chứng chỉ: {certificate.certificateCode}</p>
          </div>
        </div>
      </div>
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
