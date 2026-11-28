'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { adminDebtApi } from '@/lib/api/debt';
import { getAccessToken } from '@/lib/auth/token';
import { dateOnly, money } from '@/lib/finance';

/** Công nợ giảng viên (14/11/2026) cho admin: danh sách người đang nợ, bậc hạn chế, xóa nợ (nền tảng chịu) kèm lý do bắt buộc — làm ngay trong dòng, không popup. */
export function DebtsPanel() {
  const t = useTranslations('admin.payouts.debts');
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'finance', 'debts'],
    queryFn: () => adminDebtApi.list(),
    enabled: !!getAccessToken(),
  });
  const [openId, setOpenId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const writeOff = useMutation({
    mutationFn: (v: { id: number; reason: string }) => adminDebtApi.writeOff(v.id, v.reason),
    onSuccess: () => {
      toast.success(t('done'));
      setOpenId(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'finance', 'debts'] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('error')),
  });

  if (isLoading || !data || data.length === 0) return null;
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
      <h2 className="m-0 font-display text-base font-bold text-ink">{t('title', { count: data.length })}</h2>
      <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
        {data.map((d) => (
          <li key={d.instructorId} className="flex flex-col gap-2 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold text-ink">{d.name}</div>
                <div className="text-xs text-ink-muted">
                  {t('meta', { email: d.email, since: dateOnly(d.debtSince), days: d.daysInDebt, level: d.level === 2 ? t('level2') : d.level === 3 ? t('level3') : t('level1') })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-danger">{money(d.debtAmount)}</span>
                {openId !== d.instructorId && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(d.instructorId);
                      setReason('');
                    }}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
                  >
                    {t('writeOff')}
                  </button>
                )}
              </div>
            </div>
            {openId === d.instructorId && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface p-3">
                <input
                  value={reason}
                  maxLength={300}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('reasonPh')}
                  aria-label={t('reasonLabel')}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised p-2 text-sm text-ink outline-none focus:border-accent"
                />
                <button
                  type="button"
                  disabled={writeOff.isPending || !reason.trim()}
                  onClick={() => writeOff.mutate({ id: d.instructorId, reason: reason.trim() })}
                  className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {t('confirm')}
                </button>
                <button type="button" onClick={() => setOpenId(null)} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink">
                  {t('cancel')}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
