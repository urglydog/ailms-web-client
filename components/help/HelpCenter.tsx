'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, CircleUser, CreditCard, GraduationCap, HelpCircle, MonitorCog, Send, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SupportTicketForm } from '@/components/help/SupportTicketForm';
import type { SupportCategory } from '@/types/domain';

const CATEGORIES: { id: SupportCategory; icon: LucideIcon }[] = [
  { id: 'ACCOUNT', icon: CircleUser },
  { id: 'PAYMENT', icon: CreditCard },
  { id: 'COURSE', icon: GraduationCap },
  { id: 'EXAM', icon: ShieldCheck },
  { id: 'TECHNICAL', icon: MonitorCog },
  { id: 'OTHER', icon: HelpCircle },
];

interface Faq {
  q: string;
  a: string;
}

/** Chủ đề ticket đang soạn. `subject` có giá trị = tiêu đề đã chốt theo mục người dùng chọn (khóa, không cho sửa);
 * không có = khách tự nhập tiêu đề. */
interface Topic {
  category: SupportCategory;
  subject?: string;
}

const SUBJECT_MAX = 200;

function parseCategory(value: string | null): SupportCategory | null {
  return CATEGORIES.find((c) => c.id === value)?.id ?? null;
}

/** Trung tâm trợ giúp: chọn nhóm → chọn vấn đề cụ thể (FAQ) → "Gửi yêu cầu" ngay trên chính vấn đề đó, tiêu đề
 * ticket tự điền theo các mục đã chọn, người dùng chỉ mô tả thêm. FAQ là nội dung tĩnh trong i18n (không có bảng DB). */
export function HelpCenter() {
  const t = useTranslations('supportHelp');
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<SupportCategory | null>(parseCategory(searchParams.get('category')));
  const [topic, setTopic] = useState<Topic | null>(null);
  const formRef = useRef<HTMLElement>(null);

  const faqs = selected ? (t.raw(`faq.${selected}`) as Faq[]) : [];

  useEffect(() => {
    if (topic) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [topic]);

  const buildSubject = (category: SupportCategory, issue: string) => `${t(`categories.${category}.title`)} › ${issue}`.slice(0, SUBJECT_MAX);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-14 sm:px-8">
      <header>
        <h1 className="m-0 font-display text-[28px] font-bold text-ink">{t('title')}</h1>
        <p className="mt-3 text-[15px] leading-[1.7] text-ink-muted">{t('subtitle')}</p>
      </header>

      <section aria-labelledby="help-pick" className="flex flex-col gap-3">
        <h2 id="help-pick" className="m-0 font-display text-base font-bold text-ink">{t('pickCategory')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CATEGORIES.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={selected === id}
              onClick={() => {
                setSelected(id);
                setTopic(null);
              }}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                selected === id ? 'border-accent bg-tint' : 'border-line bg-white hover:bg-surface'
              }`}
            >
              <Icon size={20} aria-hidden className="mt-0.5 shrink-0 text-accent" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-ink">{t(`categories.${id}.title`)}</span>
                <span className="text-xs text-ink-muted">{t(`categories.${id}.desc`)}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <section aria-labelledby="help-faq" className="flex flex-col gap-3">
          <h2 id="help-faq" className="m-0 font-display text-base font-bold text-ink">{t('faqTitle')}</h2>
          <div className="flex flex-col divide-y divide-line-soft rounded-xl border border-line bg-white">
            {faqs.map((faq) => (
              <details key={faq.q} className="group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink">
                  {faq.q}
                  <ChevronDown size={16} aria-hidden className="shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="m-0 mt-2 text-sm leading-[1.7] text-ink-muted">{faq.a}</p>
                <button
                  type="button"
                  onClick={() => setTopic({ category: selected, subject: buildSubject(selected, faq.q) })}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-accent-dark hover:bg-tint"
                >
                  <Send size={13} aria-hidden />
                  {t('requestThis')}
                </button>
              </details>
            ))}
            <div className="p-4">
              <button
                type="button"
                onClick={() => setTopic({ category: selected, subject: buildSubject(selected, t('otherLabel')) })}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-accent-dark hover:bg-tint"
              >
                <Send size={13} aria-hidden />
                {t('otherInGroup')}
              </button>
            </div>
          </div>
        </section>
      )}

      <section ref={formRef} aria-labelledby="help-still" className="flex scroll-mt-24 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="help-still" className="m-0 font-display text-base font-bold text-ink">{t('stillNeedHelp')}</h2>
          {!topic && (
            <button
              type="button"
              onClick={() => setTopic({ category: selected ?? 'OTHER' })}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
            >
              {t('openForm')}
            </button>
          )}
          {topic && (
            <button type="button" onClick={() => setTopic(null)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-ink-muted hover:bg-tint">
              {t('closeForm')}
            </button>
          )}
        </div>
        {topic && <SupportTicketForm key={`${topic.category}|${topic.subject ?? ''}`} initialCategory={topic.category} lockedSubject={topic.subject} />}
      </section>
    </div>
  );
}
