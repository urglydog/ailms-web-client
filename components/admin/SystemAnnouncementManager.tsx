'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { ListSearch } from '@/components/ui/ListSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { useCreateSystemAnnouncement, useDeleteSystemAnnouncement, useRestoreSystemAnnouncement, useRevokeSystemAnnouncement, useSystemAnnouncements, useUpdateSystemAnnouncement } from '@/hooks/useSystemAnnouncements';
import { ApiError } from '@/lib/api/client';
import type { AnnouncementAudience, AnnouncementSeverity, CreateSystemAnnouncementReq, SystemAnnouncement } from '@/types/domain';

const PAGE = 10;

const SEVERITY_OPTIONS: AnnouncementSeverity[] = ['HIGH', 'MEDIUM', 'LOW'];
const AUDIENCE_OPTIONS: AnnouncementAudience[] = ['ALL', 'INSTRUCTOR', 'STUDENT', 'SPECIFIC_USER'];
const DISPATCH_STATUSES = ['PENDING', 'PROCESSING', 'DONE', 'FAILED'];

const SEVERITY_BADGE_CLASS: Record<AnnouncementSeverity, string> = {
  HIGH: 'bg-surface-raised text-danger border-danger/40',
  MEDIUM: 'bg-surface-raised text-ink border-warning',
  LOW: 'bg-line-soft text-ink-muted border-line',
};

/** Thông báo hệ thống từ Admin (26/09/2026, tính năng mới) — phát tán qua job nền Redis
 * (`SystemAnnouncementService` phía backend), form này chỉ tạo bản ghi + đẩy job rồi trả về
 * ngay, KHÔNG chờ gửi xong cho toàn bộ người nhận — xem cột "Trạng thái" ở bảng lịch sử. */
