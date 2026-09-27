'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Award } from 'lucide-react';
import { useMyCertificates } from '@/hooks/useCertificates';

/** "Chứng chỉ của tôi" (doc/DacTa_ChucNangChungChi.md, mục 7) — danh sách chứng chỉ đã cấp,
 * mới nhất lên đầu (`CertificateRepository.findByStudent_IdOrderByIssuedAtDesc`). Chi tiết/tải
 * PDF/chia sẻ nằm ở trang con `/certificates/{certificateCode}`. */
export default function MyCertificatesPage() {
  const { data: certificates, isLoading } = useMyCertificates();

  return (
    <div className="shell py-10">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Chứng chỉ của tôi</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Chứng chỉ được cấp tự động khi bạn hoàn thành 100% một khóa học.
      </p>

      {isLoading ? (
        <div className="text-sm text-ink-muted">Đang tải...</div>
      ) : !certificates || certificates.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-muted">
          Bạn chưa có chứng chỉ nào. Hoàn thành 100% một khóa học để nhận chứng chỉ đầu tiên nhé!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Link
              key={cert.certificateCode}
              href={`/certificates/${cert.certificateCode}`}
              className="card-interactive flex flex-col gap-3 p-5 no-underline hover:no-underline"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Award className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <span className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-ink">
                {cert.courseTitle}
              </span>
              <span className="text-xs text-ink-muted">
                Cấp ngày {format(new Date(cert.issuedAt), 'dd/MM/yyyy')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
