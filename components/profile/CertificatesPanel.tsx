'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { CertificatePreview } from '@/components/certificate/CertificatePreview';
import {
  certificateTopics,
  filterByTopic,
  sortCertificates,
  type CertificateSortBy,
} from '@/lib/profile/model';
import type { PublicCertificate } from '@/types/domain';

const SORTS: CertificateSortBy[] = ['newest', 'oldest', 'topic', 'title'];

interface CertificatesPanelProps {
  certificates: PublicCertificate[];
  isOwnProfile: boolean;
}

export function CertificatesPanel({ certificates, isOwnProfile }: CertificatesPanelProps) {
  const t = useTranslations('profile');
  const [topic, setTopic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<CertificateSortBy>('newest');

  const topics = useMemo(() => certificateTopics(certificates), [certificates]);
  const visible = useMemo(
    () => sortCertificates(filterByTopic(certificates, topic), sortBy),
    [certificates, topic, sortBy],
  );

  if (certificates.length === 0) {
    return <p className="text-sm text-ink-muted">{t('emptyCertificates')}</p>;
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <TopicChip label={t('certs.all')} active={topic === null} onClick={() => setTopic(null)} />
          {topics.map((name) => (
            <TopicChip key={name} label={name} active={topic === name} onClick={() => setTopic(name)} />
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          {t('certs.sortLabel')}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as CertificateSortBy)}
            className="rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
          >
            {SORTS.map((value) => (
              <option key={value} value={value}>
                {t(`certs.sort.${value}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((cert) => (
          <CertificateCard key={cert.certificateCode} certificate={cert} isOwnProfile={isOwnProfile} />
        ))}
      </div>
    </>
  );
}

function TopicChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active ? 'border-accent bg-accent text-white' : 'border-line bg-white text-ink-muted hover:border-accent hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

/** Chính chủ vào trang chi tiết (có tải PDF, LinkedIn); người khác chỉ vào trang xác thực
 * công khai (BR-CERT-06). */
function CertificateCard({ certificate, isOwnProfile }: { certificate: PublicCertificate; isOwnProfile: boolean }) {
  const t = useTranslations('profile');
  const href = isOwnProfile ? `/certificates/${certificate.certificateCode}` : `/verify/${certificate.certificateCode}`;
  return (
    <Link
      href={href}
      target={isOwnProfile ? undefined : '_blank'}
      rel={isOwnProfile ? undefined : 'noopener noreferrer'}
      className="card-interactive flex flex-col overflow-hidden no-underline hover:no-underline"
    >
      <CertificatePreview certificate={certificate} interactive={false} />
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="line-clamp-2 min-h-[38px] font-display text-sm font-semibold leading-snug text-ink">
          {certificate.courseTitle}
        </span>
        <span className="text-xs text-ink-muted">{certificate.courseCategoryName}</span>
        <span className="mt-1 text-[12.5px] font-semibold text-ink-muted">
          {t('certs.issuedOn', { date: format(new Date(certificate.issuedAt), 'dd/MM/yyyy') })}
        </span>
      </div>
    </Link>
  );
}