export function SystemAnnouncementManager() {
  const t = useTranslations('admin.announce');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [limit, setLimit] = useState(PAGE);
  const { data: announcements, isLoading } = useSystemAnnouncements(debouncedSearch, limit);
  const createAnnouncement = useCreateSystemAnnouncement();
  const updateAnnouncement = useUpdateSystemAnnouncement();
  const revokeAnnouncement = useRevokeSystemAnnouncement();
  const restoreAnnouncement = useRestoreSystemAnnouncement();
  const deleteAnnouncement = useDeleteSystemAnnouncement();
  const [deleting, setDeleting] = useState<SystemAnnouncement | null>(null);
  const [editing, setEditing] = useState<SystemAnnouncement | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editExpires, setEditExpires] = useState('');
  const [revoking, setRevoking] = useState<SystemAnnouncement | null>(null);

  const openEdit = (a: SystemAnnouncement) => {
    setEditing(a);
    setEditTitle(a.title);
    setEditContent(a.content);
    setEditExpires(a.expiresAt ? a.expiresAt.slice(0, 16) : '');
  };
  const saveEdit = () => {
    if (!editing || !editTitle.trim() || !editContent.trim()) return;
    updateAnnouncement.mutate(
      { id: editing.id, req: { title: editTitle.trim(), content: editContent.trim(), expiresAt: editing.severity === 'HIGH' && editExpires ? new Date(editExpires).toISOString() : null } },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật thông báo, kể cả bản người dùng đã nhận.');
          setEditing(null);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không cập nhật được thông báo. Vui lòng thử lại.'),
      },
    );
  };
  const restore = (a: SystemAnnouncement) =>
    restoreAnnouncement.mutate(a.id, {
      onSuccess: () => toast.success('Đã khôi phục thông báo. Người dùng thấy lại thông báo này.'),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không khôi phục được thông báo. Vui lòng thử lại.'),
    });
  const confirmDelete = () => {
    if (!deleting) return;
    deleteAnnouncement.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Đã xóa thông báo.');
        setDeleting(null);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không xóa được thông báo. Vui lòng thử lại.'),
    });
  };
  const confirmRevoke = () => {
    if (!revoking) return;
    revokeAnnouncement.mutate(revoking.id, {
      onSuccess: () => {
        toast.success('Đã thu hồi thông báo. Người dùng không còn thấy thông báo này.');
        setRevoking(null);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không thu hồi được thông báo. Vui lòng thử lại.'),
    });
  };

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<AnnouncementSeverity>('MEDIUM');
  const [audience, setAudience] = useState<AnnouncementAudience>('ALL');
  const [targetUserId, setTargetUserId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setErrorMessage(null);

    const req: CreateSystemAnnouncementReq = {
      title: title.trim(),
      content: content.trim(),
      severity,
      audience,
      targetUserId: audience === 'SPECIFIC_USER' && targetUserId ? Number(targetUserId) : null,
      expiresAt: severity === 'HIGH' && expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    createAnnouncement.mutate(req, {
      onSuccess: () => {
        setTitle('');
        setContent('');
        setTargetUserId('');
        setExpiresAt('');
      },
      onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : t('form.error')),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('form.title')}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={t('form.titlePh')}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </Field>
          <Field label={t('form.severity')}>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AnnouncementSeverity)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{t(`severity.${opt}`)}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t('form.content')}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={3}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('form.audience')}>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{t(`audience.${opt}`)}</option>
              ))}
            </select>
          </Field>

          {audience === 'SPECIFIC_USER' && (
            <Field label={t('form.userId')}>
              <input
                type="number"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                required
                min={1}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </Field>
          )}

          {severity === 'HIGH' && (
            <Field label={t('form.expires')}>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </Field>
          )}
        </div>

        {errorMessage && (
          <div role="alert" className="rounded-xl border border-danger/40 bg-surface-raised p-3 text-[12.5px] text-danger">{errorMessage}</div>
        )}

        <button
          type="submit"
          disabled={createAnnouncement.isPending}
          className="self-start rounded-full bg-accent px-6 py-2.5 text-[13px] font-bold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {createAnnouncement.isPending ? t('form.sending') : t('form.send')}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-display text-base font-bold text-ink">Lịch sử thông báo</h2>
        <ListSearch label="Tìm thông báo" value={search} onChange={(v) => { setSearch(v); setLimit(PAGE); }} placeholder="Tìm theo tiêu đề hoặc nội dung..." />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface-raised shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-surface text-xs font-bold text-ink-muted uppercase">
            <tr>
              <th className="px-6 py-4">{t('cols.title')}</th>
              <th className="px-6 py-4">{t('cols.severity')}</th>
              <th className="px-6 py-4">{t('cols.audience')}</th>
              <th className="px-6 py-4">{t('cols.status')}</th>
              <th className="px-6 py-4">{t('cols.sent')}</th>
              <th className="px-6 py-4">{t('cols.created')}</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-ink-muted">{t('loading')}</td>
              </tr>
            )}
            {!isLoading && announcements?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-ink-muted">{t('empty')}</td>
              </tr>
            )}
            {announcements?.map((a) => (
              <tr key={a.id} className="hover:bg-surface">
                <td className={`px-6 py-3 font-semibold ${a.revokedAt ? 'text-ink-muted line-through' : 'text-ink'}`}>{a.title}</td>
                <td className="px-6 py-3">
                  <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${SEVERITY_BADGE_CLASS[a.severity]}`}>
                    {t(`sevLabel.${a.severity}`)}
                  </span>
                </td>
                <td className="px-6 py-3 text-ink-muted">
                  {a.audience === 'SPECIFIC_USER' ? t('user', { id: a.targetUserId ?? 0 }) : t(`audience.${a.audience}`)}
                </td>
                <td className="px-6 py-3 text-ink-muted">
                  {a.revokedAt ? 'Đã thu hồi' : DISPATCH_STATUSES.includes(a.dispatchStatus) ? t(`dispatch.${a.dispatchStatus}`) : a.dispatchStatus}
                </td>
                <td className="px-6 py-3 text-ink-muted">{a.sentCount}{a.totalRecipients != null ? ` / ${a.totalRecipients}` : ''}</td>
                <td className="px-6 py-3 text-ink-muted">{new Date(a.createdAt).toLocaleString(locale)}</td>
                <td className="whitespace-nowrap px-6 py-3 text-right">
                  {a.revokedAt ? (
                    <>
                      <span className="mr-2 text-xs text-ink-muted">Đã thu hồi {new Date(a.revokedAt).toLocaleDateString(locale)}</span>
                      <button type="button" disabled={restoreAnnouncement.isPending} onClick={() => restore(a)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-accent-dark hover:bg-tint disabled:opacity-50">Khôi phục</button>
                      <button type="button" onClick={() => setDeleting(a)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-danger hover:bg-tint">Xóa</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => openEdit(a)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-accent-dark hover:bg-tint">Sửa</button>
                      <button type="button" onClick={() => setRevoking(a)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-danger hover:bg-tint">Thu hồi</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(announcements?.length ?? 0) >= limit && (
          <div className="flex justify-center border-t border-line p-3">
            <button type="button" onClick={() => setLimit((n) => n + PAGE)} className="rounded-lg border border-line bg-surface-raised px-4 py-2 text-sm font-semibold text-ink hover:bg-tint">
              Xem thêm
            </button>
          </div>
        )}
      </div>

      {editing && (
        <Modal open onClose={() => setEditing(null)} title="Sửa thông báo" size="md" closeOnBackdrop={false}>
          <div className="flex flex-col gap-4">
            <p className="m-0 text-xs text-ink-muted">Thay đổi được áp dụng cho cả thông báo mà người dùng đã nhận. Phạm vi người nhận và mức độ không đổi được sau khi gửi.</p>
            <Field label={t('form.title')}>
              <input value={editTitle} maxLength={255} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </Field>
            <Field label={t('form.content')}>
              <textarea value={editContent} maxLength={5000} rows={5} onChange={(e) => setEditContent(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </Field>
            {editing.severity === 'HIGH' && (
              <Field label={t('form.expires')}>
                <input type="datetime-local" value={editExpires} onChange={(e) => setEditExpires(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </Field>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-tint">Hủy</button>
              <button
                type="button"
                disabled={updateAnnouncement.isPending || !editTitle.trim() || !editContent.trim()}
                onClick={saveEdit}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
              >
                {updateAnnouncement.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={deleting !== null}
        tone="danger"
        title="Xóa hẳn thông báo?"
        body={deleting ? `Thông báo "${deleting.title}" và các bản người dùng đã nhận sẽ bị xóa vĩnh viễn, không khôi phục được. Nếu chỉ muốn tạm ẩn, hãy giữ ở trạng thái đã thu hồi.` : ''}
        confirmLabel="Xóa hẳn"
        cancelLabel="Hủy"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      <ConfirmDialog
        open={revoking !== null}
        tone="danger"
        title="Thu hồi thông báo?"
        body={revoking ? `Thông báo "${revoking.title}" sẽ bị ẩn khỏi tất cả người dùng đã nhận (kể cả banner đầu trang). Bản ghi vẫn được giữ trong lịch sử.` : ''}
        confirmLabel="Thu hồi"
        cancelLabel="Hủy"
        onConfirm={confirmRevoke}
        onCancel={() => setRevoking(null)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
