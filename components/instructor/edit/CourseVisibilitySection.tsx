'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAddCourseInvite, useCourseInvites, useRemoveCourseInvite, useUpdateCourseVisibility } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';
import type { CourseEditDetail, CourseVisibility } from '@/types/domain';

const VISIBILITY_VALUES: CourseVisibility[] = ['PUBLIC', 'PRIVATE_INVITE', 'PRIVATE_PASSWORD'];

/** "Đăng ký (Quyền riêng tư)" kiểu Udemy (19/09/2026, tính năng mới) — trong panel Cài đặt của
 * `EditCourseLayout.tsx`. */
export function CourseVisibilitySection({ courseId, course }: { courseId: number; course: CourseEditDetail }) {
  const t = useTranslations('instructor.visibility');
  const [visibility, setVisibility] = useState<CourseVisibility>(course.visibility);
  const [password, setPassword] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    setVisibility(course.visibility);
  }, [course.visibility]);

  const updateVisibility = useUpdateCourseVisibility(courseId);
  const { data: invites, isLoading: invitesLoading } = useCourseInvites(courseId, visibility === 'PRIVATE_INVITE');
  const addInvite = useAddCourseInvite(courseId);
  const removeInvite = useRemoveCourseInvite(courseId);

  const handleSave = () => {
    updateVisibility.mutate(
      { visibility, password: password.trim() || undefined },
      { onSuccess: () => setPassword('') },
    );
  };

  const handleAddInvite = () => {
    if (!inviteEmail.trim()) return;
    addInvite.mutate(inviteEmail.trim(), { onSuccess: () => setInviteEmail('') });
  };

  return (
    <div className="flex flex-col gap-3 border-b border-line-soft p-6">
      <h3 className="m-0 text-[14px] font-bold text-ink">{t('title')}</h3>

      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as CourseVisibility)}
        className="rounded-lg border border-line px-3 py-2 text-[13px] focus:border-accent focus:outline-none"
      >
        {VISIBILITY_VALUES.map((value) => (
          <option key={value} value={value}>{t(`${value}.label`)}</option>
        ))}
      </select>
      <p className="text-[12px] text-ink-muted">
        {t(`${visibility}.helper`)}
      </p>

      {visibility === 'PRIVATE_PASSWORD' && (
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={course.hasEnrollPassword ? t('passwordKeep') : t('passwordNew')}
          className="rounded-lg border border-line px-3 py-2 text-[13px] focus:border-accent focus:outline-none"
        />
      )}

      {updateVisibility.error instanceof ApiError && (
        <p className="text-[12px] text-danger">{updateVisibility.error.message}</p>
      )}
      {updateVisibility.isSuccess && (
        <p className="text-[12px] text-success">{t('saved')}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={updateVisibility.isPending}
        className="self-start rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {updateVisibility.isPending ? t('saving') : t('save')}
      </button>

      {visibility === 'PRIVATE_INVITE' && (
        <div className="mt-2 flex flex-col gap-2 border-t border-line-soft pt-3">
          <span className="text-[12.5px] font-semibold text-ink">{t('inviteList')}</span>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddInvite()}
              placeholder="email@vidu.com"
              className="flex-1 rounded-lg border border-line px-3 py-1.5 text-[12.5px] focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddInvite}
              disabled={!inviteEmail.trim() || addInvite.isPending}
              className="shrink-0 rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('invite')}
            </button>
          </div>

          {invitesLoading && <p className="text-[12px] text-ink-faint">{t('loading')}</p>}
          {!invitesLoading && (!invites || invites.length === 0) && (
            <p className="text-[12px] text-ink-faint">{t('noInvites')}</p>
          )}
          <div className="flex flex-col gap-1">
            {invites?.map((email) => (
              <div key={email} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-1.5 text-[12.5px]">
                <span className="truncate text-ink">{email}</span>
                <button
                  type="button"
                  onClick={() => removeInvite.mutate(email)}
                  className="shrink-0 text-[11.5px] font-bold text-danger hover:text-danger"
                >
                  {t('remove')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
