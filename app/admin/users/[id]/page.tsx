'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, ApiError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { AdminUserDetail, ResetLinkRes } from '@/types/domain';

type PendingAction = 'lock' | 'unlock' | 'ai-lock' | 'ai-unlock' | 'spam-flag' | 'spam-unflag' | null;

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const t = useTranslations('admin.userDetail');
  const queryClient = useQueryClient();
  const token = getAccessToken() ?? '';
  const [spamReason, setSpamReason] = useState('');
  const [resetLink, setResetLink] = useState<ResetLinkRes | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'user-detail', id],
    queryFn: () => api.get<AdminUserDetail>(`/api/v1/users/${id}`, { token }),
    enabled: !!token,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const toggleBlock = useMutation({
    mutationFn: () =>
      api.put(`/api/v1/users/${id}`, { fullName: user!.fullName, role: user!.role, isActive: !user!.isActive }, { token }),
    onSuccess: () => {
      toast.success(user!.isActive ? t('lockedToast') : t('unlockedToast'));
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('genericError')),
    onSettled: () => setPending(null),
  });

  const toggleAiLock = useMutation({
    mutationFn: () => api.put(`/api/v1/admin/users/${id}/toggle-ai-lock?isLocked=${!user!.isAiLocked}`, undefined, { token }),
    onSuccess: () => {
      toast.success(user!.isAiLocked ? t('aiUnlockedToast') : t('aiLockedToast'));
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('genericError')),
    onSettled: () => setPending(null),
  });

  const setSpamFlag = useMutation({
    mutationFn: (flagged: boolean) => api.put(`/api/v1/admin/users/${id}/spam-flag`, { flagged, reason: spamReason }, { token }),
    onSuccess: (_data, flagged) => {
      toast.success(flagged ? t('spamFlagSuccess') : t('spamUnflagSuccess'));
      setSpamReason('');
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('genericError')),
    onSettled: () => setPending(null),
  });

  const sendResetLink = useMutation({
    mutationFn: () => api.post<ResetLinkRes>(`/api/v1/admin/users/${id}/send-reset-link`, undefined, { token }),
    onSuccess: setResetLink,
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('genericError')),
  });

  const copyResetLink = async () => {
    if (!resetLink) return;
    await navigator.clipboard.writeText(resetLink.resetLink);
    toast.success(t('linkCopied'));
  };

  if (isLoading || !user) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const confirmCopy: Record<Exclude<PendingAction, null>, { title: string; body: string; confirmLabel: string; tone: 'danger' | 'primary' }> = {
    lock: { title: t('confirm.lockTitle'), body: t('confirm.lockBody'), confirmLabel: t('profile.lock'), tone: 'danger' },
    unlock: { title: t('confirm.unlockTitle'), body: t('confirm.unlockBody'), confirmLabel: t('profile.unlock'), tone: 'primary' },
    'ai-lock': { title: t('confirm.aiLockTitle'), body: t('confirm.aiLockBody'), confirmLabel: t('aiLock.lock'), tone: 'danger' },
    'ai-unlock': { title: t('confirm.aiUnlockTitle'), body: t('confirm.aiUnlockBody'), confirmLabel: t('aiLock.unlock'), tone: 'primary' },
    'spam-flag': { title: t('confirm.spamFlagTitle'), body: t('confirm.spamFlagBody'), confirmLabel: t('spam.flag'), tone: 'danger' },
    'spam-unflag': { title: t('confirm.spamUnflagTitle'), body: t('confirm.spamUnflagBody'), confirmLabel: t('spam.unflag'), tone: 'primary' },
  };

  const runConfirmed = () => {
    switch (pending) {
      case 'lock':
      case 'unlock':
        toggleBlock.mutate();
        break;
      case 'ai-lock':
      case 'ai-unlock':
        toggleAiLock.mutate();
        break;
      case 'spam-flag':
        setSpamFlag.mutate(true);
        break;
      case 'spam-unflag':
        setSpamFlag.mutate(false);
        break;
    }
  };

  return (
    <>
      <PageHeader
        title={user.fullName}
        subtitle={user.email}
        action={
          <Link href="/admin/users" className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-tint">
            <ArrowLeft size={14} aria-hidden />
            {t('back')}
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5 shadow-sm">
          <h2 className="m-0 font-display text-[15px] font-bold text-ink">{t('profile.title')}</h2>
          <Row label={t('profile.role')} value={user.role} />
          <Row label={t('profile.authProvider')} value={user.authProvider} />
          <Row label={t('profile.createdAt')} value={new Date(user.createdAt).toLocaleString('vi-VN')} />
          <Row
            label={t('profile.status')}
            value={
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${user.isActive ? 'text-success-ink' : 'text-danger'}`}>
                <span aria-hidden className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-success' : 'bg-danger'}`} />
                {user.isActive ? t('profile.active') : t('profile.locked')}
              </span>
            }
          />
          <button
            type="button"
            disabled={toggleBlock.isPending}
            onClick={() => setPending(user.isActive ? 'lock' : 'unlock')}
            className={`mt-1 w-fit rounded-lg px-3 py-1.5 text-xs font-bold ${user.isActive ? 'text-danger hover:bg-danger/10' : 'text-success-ink hover:bg-success-tint'}`}
          >
            {user.isActive ? t('profile.lock') : t('profile.unlock')}
          </button>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5 shadow-sm">
          <h2 className="m-0 font-display text-[15px] font-bold text-ink">{t('aiLock.title')}</h2>
          <Row
            label={t('aiLock.status')}
            value={user.isAiLocked ? t('aiLock.locked') : t('aiLock.active')}
          />
          <button
            type="button"
            disabled={toggleAiLock.isPending}
            onClick={() => setPending(user.isAiLocked ? 'ai-unlock' : 'ai-lock')}
            className="w-fit rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink hover:bg-tint"
          >
            {user.isAiLocked ? t('aiLock.unlock') : t('aiLock.lock')}
          </button>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5 shadow-sm">
          <h2 className="m-0 font-display text-[15px] font-bold text-ink">{t('spam.title')}</h2>
          <p className="m-0 text-xs text-ink-muted">{t('spam.hint')}</p>
          {user.isSpamFlagged ? (
            <>
              <Row label={t('spam.reason')} value={user.spamFlagReason || t('spam.none')} />
              <button
                type="button"
                disabled={setSpamFlag.isPending}
                onClick={() => setPending('spam-unflag')}
                className="w-fit rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink hover:bg-tint"
              >
                {t('spam.unflag')}
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                value={spamReason}
                onChange={(e) => setSpamReason(e.target.value)}
                placeholder={t('spam.reasonPh')}
                className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent"
              />
              <button
                type="button"
                disabled={setSpamFlag.isPending || !spamReason.trim()}
                onClick={() => setPending('spam-flag')}
                className="w-fit rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {t('spam.flag')}
              </button>
            </>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5 shadow-sm">
          <h2 className="m-0 font-display text-[15px] font-bold text-ink">{t('resetLink.title')}</h2>
          <p className="m-0 text-xs text-ink-muted">{t('resetLink.hint')}</p>
          <button
            type="button"
            disabled={sendResetLink.isPending}
            onClick={() => sendResetLink.mutate()}
            className="w-fit rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {sendResetLink.isPending ? t('resetLink.generating') : t('resetLink.generate')}
          </button>
          {resetLink && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <code className="break-all text-[12px] text-ink">{resetLink.resetLink}</code>
                <button type="button" onClick={copyResetLink} aria-label={t('resetLink.copy')} className="shrink-0 rounded-lg p-1.5 text-ink-muted hover:bg-tint hover:text-ink">
                  <Copy size={14} aria-hidden />
                </button>
              </div>
              <span className="text-[11px] text-ink-muted">{t('resetLink.expiresAt', { time: new Date(resetLink.expiresAt).toLocaleTimeString('vi-VN') })}</span>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={pending !== null}
        {...(pending ? confirmCopy[pending] : { title: '', body: '', confirmLabel: '' })}
        cancelLabel={t('confirm.cancel')}
        onConfirm={runConfirmed}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
