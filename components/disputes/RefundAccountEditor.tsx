'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { disputesApi } from '@/lib/api/disputes';
import type { DisputeRes } from '@/types/domain';
import type { PayoutBank } from '@/types/finance';

const INPUT = 'w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent';

interface Props {
  dispute: DisputeRes;
  /** Nhận khiếu nại đã cập nhật từ máy chủ (trạng thái khoản hoàn có thể đã đổi). */
  onUpdated: (updated: DisputeRes) => void;
}

/**
 * Học viên cập nhật tài khoản nhận hoàn tiền sau khi đã gửi khiếu nại (16/11/2026). Máy chủ quyết định được sửa hay không
 * (`canEditRefundAccount`): chỉ hiện khi được phép; đang khóa thì chỉ hiện lý do. Cần nhập lại số tài khoản và xác nhận chính chủ.
 */
export function RefundAccountEditor({ dispute, onUpdated }: Props) {
  const t = useTranslations('refundAccount');
  const [banks, setBanks] = useState<PayoutBank[]>([]);
  const [open, setOpen] = useState(dispute.refundTransferStatus === 'AWAITING_ACCOUNT');
  const [bankCode, setBankCode] = useState('');
  const [number, setNumber] = useState('');
  const [numberAgain, setNumberAgain] = useState('');
  const [holder, setHolder] = useState('');
  const [own, setOwn] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || banks.length > 0) return;
    disputesApi.banks().then(setBanks).catch(() => setBanks([]));
  }, [open, banks.length]);

  const digits = number.replace(/\s/g, '');
  const problem = !bankCode
    ? t('pickBank')
    : !/^[0-9]{6,20}$/.test(digits)
      ? t('digitsOnly')
      : digits !== numberAgain.replace(/\s/g, '')
        ? t('mismatch')
        : !holder.trim()
          ? t('needHolder')
          : !own
            ? t('needOwn')
            : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (problem) return;
    setSaving(true);
    try {
      const updated = await disputesApi.updateRefundAccount(dispute.id, {
        refundBankCode: bankCode,
        refundAccountNumber: digits,
        refundAccountHolder: holder.trim(),
        refundAccountOwnConfirmed: own,
      });
      toast.success(t('updated'));
      setOpen(false);
      setNumber('');
      setNumberAgain('');
      setOwn(false);
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('updateError'));
    } finally {
      setSaving(false);
    }
  };

  // Máy chủ đang khóa việc sửa: chỉ nói lý do (nếu có), không hiện form.
  if (!dispute.canEditRefundAccount) {
    return dispute.refundAccountHint ? <p className="m-0 text-xs text-ink-muted">{dispute.refundAccountHint}</p> : null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-3">
      {dispute.refundAccountHint && <p className="m-0 text-xs text-ink">{dispute.refundAccountHint}</p>}
      {dispute.refundAccountSummary && <p className="m-0 text-xs text-ink-muted">{t('declared', { summary: dispute.refundAccountSummary })}</p>}
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="w-fit text-sm font-semibold text-accent hover:text-accent-dark">
          {t('change')}
        </button>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">{t('bank')}</span>
            <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className={INPUT}>
              <option value="">{t('chooseBank')}</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink">{t('number')}</span>
              <input type="text" inputMode="numeric" autoComplete="off" maxLength={25} value={number} onChange={(e) => setNumber(e.target.value)} className={`${INPUT} font-mono`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink">{t('numberAgain')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={25}
                value={numberAgain}
                onChange={(e) => setNumberAgain(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                className={`${INPUT} font-mono`}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">{t('holder')}</span>
            <input type="text" autoComplete="off" maxLength={100} value={holder} onChange={(e) => setHolder(e.target.value)} className={INPUT} />
          </label>
          <label className="flex items-start gap-2 text-sm text-ink">
            <input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} className="mt-1" />
            <span>{t('own')}</span>
          </label>
          {problem && <p className="m-0 text-xs text-ink-muted">{problem}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving || problem !== null}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {saving ? t('saving') : t('save')}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold text-ink-muted hover:text-ink">
              {t('cancel')}
            </button>
            <Link href="/help" className="text-xs font-semibold text-accent hover:text-accent-dark">
              {t('help')}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
