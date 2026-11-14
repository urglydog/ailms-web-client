'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { adminDebtApi } from '@/lib/api/debt';
import { getAccessToken } from '@/lib/auth/token';
import { dateOnly, money } from '@/lib/finance';

const LEVEL_LABEL: Record<number, string> = { 1: 'Đang nợ', 2: 'Hạn chế xuất bản/quảng bá', 3: 'Ngừng bán mới' };

/** Công nợ giảng viên (14/11/2026) cho admin: danh sách người đang nợ, bậc hạn chế, xóa nợ (nền tảng chịu) kèm lý do bắt buộc — làm ngay trong dòng, không popup. */
export function DebtsPanel() {
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
      toast.success('Đã xóa nợ, giảng viên được thông báo.');
      setOpenId(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'finance', 'debts'] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không xóa được nợ.'),
  });

  if (isLoading || !data || data.length === 0) return null;
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
      <h2 className="m-0 font-display text-base font-bold text-ink">Công nợ giảng viên ({data.length})</h2>
      <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
        {data.map((d) => (
          <li key={d.instructorId} className="flex flex-col gap-2 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold text-ink">{d.name}</div>
                <div className="text-xs text-ink-muted">
                  {d.email} · nợ từ {dateOnly(d.debtSince)} ({d.daysInDebt} ngày) · {LEVEL_LABEL[d.level] ?? 'Đang nợ'}
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
                    Xóa nợ
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
                  placeholder="Lý do xóa nợ (bắt buộc, giảng viên sẽ nhận được)"
                  aria-label="Lý do xóa nợ"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised p-2 text-sm text-ink outline-none focus:border-accent"
                />
                <button
                  type="button"
                  disabled={writeOff.isPending || !reason.trim()}
                  onClick={() => writeOff.mutate({ id: d.instructorId, reason: reason.trim() })}
                  className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  Xác nhận xóa nợ
                </button>
                <button type="button" onClick={() => setOpenId(null)} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink">
                  Hủy
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
