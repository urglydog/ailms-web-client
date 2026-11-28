'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { useEditAccount, useLinkAccount, usePayoutAccounts, usePayoutBanks, useRemoveAccount, useSetPrimaryAccount } from '@/hooks/useFinance';
import { ApiError } from '@/lib/api/client';
import { MAX_PAYOUT_ACCOUNTS, type FinanceSummary, type PayoutAccount, type PayoutBank } from '@/types/finance';

const INPUT = 'w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent';

interface AccountFormProps {
  banks: PayoutBank[];
  /** Có `account` = đang sửa tài khoản đó; không có = thêm mới. */
  account?: PayoutAccount;
  pending: boolean;
  onSubmit: (values: { bankCode: string; accountNumber: string; holderName: string }) => void;
  onCancel: () => void;
}

/** Form dùng chung cho thêm mới và sửa — hiển thị NGAY TRONG thẻ (không popup). */
function AccountForm({ banks, account, pending, onSubmit, onCancel }: AccountFormProps) {
  const t = useTranslations('instructor.payoutAccount');
  const [bankCode, setBankCode] = useState(account?.bankCode ?? '');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState(account?.holderName ?? '');
  const digits = accountNumber.replace(/\s/g, '');
  const isEdit = !!account;

  const numberOk = isEdit ? digits === '' || /^[0-9]{6,20}$/.test(digits) : /^[0-9]{6,20}$/.test(digits);
  const valid = bankCode !== '' && numberOk && holderName.trim().length > 1;
  // Đổi ngân hàng hoặc nhập số mới thì phải xác nhận qua email; chỉ đổi tên chủ tài khoản thì áp dụng ngay.
  const needsEmail = !isEdit || bankCode !== account.bankCode || digits !== '';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit({ bankCode, accountNumber: digits, holderName: holderName.trim() });
      }}
      className="flex flex-col gap-3"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">{t('bank')}</span>
        <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className={INPUT}>
          <option value="">{t('pickBank')}</option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>{b.name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">{t('accountNumber')}</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          maxLength={25}
          placeholder={isEdit ? t('keepNumberPlaceholder', { mask: account.accountMask }) : undefined}
          className={`${INPUT} font-mono`}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">{t('holderName')}</span>
        <input
          type="text"
          autoComplete="off"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          maxLength={100}
          placeholder="NGUYEN VAN A"
          className={INPUT}
        />
        <span className="text-xs text-ink-muted">{t('holderHint')}</span>
      </label>
      <p className="m-0 text-xs text-ink-muted">
        {needsEmail
          ? t('needsEmailNote')
          : t('noEmailNote')}
      </p>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!valid || pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {pending ? t('sending') : needsEmail ? t('sendConfirm') : t('save')}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink">
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

/**
 * Tài khoản nhận tiền (tối đa 5): xem danh sách (chỉ 4 số cuối), thêm mới, sửa, đặt mặc định, gỡ — tất cả thao tác ngay trên trang,
 * không popup. Thêm mới và đổi ngân hàng/số tài khoản cần xác nhận qua email; không khóa rút sau khi đổi.
 */
export function PayoutAccountCard({ summary }: { summary: FinanceSummary }) {
  const t = useTranslations('instructor.payoutAccount');
  const { data: accounts } = usePayoutAccounts();
  const { data: banks } = usePayoutBanks();
  const link = useLinkAccount();
  const edit = useEditAccount();
  const setPrimary = useSetPrimaryAccount();
  const remove = useRemoveAccount();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);

  const list = accounts ?? [];
  const activeCount = list.filter((a) => a.status === 'ACTIVE').length;
  const canAdd = summary.cryptoConfigured && activeCount < MAX_PAYOUT_ACCOUNTS;
  const onError = (fallback: string) => (err: unknown) => toast.error(err instanceof ApiError ? err.message : fallback);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 font-display text-base font-bold text-ink">
          {t('title')}{' '}
          <span className="text-sm font-medium text-ink-muted">({activeCount}/{MAX_PAYOUT_ACCOUNTS})</span>
        </h2>
        {canAdd && !adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-sm font-semibold text-accent-dark hover:underline">
            {t('add')}
          </button>
        )}
      </div>

      {list.length === 0 && !adding && (
        <p className="m-0 text-sm text-ink-muted">
          {summary.cryptoConfigured ? t('emptyConfigured') : t('emptyNotConfigured')}
        </p>
      )}

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {list.map((a) => (
          <li key={a.id} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4 shadow-md">
            {editingId === a.id ? (
              <AccountForm
                banks={banks ?? []}
                account={a}
                pending={edit.isPending}
                onCancel={() => setEditingId(null)}
                onSubmit={(values) =>
                  edit.mutate(
                    { id: a.id, req: { bankCode: values.bankCode, accountNumber: values.accountNumber || undefined, holderName: values.holderName } },
                    {
                      onSuccess: () => {
                        toast.success(
                          a.status === 'ACTIVE' && values.accountNumber === '' && values.bankCode === a.bankCode
                            ? t('toast.nameUpdated')
                            : t('toast.confirmSent'),
                        );
                        setEditingId(null);
                      },
                      onError: onError(t('toast.editFailed')),
                    },
                  )
                }
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-ink">
                    {a.bankName} {a.accountMask}
                  </div>
                  <span className="flex items-center gap-2">
                    {a.primary && <span className="rounded-full bg-tint px-2.5 py-1 text-xs font-bold text-accent-dark">{t('badge.default')}</span>}
                    {a.status === 'PENDING_CONFIRM' && (
                      <span className="rounded-full border border-warning px-2.5 py-1 text-xs font-medium text-ink">{t('badge.pending')}</span>
                    )}
                  </span>
                </div>
                <div className="text-sm text-ink-muted">{t('holderLabel', { name: a.holderName })}</div>
                {a.status === 'PENDING_CONFIRM' && (
                  <div className="text-xs text-ink">
                    {a.replacesAccountId !== null ? t('pendingReplace') : t('pendingNew')}
                  </div>
                )}
                {a.nameMatchStatus === 'MISMATCH' && (
                  <div className="text-xs text-danger">
                    {t('mismatch')}
                  </div>
                )}

                {confirmRemoveId === a.id ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-danger/5 px-3 py-2 text-sm text-ink">
                    <span>{t('removeConfirm')}</span>
                    <button
                      type="button"
                      disabled={remove.isPending}
                      onClick={() =>
                        remove.mutate(a.id, {
                          onSuccess: () => {
                            toast.success(t('toast.removed'));
                            setConfirmRemoveId(null);
                          },
                          onError: onError(t('toast.removeFailed')),
                        })
                      }
                      className="rounded-lg bg-danger px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {t('remove')}
                    </button>
                    <button type="button" onClick={() => setConfirmRemoveId(null)} className="rounded-lg border border-line px-3 py-1 text-xs font-semibold text-ink-muted hover:text-ink">
                      {t('cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3 pt-1 text-sm font-semibold">
                    {a.status === 'ACTIVE' && !a.primary && (
                      <button
                        type="button"
                        disabled={setPrimary.isPending}
                        onClick={() =>
                          setPrimary.mutate(a.id, {
                            onSuccess: () => toast.success(t('toast.defaultSet')),
                            onError: onError(t('toast.defaultFailed')),
                          })
                        }
                        className="text-accent-dark hover:underline disabled:opacity-50"
                      >
                        {t('setDefault')}
                      </button>
                    )}
                    {summary.cryptoConfigured && (
                      <button type="button" onClick={() => setEditingId(a.id)} className="text-accent-dark hover:underline">
                        {t('edit')}
                      </button>
                    )}
                    <button type="button" onClick={() => setConfirmRemoveId(a.id)} className="text-danger hover:underline">
                      {t('remove')}
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}

        {adding && (
          <li className="rounded-xl border border-accent/40 bg-surface p-4 shadow-md">
            <div className="mb-3 text-sm font-semibold text-ink">{t('addNew')}</div>
            <AccountForm
              banks={banks ?? []}
              pending={link.isPending}
              onCancel={() => setAdding(false)}
              onSubmit={(values) =>
                link.mutate(values, {
                  onSuccess: () => {
                    toast.success(t('toast.confirmSent'));
                    setAdding(false);
                  },
                  onError: onError(t('toast.linkFailed')),
                })
              }
            />
          </li>
        )}
      </ul>
    </section>
  );
}
