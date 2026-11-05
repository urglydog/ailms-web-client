'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ApiError } from '@/lib/api/client';
import { supportApi } from '@/lib/api/support';
import type { SupportEmailContent, SupportSectionType, SupportStatus, SupportTicketAdminRes } from '@/types/domain';

const MAX_SECTIONS = 8;
const MAX_ITEMS = 10;
const TEMPLATE_IDS = [
  'received', 'needMoreInfo', 'resolved', 'cannotReproduce', 'duplicate', 'outOfScope', 'feedbackThanks',
  'resetPassword', 'googleAccount', 'accountLocked',
  'paymentActivated', 'paymentNotFound', 'refundGuide', 'refundNotEligible', 'couponIssue',
  'courseAccessFixed', 'videoTroubleshoot', 'contentReported',
  'quizReview', 'streakRestored', 'aiKnownIssue', 'aiLockExplained',
  'examIncident', 'proctorFalseFlag', 'certificateIssued', 'certificateIncomplete',
  'communityReport', 'reviewHidden', 'liveIssue', 'instructorRejected', 'instructorPayout',
  'privacyRequest', 'technicalGeneric', 'notificationHelp',
] as const;

/** 1 mục đang soạn — `text` dùng cho đoạn văn, `items` cho danh sách đánh số; giữ cả hai để đổi kiểu mục không mất nội dung. */
interface DraftSection {
  title: string;
  type: SupportSectionType;
  text: string;
  items: string[];
}

interface ReplyTemplate {
  status: SupportStatus;
  sections: { title: string; type: SupportSectionType; text?: string; items?: string[] }[];
}

/** Thay placeholder giống BE (`SupportTicketService.fill`) để bản xem trước khớp đúng email thật. */
function fillPlaceholders(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((out, [key, value]) => out.split(key).join(value), text);
}

const STATUSES: SupportStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
const STATUS_CLASS: Record<SupportStatus, string> = {
  OPEN: 'bg-white text-ink border-warning',
  IN_PROGRESS: 'bg-tint text-accent-dark border-accent/30',
  RESOLVED: 'bg-success-tint text-success-ink border-success/30',
};

