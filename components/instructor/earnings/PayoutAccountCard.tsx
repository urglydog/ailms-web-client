'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useLinkAccount, usePayoutBanks } from '@/hooks/useFinance';
import { ApiError } from '@/lib/api/client';
import { dateTime } from '@/lib/finance';
import type { FinanceSummary } from '@/types/finance';

/** Tài khoản nhận tiền: xem tài khoản hiện tại (chỉ 4 số cuối) và liên kết/đổi tài khoản (cần xác nhận qua email). */
export function PayoutAccountCard({ summary }: { summary: FinanceSummary }) {
  const account = summary.account;
  const { data: banks } = usePayoutBanks();
  const link = useLinkAccount();
  const [editing, setEditing] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');

  const showForm = editing || !account;
  const digits = accountNumber.replace(/\s/g, '');
  const valid = bankCode !== '' && /^[0-9]{6,20}$/.test(digits) && holderName.trim().length > 1;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    link.mutate(
      { bankCode, accountNumber: digits, holderName: holderName.trim() },
      {
        onSuccess: () => {
          toast.success('Đã gửi email xác nhận. Hãy mở email và bấm liên kết trong vòng 30 phút.');
          setEditing(false);
          setBankCode('');
          setAccountNumber('');
          setHolderName('');
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không liên kết được tài khoản.'),
      },
    );
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 font-display text-base font-bold text-ink">Tài khoản nhận tiền</h2>
        {account && !editing && summary.cryptoConfigured && (
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-accent-dark hover:underline">
            Đổi tài khoản
          </button>
        )}
      </div>

      {account && (
        <div className="flex flex-col gap-1 rounded-lg bg-surface p-3 text-sm">
          <div className="font-semibold text-ink">
            {account.bankName} {account.accountMask}
          </div>
          <div className="text-ink-muted">Chủ tài khoản: {account.holderName}</div>
          {account.status === 'PENDING_CONFIRM' && (
            <div className="text-ink">Đang chờ bạn xác nhận qua email (liên kết có hiệu lực 30 phút).</div>
          )}
          {account.status === 'ACTIVE' && account.usableFrom && new Date(account.usableFrom) > new Date() && (
            <div className="text-ink">Tài khoản mới đổi sẽ dùng để rút tiền được từ {dateTime(account.usableFrom)}.</div>
          )}
          {account.nameMatchStatus === 'MISMATCH' && (
            <div className="text-danger">
              Tên chủ tài khoản chưa khớp với tên đã xác minh của bạn; quản trị viên sẽ kiểm tra kỹ trước khi chuyển tiền.
            </div>
          )}
        </div>
      )}

      {showForm && summary.cryptoConfigured && (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Ngân hàng</span>
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">Chọn ngân hàng</option>
              {(banks ?? []).map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Số tài khoản</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              maxLength={25}
              className="w-full rounded-lg border border-line bg-surface-raised p-2.5 font-mono text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Tên chủ tài khoản</span>
            <input
              type="text"
              autoComplete="off"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              maxLength={100}
              placeholder="NGUYEN VAN A"
              className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
            />
            <span className="text-xs text-ink-muted">Phải trùng với tên đã xác minh của bạn (viết hoa không dấu cũng được).</span>
          </label>
          <p className="m-0 text-xs text-ink-muted">
            Chúng tôi gửi email xác nhận tới địa chỉ của bạn. Nếu bạn đang đổi tài khoản, tài khoản mới chỉ dùng để rút tiền được sau 3 ngày
            kể từ lúc xác nhận.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!valid || link.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {link.isPending ? 'Đang gửi...' : 'Gửi email xác nhận'}
            </button>
            {account && (
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink">
                Hủy
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