/** Hộp thư yêu cầu hỗ trợ của Admin — danh sách ticket, xem nội dung/ảnh, phản hồi (gửi email cho người gửi). */
export default function AdminSupportPage() {
  const t = useTranslations('admin.support');
  const queryClient = useQueryClient();

  const [tickets, setTickets] = useState<SupportTicketAdminRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SupportStatus | 'ALL'>('ALL');
  const [selected, setSelected] = useState<SupportTicketAdminRes | null>(null);
  const [status, setStatus] = useState<SupportStatus>('OPEN');
  const [greeting, setGreeting] = useState('');
  const [intro, setIntro] = useState('');
  const [sections, setSections] = useState<DraftSection[]>([]);
  const [closing, setClosing] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [team, setTeam] = useState('');
  const [includeOriginal, setIncludeOriginal] = useState(true);
  const { data: currentUser } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    supportApi
      .listAdmin(statusFilter === 'ALL' ? undefined : statusFilter)
      .then(setTickets)
      .catch(() => toast.error(t('loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phụ thuộc statusFilter
  }, [statusFilter]);

  const dateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

  const defaults = {
    greeting: t.raw('detail.defaults.greeting') as string,
    intro: t.raw('detail.defaults.intro') as string,
    closing: t.raw('detail.defaults.closing') as string,
    team: t.raw('detail.defaults.team') as string,
  };

  const open = (ticket: SupportTicketAdminRes) => {
    const prev = ticket.adminContent;
    setSelected(ticket);
    setStatus(ticket.status);
    // Mở lại phản hồi đã gửi để chỉnh tiếp; chưa có thì dùng mặc định.
    setGreeting(prev?.greeting ?? defaults.greeting);
    setIntro(prev?.intro ?? defaults.intro);
    setClosing(prev?.closing ?? defaults.closing);
    setSignatureName(prev?.signatureName ?? currentUser?.fullName ?? '');
    setTeam(prev?.signatureTeam ?? defaults.team);
    setIncludeOriginal(prev?.includeOriginal ?? true);
    setSections(
      (prev?.sections ?? []).map((sec) => ({ title: sec.title, type: sec.type, text: sec.text ?? '', items: sec.items ?? [] })),
    );
  };

  const applyTemplate = (id: string) => {
    if (!id) return;
    const tpl = t.raw(`detail.templates.${id}`) as ReplyTemplate;
    setStatus(tpl.status);
    setSections(tpl.sections.map((sec) => ({ title: sec.title, type: sec.type, text: sec.text ?? '', items: [...(sec.items ?? [])] })));
  };

  const updateSection = (index: number, patch: Partial<DraftSection>) =>
    setSections((prev) => prev.map((sec, i) => (i === index ? { ...sec, ...patch } : sec)));

  const moveSection = (index: number, delta: -1 | 1) =>
    setSections((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  /** Mục có nội dung thật (đoạn văn không rỗng / danh sách có ít nhất 1 dòng) — đúng quy tắc BE khi gửi. */
  const filledSections = sections
    .map((sec) => ({
      title: sec.title.trim(),
      type: sec.type,
      text: sec.text.trim(),
      items: sec.items.map((x) => x.trim()).filter(Boolean),
    }))
    .filter((sec) => (sec.type === 'LIST' ? sec.items.length > 0 : sec.text.length > 0));

  const previewVars: Record<string, string> = selected
    ? {
        '{name}': selected.senderName,
        '{code}': selected.code,
        '{subject}': selected.subject,
        '{category}': t(`category.${selected.category}`),
      }
    : {};

  const handleSave = async () => {
    if (!selected) return;
    // Không soạn mục nào = chỉ đổi trạng thái, không gửi email (BE bắt buộc có phản hồi khi đánh dấu "Đã xử lý" lần đầu).
    const content: SupportEmailContent | undefined =
      filledSections.length === 0
        ? undefined
        : {
            greeting,
            intro,
            sections: filledSections.map((sec) => ({
              title: sec.title,
              type: sec.type,
              text: sec.type === 'TEXT' ? sec.text : null,
              items: sec.type === 'LIST' ? sec.items : null,
            })),
            closing,
            signatureName,
            signatureTeam: team,
            includeOriginal,
          };
    setSubmitting(true);
    try {
      await supportApi.update(selected.id, { status, content });
      toast.success(t('detail.saved'));
      setSelected(null);
      fetchTickets();
      queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'open-count'] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('detail.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-line bg-white p-4">
        <label className="flex w-full flex-col gap-1.5 sm:w-56">
          <span className="text-xs font-semibold text-ink-muted">{t('filters.status')}</span>
          <select
            className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SupportStatus | 'ALL')}
          >
            <option value="ALL">{t('filters.all')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-8 text-center text-ink-muted">{t('empty')}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('cols.code')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.sender')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.subject')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.category')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.status')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.time')}</th>
                <th className="px-4 py-3 text-right font-semibold">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-mono text-ink">{ticket.code}</td>
                  <td className="px-4 py-3 text-ink">{ticket.email}</td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-ink-muted" title={ticket.subject}>{ticket.subject}</td>
                  <td className="px-4 py-3 text-ink-muted">{t(`category.${ticket.category}`)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[ticket.status]}`}>{t(`status.${ticket.status}`)}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{dateTime(ticket.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => open(ticket)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-accent-dark hover:bg-tint">
                      {t('view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-ink/40 p-4">
          <div role="dialog" aria-modal="true" aria-label={selected.code} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card-hover">
            <div className="flex items-start justify-between gap-3 border-b border-line p-5">
              <div className="min-w-0">
                <p className="m-0 font-mono text-xs text-ink-muted">{selected.code} · {t(`category.${selected.category}`)}</p>
                <h2 className="m-0 break-words font-display text-base font-bold text-ink">{selected.subject}</h2>
                <p className="m-0 mt-0.5 text-xs text-ink-muted">{selected.email} · {dateTime(selected.createdAt)}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink-muted hover:bg-tint">
                {t('detail.close')}
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-y-auto md:grid-cols-2 md:divide-x md:divide-line">
              <div className="flex flex-col gap-4 p-5 text-sm">
                <div>
                  <p className="m-0 mb-1 text-xs font-semibold text-ink-muted">{t('detail.message')}</p>
                  <p className="m-0 whitespace-pre-wrap break-words text-ink">{selected.message}</p>
                </div>

                <div>
                  <p className="m-0 mb-1.5 text-xs font-semibold text-ink-muted">{t('detail.attachments')}</p>
                  {selected.attachments.length === 0 ? (
                    <p className="m-0 text-xs text-ink-muted">{t('detail.noAttachments')}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selected.attachments.map((a) => (
                        <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border border-line">
                          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh minh chứng từ kho lưu trữ ngoài, cùng cách trang khiếu nại giao dịch */}
                          <img src={a.fileUrl} alt="" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {selected.userId !== null ? (
                  <Link href={`/admin/users/${selected.userId}`} className="w-fit text-xs font-bold text-accent-dark hover:underline">
                    {t('detail.openUser')}
                  </Link>
                ) : (
                  <p className="m-0 text-xs text-ink-muted">{t('detail.noUser')}</p>
                )}

                {selected.adminReply && (
                  <div className="rounded-lg bg-surface p-3">
                    <p className="m-0 mb-1 text-xs font-semibold text-ink-muted">{t('detail.previousReply')}</p>
                    <p className="m-0 whitespace-pre-wrap break-words text-ink">{selected.adminReply}</p>
                  </div>
                )}

                <h3 className="m-0 border-t border-line pt-4 font-display text-sm font-bold text-ink">{t('detail.form')}</h3>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">{t('detail.template')}</span>
                  <select
                    value=""
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent"
                  >
                    <option value="">{t('detail.templatePh')}</option>
                    {TEMPLATE_IDS.map((id) => (
                      <option key={id} value={id}>
                        {t(`detail.templates.${id}.label`)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">{t('detail.status')}</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value as SupportStatus)} className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent">
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(`status.${s}`)}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="m-0 text-xs text-ink-muted">{t.raw('detail.placeholderHint') as string}</p>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">{t('detail.greetingLabel')}</span>
                  <input type="text" maxLength={200} value={greeting} onChange={(e) => setGreeting(e.target.value)} className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent" />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">{t('detail.introLabel')}</span>
                  <textarea rows={2} maxLength={1000} value={intro} onChange={(e) => setIntro(e.target.value)} className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent" />
                </label>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-ink-muted">{t('detail.sectionsLabel')}</span>
                  {sections.map((sec, i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-lg border border-line p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={150}
                          value={sec.title}
                          onChange={(e) => updateSection(i, { title: e.target.value })}
                          placeholder={t('detail.sectionTitlePh')}
                          aria-label={`${t('detail.sectionTitle')} ${i + 1}`}
                          className="min-w-0 flex-1 rounded-lg border border-line bg-white p-2 text-sm font-semibold text-ink outline-none focus:border-accent"
                        />
                        <button type="button" title={t('detail.moveUp')} aria-label={`${t('detail.moveUp')} ${i + 1}`} disabled={i === 0} onClick={() => moveSection(i, -1)} className="shrink-0 rounded p-1.5 text-ink-muted hover:text-ink disabled:opacity-30">
                          <ArrowUp size={14} aria-hidden />
                        </button>
                        <button type="button" title={t('detail.moveDown')} aria-label={`${t('detail.moveDown')} ${i + 1}`} disabled={i === sections.length - 1} onClick={() => moveSection(i, 1)} className="shrink-0 rounded p-1.5 text-ink-muted hover:text-ink disabled:opacity-30">
                          <ArrowDown size={14} aria-hidden />
                        </button>
                        <button type="button" title={t('detail.removeSection')} aria-label={`${t('detail.removeSection')} ${i + 1}`} onClick={() => setSections(sections.filter((_, idx) => idx !== i))} className="shrink-0 rounded p-1.5 text-ink-muted hover:text-danger">
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>

                      <div role="group" aria-label={`${t('detail.typeLabel')} ${i + 1}`} className="flex w-fit overflow-hidden rounded-lg border border-line text-xs font-semibold">
                        {(['TEXT', 'LIST'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            aria-pressed={sec.type === type}
                            onClick={() => updateSection(i, { type })}
                            className={`px-3 py-1.5 ${sec.type === type ? 'bg-accent text-white' : 'bg-white text-ink-muted hover:bg-surface'}`}
                          >
                            {type === 'TEXT' ? t('detail.typeText') : t('detail.typeList')}
                          </button>
                        ))}
                      </div>

                      {sec.type === 'TEXT' ? (
                        <textarea
                          rows={3}
                          maxLength={3000}
                          value={sec.text}
                          onChange={(e) => updateSection(i, { text: e.target.value })}
                          aria-label={`${t('detail.sectionText')} ${i + 1}`}
                          className="w-full rounded-lg border border-line bg-white p-2 text-sm text-ink outline-none focus:border-accent"
                        />
                      ) : (
                        <div className="flex flex-col gap-2">
                          {sec.items.map((item, k) => (
                            <div key={k} className="flex items-start gap-2">
                              <span className="mt-2 w-5 shrink-0 text-right text-xs font-semibold text-ink-muted">{k + 1}.</span>
                              <textarea
                                rows={2}
                                maxLength={500}
                                value={item}
                                onChange={(e) => updateSection(i, { items: sec.items.map((x, idx) => (idx === k ? e.target.value : x)) })}
                                placeholder={t('detail.itemPh', { n: k + 1 })}
                                className="min-w-0 flex-1 rounded-lg border border-line bg-white p-2 text-sm text-ink outline-none focus:border-accent"
                              />
                              <button type="button" title={t('detail.removeItem')} aria-label={`${t('detail.removeItem')} ${k + 1}`} onClick={() => updateSection(i, { items: sec.items.filter((_, idx) => idx !== k) })} className="mt-1 shrink-0 rounded p-1.5 text-ink-muted hover:text-danger">
                                <Trash2 size={14} aria-hidden />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            disabled={sec.items.length >= MAX_ITEMS}
                            title={sec.items.length >= MAX_ITEMS ? t('detail.maxItems') : t('detail.addItem')}
                            onClick={() => updateSection(i, { items: [...sec.items, ''] })}
                            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-surface disabled:opacity-50"
                          >
                            <Plus size={14} aria-hidden />
                            {t('detail.addItem')}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={sections.length >= MAX_SECTIONS}
                    title={sections.length >= MAX_SECTIONS ? t('detail.maxSections') : t('detail.addSection')}
                    onClick={() => setSections([...sections, { title: '', type: 'TEXT', text: '', items: [] }])}
                    className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-surface disabled:opacity-50"
                  >
                    <Plus size={14} aria-hidden />
                    {t('detail.addSection')}
                  </button>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">{t('detail.closingLabel')}</span>
                  <input type="text" maxLength={100} value={closing} onChange={(e) => setClosing(e.target.value)} className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent" />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">{t('detail.signatureNameLabel')}</span>
                    <input type="text" maxLength={100} value={signatureName} onChange={(e) => setSignatureName(e.target.value)} className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">{t('detail.teamLabel')}</span>
                    <input type="text" maxLength={100} value={team} onChange={(e) => setTeam(e.target.value)} className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent" />
                  </label>
                </div>

                <label className="flex items-center gap-2 text-xs text-ink">
                  <input type="checkbox" checked={includeOriginal} onChange={(e) => setIncludeOriginal(e.target.checked)} />
                  {t('detail.includeOriginal')}
                </label>
              </div>

              <div className="flex flex-col gap-3 bg-surface p-5 text-sm">
                <p className="m-0 text-xs font-semibold text-ink-muted">{t('detail.previewTitle')}</p>
                <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 text-[13px] leading-[1.7] text-ink">
                  <p className="m-0 font-bold">{fillPlaceholders(greeting, previewVars)}</p>
                  <p className="m-0 whitespace-pre-wrap break-words text-ink-muted">{fillPlaceholders(intro, previewVars)}</p>
                  <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12px]">
                    <dt className="text-ink-muted">{t('detail.preview.code')}</dt>
                    <dd className="m-0 font-mono font-bold text-accent-dark">{selected.code}</dd>
                    <dt className="text-ink-muted">{t('detail.preview.category')}</dt>
                    <dd className="m-0">{t(`category.${selected.category}`)}</dd>
                    <dt className="text-ink-muted">{t('detail.preview.subject')}</dt>
                    <dd className="m-0 break-words">{selected.subject}</dd>
                    <dt className="text-ink-muted">{t('detail.preview.status')}</dt>
                    <dd className="m-0 font-bold">{t(`status.${status}`)}</dd>
                  </dl>
                  {filledSections.length === 0 ? (
                    <p className="m-0 italic text-ink-faint">{t('detail.preview.empty')}</p>
                  ) : (
                    filledSections.map((sec, i) => (
                      <div key={i}>
                        {sec.title && <p className="m-0 font-bold">{fillPlaceholders(sec.title, previewVars)}</p>}
                        {sec.type === 'LIST' ? (
                          <ol className="m-0 list-decimal pl-5 text-ink-muted">
                            {sec.items.map((item, k) => (
                              <li key={k} className="break-words">{fillPlaceholders(item, previewVars)}</li>
                            ))}
                          </ol>
                        ) : (
                          <p className="m-0 whitespace-pre-wrap break-words text-ink-muted">{fillPlaceholders(sec.text, previewVars)}</p>
                        )}
                      </div>
                    ))
                  )}
                  {includeOriginal && (
                    <div>
                      <p className="m-0 font-bold">{t('detail.preview.original')}</p>
                      <p className="m-0 mt-1 whitespace-pre-wrap break-words rounded-lg bg-surface p-2.5 text-ink-muted">{selected.message}</p>
                    </div>
                  )}
                  <p className="m-0 mt-2">
                    {fillPlaceholders(closing, previewVars)}
                    <br />
                    <strong>{fillPlaceholders(signatureName, previewVars)}</strong>
                    <br />
                    {fillPlaceholders(team, previewVars)}
                  </p>
                  <p className="m-0 border-t border-line pt-2 text-center text-[11px] text-ink-faint">{t('detail.preview.footer')}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-line p-4">
              <button type="button" disabled={submitting} onClick={handleSave} className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
                {submitting ? t('detail.saving') : t('detail.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
